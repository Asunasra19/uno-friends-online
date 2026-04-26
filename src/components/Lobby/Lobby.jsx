import React from 'react';
import './Lobby.css';

export default function Lobby({ roomId, players, socketId, onStart, isHost, error, onBack }) {
  if (error) {
    return (
      <div className="lobby-container">
        <div className="lobby-card glass error-state">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="action-btn action-btn--primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card glass">
        <header className="lobby-header">
          <h2>Party Lobby</h2>
          <div className="room-code-badge">
            <span className="code-label">Code:</span>
            <span className="code-value">{roomId || '...'}</span>
          </div>
        </header>

        <section className="players-list">
          <h3>Players ({players.length}/4)</h3>
          <ul>
            {players.map((p, index) => (
              <li key={p.socketId} className={`player-item ${p.socketId === socketId ? 'is-me' : ''}`}>
                <span className="player-emoji">{p.character?.emoji}</span>
                <span className="player-name">{p.name}</span>
                {index === 0 && <span className="host-badge">👑 Host</span>}
                {p.socketId === socketId && <span className="me-badge">(You)</span>}
              </li>
            ))}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <li key={`empty-${i}`} className="player-item empty">
                Waiting for player...
              </li>
            ))}
          </ul>
        </section>

        <footer className="lobby-actions">
          <button className="action-btn action-btn--ghost" onClick={onBack}>Leave Party</button>
          
          {isHost ? (
            <button 
              className={`action-btn action-btn--primary ${players.length < 2 ? 'action-btn--disabled' : ''}`}
              disabled={players.length < 2}
              onClick={onStart}
            >
              Start Game
            </button>
          ) : (
            <div className="waiting-text">Waiting for host to start...</div>
          )}
        </footer>
      </div>
    </div>
  );
}
