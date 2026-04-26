import React, { useState, useEffect, useCallback } from 'react';
import './GameDialog.css';
import { characters, getRandomName, getRandomCharacter, generateJoinCode } from '../../../data/characters';

/* ──────────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────────── */

function CharacterGrid({ selected, onSelect }) {
  return (
    <div className="char-grid" role="list" aria-label="Choose character">
      {characters.map((char) => (
        <button
          key={char.id}
          id={`char-${char.id}`}
          role="listitem"
          className={`char-card ${selected?.id === char.id ? 'char-card--selected' : ''}`}
          style={{ '--char-color': char.color }}
          onClick={() => onSelect(char)}
          aria-pressed={selected?.id === char.id}
          title={char.name}
        >
          <span className="char-emoji">{char.emoji}</span>
          <span className="char-name">{char.name}</span>
        </button>
      ))}
    </div>
  );
}

function NameInput({ value, onChange, onRandom }) {
  return (
    <div className="name-row">
      <div className="input-wrap">
        <input
          id="username-input"
          type="text"
          className="text-input"
          placeholder="Enter your name…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={20}
        />
      </div>
      <button
        id="btn-random-name"
        className="icon-btn"
        onClick={onRandom}
        title="Random name"
      >
        🎲
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Computer mode content
────────────────────────────────────────────────────────────── */
function ComputerContent({ onStart }) {
  const [cpuCount, setCpuCount]   = useState(1);
  const [username, setUsername]   = useState('');
  const [character, setCharacter] = useState(null);

  const randomizeName = () => setUsername(getRandomName());
  const randomizeChar = () => setCharacter(getRandomCharacter());
  const canStart = username.trim() && character;

  return (
    <div className="dialog-body">
      <section className="form-section">
        <label className="section-label">Number of Opponents</label>
        <div className="cpu-selector">
          {[1, 2, 3].map((n) => (
            <button key={n} id={`cpu-count-${n}`}
              className={`cpu-btn ${cpuCount === n ? 'cpu-btn--active' : ''}`}
              onClick={() => setCpuCount(n)}>
              <span className="cpu-btn-icon">🤖</span>
              <span>{n} {n === 1 ? 'CPU' : 'CPUs'}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="form-section">
        <label className="section-label" htmlFor="username-input">Your Name</label>
        <NameInput value={username} onChange={setUsername} onRandom={randomizeName} />
      </section>
      <section className="form-section">
        <div className="section-label-row">
          <label className="section-label">Choose Character</label>
          <button id="btn-random-char-computer" className="text-btn" onClick={randomizeChar}>🎲 Random</button>
        </div>
        <CharacterGrid selected={character} onSelect={setCharacter} />
      </section>
      <button id="btn-start-game"
        className={`action-btn action-btn--primary ${!canStart ? 'action-btn--disabled' : ''}`}
        disabled={!canStart}
        onClick={() => canStart && onStart({ mode: 'computer', humanName: username, humanCharacter: character, cpuCount })}
      >
        ▶ Start Game
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Friends mode content
────────────────────────────────────────────────────────────── */
function FriendsContent({ initialTab, onStart }) {
  const tab = initialTab || 'create';
  const [username, setUsername]   = useState('');
  const [character, setCharacter] = useState(null);
  const [joinCode, setJoinCode]   = useState(() => generateJoinCode());
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied]       = useState(false);

  const randomizeName = () => setUsername(getRandomName());
  const randomizeChar = () => setCharacter(getRandomCharacter());

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [joinCode]);

  const refreshCode = () => setJoinCode(generateJoinCode());

  const canProceed = username.trim() && character;
  const canJoin    = canProceed && inputCode.trim().length === 6;

  return (
    <div className="dialog-body">
      {/* Name */}
      <section className="form-section">
        <label className="section-label" htmlFor="username-input">Your Name</label>
        <NameInput value={username} onChange={setUsername} onRandom={randomizeName} />
      </section>

      {/* Character */}
      <section className="form-section">
        <div className="section-label-row">
          <label className="section-label">Choose Character</label>
          <button id="btn-random-char-friends" className="text-btn" onClick={randomizeChar}>🎲 Random</button>
        </div>
        <CharacterGrid selected={character} onSelect={setCharacter} />
      </section>

      {/* Create tab extras */}
      {tab === 'create' && (
        <section className="form-section">
          <div className="section-label-row">
            <label className="section-label">Your Party Code</label>
            <button id="btn-refresh-code" className="text-btn" onClick={refreshCode}>↻ New code</button>
          </div>
          <div className="join-code-box">
            <span className="join-code-text">{joinCode}</span>
            <button
              id="btn-copy-code"
              className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="code-hint">Share this code with your friends so they can join!</p>
        </section>
      )}

      {/* Join tab extras */}
      {tab === 'join' && (
        <section className="form-section">
          <label className="section-label" htmlFor="join-code-input">Enter Party Code</label>
          <div className="input-wrap">
            <input
              id="join-code-input"
              type="text"
              className="text-input text-input--code"
              placeholder="e.g. AB12CD"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
            />
          </div>
        </section>
      )}

      <button
        id={tab === 'create' ? 'btn-create-party' : 'btn-join-party'}
        className={`action-btn action-btn--primary ${(tab === 'create' ? !canProceed : !canJoin) ? 'action-btn--disabled' : ''}`}
        disabled={tab === 'create' ? !canProceed : !canJoin}
        onClick={() => {
          const ready = tab === 'create' ? canProceed : canJoin;
          if (ready) onStart({ mode: 'friends', tab, username, character, code: tab === 'create' ? joinCode : inputCode });
        }}
      >
        {tab === 'create' ? '🎉 Create & Start' : '🚀 Join Game'}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main GameDialog
────────────────────────────────────────────────────────────── */
export default function GameDialog({ mode, initialTab, onClose, onStartGame }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStart = (data) => {
    onClose();
    if (onStartGame) onStartGame(data);
  };

  const titles = {
    computer: { icon: '🖥️', label: 'Play with Computer' },
    friends:  { icon: '👥', label: initialTab === 'create' ? 'Create Room' : 'Join Room'  },
  };

  const { icon, label } = titles[mode];

  return (
    <div
      id="game-dialog-overlay"
      className="dialog-overlay"
      onClick={(e) => e.target.id === 'game-dialog-overlay' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="dialog-card glass">
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title">
            <span className="dialog-title-icon">{icon}</span>
            <h2 className="dialog-title-text">{label}</h2>
          </div>
          <button
            id="btn-close-dialog"
            className="close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="dialog-scroll">
          {mode === 'computer'
            ? <ComputerContent onStart={handleStart} />
            : <FriendsContent initialTab={initialTab} onStart={handleStart} />
          }
        </div>
      </div>
    </div>
  );
}
