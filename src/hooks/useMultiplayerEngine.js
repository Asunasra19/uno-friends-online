import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://uno-friends-online.onrender.com');

export function useMultiplayerEngine(config, onRoomExpired) {
  const [socket, setSocket] = useState(null);
  const [state, setState] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState(null);

  const onRoomExpiredRef = useRef(onRoomExpired);
  useEffect(() => {
    onRoomExpiredRef.current = onRoomExpired;
  }, [onRoomExpired]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    const { tab, username, character, code } = config;
    
    newSocket.on('connect', () => {
      if (tab === 'create') {
        newSocket.emit('create_room', { username, character, code }, (res) => {
          if (res.error) setError(res.error);
          else {
            setRoomId(res.room.id);
            setLobbyPlayers(res.room.players);
          }
        });
      } else {
        newSocket.emit('join_room', { username, character, code }, (res) => {
          if (res.error) setError(res.error);
          else {
            setRoomId(res.room.id);
            setLobbyPlayers(res.room.players);
          }
        });
      }
    });

    newSocket.on('lobby_update', ({ players }) => {
      setLobbyPlayers(players);
    });

    newSocket.on('game_started', (initialState) => {
      setState(initialState);
    });

    newSocket.on('state_update', (newState) => {
      setState(newState);
    });

    newSocket.on('room_expired', (msg) => {
      if (onRoomExpiredRef.current) onRoomExpiredRef.current(msg);
    });

    return () => newSocket.disconnect();
    // Use stringified config so object reference changes don't trigger re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  const startGame = useCallback(() => {
    if (socket && roomId) {
      socket.emit('start_game', roomId);
    }
  }, [socket, roomId]);

  const playCard = useCallback((cardIndex) => {
    if (socket && roomId) socket.emit('play_card', { roomId, cardIndex });
  }, [socket, roomId]);

  const drawCard = useCallback(() => {
    if (socket && roomId) socket.emit('draw_card', { roomId });
  }, [socket, roomId]);

  const endTurn = useCallback(() => {
    if (socket && roomId) socket.emit('end_turn', { roomId });
  }, [socket, roomId]);

  const chooseColor = useCallback((color) => {
    if (socket && roomId) socket.emit('choose_color', { roomId, color });
  }, [socket, roomId]);

  const callUno = useCallback(() => {
    if (socket && roomId) socket.emit('call_uno', { roomId });
  }, [socket, roomId]);

  const challengeWildFour = useCallback((doChallenge) => {
    if (socket && roomId) socket.emit('challenge_wild_four', { roomId, doChallenge });
  }, [socket, roomId]);

  // Restarting is handled by starting a new game (or returning to lobby)
  const restartGame = useCallback(() => {
    if (socket && roomId) socket.emit('start_game', roomId);
  }, [socket, roomId]);

  return {
    socketId: socket?.id,
    lobbyPlayers,
    roomId,
    error,
    startGame,
    state,
    playCard,
    drawCard,
    endTurn,
    chooseColor,
    callUno,
    challengeWildFour,
    restartGame
  };
}
