import React from 'react';
import './Game.css';
import { useGameEngine } from '../../hooks/useGameEngine';
import { useMultiplayerEngine } from '../../hooks/useMultiplayerEngine';
import GameBoard from '../GameBoard/GameBoard';
import ColorPicker from '../ColorPicker/ColorPicker';
import Lobby from '../Lobby/Lobby';

function shiftStateForLocalPlayer(state, localSocketId) {
  if (!state || !state.players) return state;
  const localIdx = state.players.findIndex(p => p.socketId === localSocketId);
  if (localIdx <= 0) return state; // Already at index 0 or not found

  const n = state.players.length;
  const shiftIdx = (idx) => idx === null || idx === undefined ? idx : (idx - localIdx + n) % n;

  const newPlayers = [...state.players.slice(localIdx), ...state.players.slice(0, localIdx)];

  return {
    ...state,
    players: newPlayers,
    currentPlayerIndex: shiftIdx(state.currentPlayerIndex),
    unoCallPending: shiftIdx(state.unoCallPending),
    challengePending: state.challengePending ? {
      ...state.challengePending,
      challengedIdx: shiftIdx(state.challengePending.challengedIdx)
    } : null,
    _nextIdx: shiftIdx(state._nextIdx)
  };
}

export default function Game({ config, onReturnToMenu }) {
  if (config.mode === 'friends') {
    return <MultiplayerGame config={config} onReturnToMenu={onReturnToMenu} />;
  }
  return <SingleplayerGame config={config} onReturnToMenu={onReturnToMenu} />;
}

function MultiplayerGame({ config, onReturnToMenu }) {
  const engine = useMultiplayerEngine(config, (msg) => {
    alert(`Room Closed: ${msg}`);
    onReturnToMenu();
  });
  
  const { 
    socketId, lobbyPlayers, roomId, error, startGame, 
    state: rawState, playCard, drawCard, endTurn, chooseColor, callUno, challengeWildFour, restartGame 
  } = engine;

  if (error) {
    return <Lobby error={error} onBack={onReturnToMenu} />;
  }

  if (!rawState) {
    const isHost = lobbyPlayers[0]?.socketId === socketId;
    return <Lobby roomId={roomId} players={lobbyPlayers} socketId={socketId} onStart={startGame} isHost={isHost} onBack={onReturnToMenu} />;
  }

  const state = shiftStateForLocalPlayer(rawState, socketId);
  return (
    <GameView 
      state={state} 
      onReturnToMenu={onReturnToMenu} 
      playCard={playCard} drawCard={drawCard} endTurn={endTurn} 
      chooseColor={chooseColor} callUno={callUno} challengeWildFour={challengeWildFour} restartGame={restartGame} 
    />
  );
}

function SingleplayerGame({ config, onReturnToMenu }) {
  const {
    state, playCard, drawCard, endTurn,
    chooseColor, callUno, challengeWildFour, restartGame,
  } = useGameEngine(config);

  return (
    <GameView 
      state={state} 
      onReturnToMenu={onReturnToMenu} 
      playCard={playCard} drawCard={drawCard} endTurn={endTurn} 
      chooseColor={chooseColor} callUno={callUno} challengeWildFour={challengeWildFour} restartGame={restartGame} 
    />
  );
}

function GameView({ state, onReturnToMenu, playCard, drawCard, endTurn, chooseColor, callUno, challengeWildFour, restartGame }) {
  const { phase, winner, message, pendingDraw, players, currentColor } = state;

  const challenger = state.challengePending
    ? players[state.challengePending.challengedIdx]
    : null;

  const colorMap = {
    red: '#5c1c1c',     // Dark red
    blue: '#162e54',    // Dark blue
    green: '#1a4721',   // Dark green
    yellow: '#664d00'   // Dark yellow
  };
  const bgStyle = colorMap[currentColor] || 'var(--color-bg)';

  return (
    <div className="game-root" style={{ backgroundColor: bgStyle, transition: 'background-color 0.8s ease' }}>
      {phase === 'color_pick' && (
        <ColorPicker onChoose={chooseColor} />
      )}

      {phase === 'challenge_pending' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Challenge Wild +4">
          <div className="modal-card challenge-modal">
            <div className="modal-icon">🃏</div>
            <h2 className="modal-title">Wild +4 Played!</h2>
            <p className="modal-body">
              <strong>{challenger?.name ?? 'Opponent'}</strong> played Wild +4.<br />
              Think it was illegal? Challenge it!
            </p>
            <p className="modal-sub">
              ✅ Correct challenge → they draw 4, you go free.<br />
              ❌ Wrong challenge → you draw {(pendingDraw ?? 4) + 2} cards.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--danger" onClick={() => challengeWildFour(true)}>
                ⚔️ Challenge!
              </button>
              <button className="modal-btn modal-btn--primary" onClick={() => challengeWildFour(false)}>
                ✋ Accept & Draw {pendingDraw ?? 4}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'game_over' && (
        <div className="modal-overlay">
          <div className="modal-card go-modal">
            <div className="modal-icon">{winner?.isHuman ? '🏆' : '😢'}</div>
            <h2 className="modal-title go-title">
              {winner?.isHuman ? 'You Win!' : `${winner?.name} Wins!`}
            </h2>
            <p className="modal-body">{message}</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--success" onClick={restartGame}>
                🔄 Play Again
              </button>
              <button className="modal-btn modal-btn--ghost" onClick={onReturnToMenu}>
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <GameBoard
        state={state}
        onPlay={playCard}
        onDraw={drawCard}
        onEndTurn={endTurn}
        onCallUno={callUno}
      />
    </div>
  );
}
