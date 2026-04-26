import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { buildInitialState, applyCardPlay, drawFromDeck, checkUnoPenalty } from './game/engine.js';
import { getPlayableIndices, getNextIndex } from './game/deck.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Database (In-Memory Map)
const rooms = new Map();
// Structure:
// rooms.get(roomId) = {
//   id: roomId,
//   players: [{ socketId, name, character }],
//   state: null | GameState,
//   timer: null | Timeout,
//   lastActivity: Date.now()
// }

const ROOM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function clearRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    if (room.timer) clearTimeout(room.timer);
    rooms.delete(roomId);
    console.log(`[DB] Room ${roomId} removed from database (expired/empty)`);
  }
}

function resetRoomTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.lastActivity = Date.now();
  if (room.timer) clearTimeout(room.timer);
  
  room.timer = setTimeout(() => {
    console.log(`[DB] Room ${roomId} idle for 5 minutes. Expiring.`);
    io.to(roomId).emit('room_expired', 'Room expired due to inactivity (5 mins).');
    io.in(roomId).socketsLeave(roomId);
    clearRoom(roomId);
  }, ROOM_TIMEOUT_MS);
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // ── Room Management ──
  socket.on('create_room', ({ username, character, code }, callback) => {
    // If room exists, it's likely due to a React StrictMode rapid disconnect/reconnect.
    // We safely overwrite the host to the new socket ID to ensure they are in the room.
    const room = {
      id: code,
      players: [{ socketId: socket.id, name: username, character }],
      state: null,
      timer: null,
      lastActivity: Date.now(),
    };
    rooms.set(code, room);
    socket.join(code);
    resetRoomTimer(code);
    
    console.log(`[Lobby] Room created/overwritten: ${code} by ${username} (Socket: ${socket.id})`);
    callback({ success: true, room: { id: code, players: room.players } });
  });

  socket.on('join_room', ({ username, character, code }, callback) => {
    const room = rooms.get(code);
    if (!room) return callback({ error: 'Room not found or expired.' });
    if (room.state) return callback({ error: 'Game already in progress.' });
    if (room.players.length >= 4) return callback({ error: 'Room is full (max 4).' });

    room.players.push({ socketId: socket.id, name: username, character });
    socket.join(code);
    resetRoomTimer(code);

    console.log(`[Lobby] ${username} (Socket: ${socket.id}) joined room ${code}. Total players: ${room.players.length}`);
    io.to(code).emit('lobby_update', { players: room.players });
    callback({ success: true, room: { id: code, players: room.players } });
  });

  socket.on('start_game', (roomId) => {
    const room = rooms.get(roomId);
    if (!room || room.players[0].socketId !== socket.id) return; // Only host can start
    if (room.players.length < 2) return; // ENFORCED: Must have at least 2 players
    
    room.state = buildInitialState(room.players);
    resetRoomTimer(roomId);
    io.to(roomId).emit('game_started', room.state);
    console.log(`[Game] Started in room ${roomId} with ${room.players.length} players`);
  });

  // ── Gameplay Actions ──
  const handleAction = (roomId, actionFn) => {
    const room = rooms.get(roomId);
    if (!room || !room.state) return;
    const { state } = room;
    const playerIndex = state.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    actionFn(room, state, playerIndex);
    resetRoomTimer(roomId);
    io.to(roomId).emit('state_update', room.state);
  };

  socket.on('play_card', ({ roomId, cardIndex }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.currentPlayerIndex !== pIdx) return;
      if (state.phase !== 'player_turn' && state.phase !== 'player_drawn') return;
      
      const penalisedState = checkUnoPenalty(state);
      room.state = applyCardPlay(penalisedState, pIdx, cardIndex);
    });
  });

  socket.on('draw_card', ({ roomId }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.currentPlayerIndex !== pIdx || state.phase !== 'player_turn') return;
      
      let cur = checkUnoPenalty(state);
      if (cur.pendingDraw > 0) {
        const { newState, drawn } = drawFromDeck(cur, cur.pendingDraw);
        newState.players[pIdx].hand.push(...drawn);
        const nextIdx = getNextIndex(pIdx, newState.direction, newState.players.length);
        room.state = {
          ...newState, pendingDraw: 0, pendingDrawType: null,
          currentPlayerIndex: nextIdx, phase: 'player_turn',
          message: `${cur.players[pIdx].name} drew ${cur.pendingDraw} cards!`,
        };
      } else {
        const { newState, drawn } = drawFromDeck(cur, 1);
        if (drawn.length > 0) {
          const card = drawn[0];
          newState.players[pIdx].hand.push(card);
          
          const isPlayable = getPlayableIndices([card], cur.currentColor, cur.currentValue, 0, null).length > 0;
          if (!isPlayable) {
            const nextIdx = getNextIndex(pIdx, newState.direction, newState.players.length);
            room.state = {
              ...newState, currentPlayerIndex: nextIdx, phase: 'player_turn',
              message: `${newState.players[pIdx].name} drew a card.`,
            };
          } else {
            room.state = { ...newState, drawnCard: card, phase: 'player_drawn', message: `${newState.players[pIdx].name} drew a playable card.` };
          }
        }
      }
    });
  });

  socket.on('end_turn', ({ roomId }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.currentPlayerIndex !== pIdx || state.phase !== 'player_drawn') return;
      const nextIdx = getNextIndex(pIdx, state.direction, state.players.length);
      room.state = {
        ...state, drawnCard: null, currentPlayerIndex: nextIdx, phase: 'player_turn',
        message: `${state.players[nextIdx].name}'s turn!`,
      };
    });
  });

  socket.on('choose_color', ({ roomId, color }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.currentPlayerIndex !== pIdx || state.phase !== 'color_pick') return;
      const nextIdx = state._nextIdx ?? getNextIndex(pIdx, state.direction, state.players.length);
      room.state = {
        ...state, currentColor: color, currentPlayerIndex: nextIdx, phase: 'player_turn',
        message: `${state.players[pIdx].name} chose ${color}!`,
      };
    });
  });

  socket.on('call_uno', ({ roomId }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.unoCallPending === pIdx) {
        room.state = { ...state, unoCallPending: null }; // cleared penalty
      } else if (state.players[pIdx].hand.length === 2 && (state.phase === 'player_turn' || state.phase === 'player_drawn')) {
        room.state.players[pIdx].unoProtected = true; // early call
      }
    });
  });

  socket.on('challenge_wild_four', ({ roomId, doChallenge }) => {
    handleAction(roomId, (room, state, pIdx) => {
      if (state.phase !== 'challenge_pending' || !state.challengePending) return;
      const challengerIdx = state.currentPlayerIndex;
      if (challengerIdx !== pIdx) return;

      const { challengedIdx, challengedHand, prevColor } = state.challengePending;
      if (doChallenge) {
        const wasBluff = challengedHand.some(c => c.color === prevColor);
        if (wasBluff) {
          const { newState, drawn } = drawFromDeck(state, 4);
          newState.players[challengedIdx].hand.push(...drawn);
          room.state = {
            ...newState, pendingDraw: 0, pendingDrawType: null,
            currentPlayerIndex: challengerIdx, phase: 'player_turn', challengePending: null,
            message: `Challenge successful! ${state.players[challengedIdx].name} drew 4.`,
          };
        } else {
          const { newState, drawn } = drawFromDeck(state, 6);
          newState.players[challengerIdx].hand.push(...drawn);
          const nextIdx = getNextIndex(challengerIdx, state.direction, state.players.length);
          room.state = {
            ...newState, pendingDraw: 0, pendingDrawType: null,
            currentPlayerIndex: nextIdx, phase: 'player_turn', challengePending: null,
            message: `Challenge failed! ${state.players[challengerIdx].name} drew 6.`,
          };
        }
      } else {
        const { newState, drawn } = drawFromDeck(state, state.pendingDraw);
        newState.players[challengerIdx].hand.push(...drawn);
        const nextIdx = getNextIndex(challengerIdx, state.direction, state.players.length);
        room.state = {
          ...newState, pendingDraw: 0, pendingDrawType: null,
          currentPlayerIndex: nextIdx, phase: 'player_turn', challengePending: null,
          message: `${state.players[challengerIdx].name} drew ${state.pendingDraw} cards.`,
        };
      }
    });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      const pIdx = room.players.findIndex(p => p.socketId === socket.id);
      if (pIdx !== -1) {
        room.players.splice(pIdx, 1);
        io.to(roomId).emit('lobby_update', { players: room.players });
        
        if (room.players.length === 0) {
          clearRoom(roomId);
        } else if (room.state) {
          // If game is active and someone leaves, end game for now
          room.state.phase = 'game_over';
          room.state.message = 'A player disconnected. Game Over.';
          io.to(roomId).emit('state_update', room.state);
        }
      }
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`UNO Server running on port ${PORT}`);
});
