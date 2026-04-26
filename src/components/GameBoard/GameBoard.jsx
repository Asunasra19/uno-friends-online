import React from 'react';
import UnoCard from '../UnoCard/UnoCard';
import OpponentHand from '../OpponentHand/OpponentHand';
import PlayerHand from '../PlayerHand/PlayerHand';
import { getPlayableIndices } from '../../data/deck';
import './GameBoard.css';

const COLOR_HEX = {
  red: '#D32F2F', yellow: '#F9A825', green: '#2E7D32', blue: '#1565C0',
};

export default function GameBoard({ state, onPlay, onDraw, onEndTurn, onCallUno }) {
  const {
    players, currentPlayerIndex, phase,
    discardPile, deck, currentColor, currentValue,
    direction, pendingDraw, pendingDrawType, message, drawnCard,
    unoCallPending,
  } = state;

  const human   = players[0];
  const cpus    = players.slice(1);          // cpu[0]=top, cpu[1]=left, cpu[2]=right
  const topCard = discardPile[0];

  const playableIndices = (phase === 'player_turn' || phase === 'player_drawn')
    ? getPlayableIndices(human.hand, currentColor, currentValue, pendingDraw, pendingDrawType)
    : [];

  // Show UNO button if:
  // 1. They have 1 card and haven't called it (vulnerable state)
  // OR 2. They have 2 cards, it's their turn, they have a playable card, and they haven't pre-called UNO yet
  const canCallUnoEarly = (phase === 'player_turn' || phase === 'player_drawn') 
    && human.hand.length === 2 
    && playableIndices.length > 0 
    && !state.humanCalledUnoEarly;
    
  const humanNeedsUno = unoCallPending === 0 || canCallUnoEarly;
  const isHumanTurn = phase === 'player_turn' || phase === 'player_drawn';
  const mustDraw = phase === 'player_turn' && playableIndices.length === 0;

  return (
    <div className="gb-root">

      {/* ── Status bar ── */}
      <div className="gb-status">
        <div className="gb-color-ring" style={{ '--cc': COLOR_HEX[currentColor] ?? '#888' }} />
        <span className="gb-msg">{message}</span>
        {pendingDraw > 0 && <span className="gb-draw-warn">⚠ Draw {pendingDraw}</span>}
        <div key={direction} className="gb-dir-container">
          <span className="gb-dir">{direction === 1 ? '⟳' : '⟲'}</span>
        </div>
      </div>

      {/* ── Table grid ── */}
      <div className="gb-table">

        {/* Top opponent */}
        <div className="gb-zone gb-zone--top">
          {cpus[0] && (
            <OpponentHand player={cpus[0]} position="top" isActive={currentPlayerIndex === 1} currentColor={currentColor} />
          )}
        </div>

        {/* Left opponent */}
        <div className="gb-zone gb-zone--left">
          {cpus[1] && (
            <OpponentHand player={cpus[1]} position="left" isActive={currentPlayerIndex === 2} currentColor={currentColor} />
          )}
        </div>

        {/* Center piles */}
        <div className="gb-zone gb-zone--center">
          {/* Draw pile */}
          <div
            id="draw-pile"
            className={`gb-pile gb-pile--draw ${phase === 'player_turn' ? 'gb-pile--clickable' : ''} ${mustDraw ? 'gb-pile--highlight' : ''}`}
            onClick={phase === 'player_turn' ? onDraw : undefined}
            title="Draw a card"
          >
            <UnoCard type="back" width={90} />
            <span className="gb-pile-label">Draw ({deck.length})</span>
          </div>

          {/* Active colour indicator */}
          <div className="gb-color-indicator" style={{ '--cc': COLOR_HEX[currentColor] ?? '#888' }}>
            <div className="gb-color-dot" />
            <span className="gb-color-name">{currentColor ?? '—'}</span>
          </div>

          {/* Discard pile */}
          <div id="discard-pile" className="gb-pile gb-pile--discard">
            {topCard && (
              <div key={topCard.id} className="discard-drop-anim">
                <UnoCard color={topCard.color} type={topCard.type} value={topCard.value} width={100} />
              </div>
            )}
            <span className="gb-pile-label">Discard</span>
          </div>
        </div>

        {/* Right opponent */}
        <div className="gb-zone gb-zone--right">
          {cpus[2] && (
            <OpponentHand player={cpus[2]} position="right" isActive={currentPlayerIndex === 3} currentColor={currentColor} />
          )}
        </div>

        {/* Bottom — player hand */}
        <div className="gb-zone gb-zone--bottom">
          <div className={`gb-player-info ${isHumanTurn ? 'gb-player-info--active' : ''}`} style={{ '--cc': COLOR_HEX[currentColor] ?? '#ffd700' }}>
            <span className="gb-player-emoji">{human.character?.emoji ?? '🧑'}</span>
            <span className="gb-player-name">{human.name}</span>
            <span className="gb-player-count">{human.hand.length} cards</span>
            {human.hand.length === 1 && !humanNeedsUno && (
              <span className="gb-uno-badge">UNO!</span>
            )}
            {humanNeedsUno && (
              <button id="btn-call-uno" className="gb-uno-btn" onClick={onCallUno} title="Call UNO!">
                🗣 UNO!
              </button>
            )}
          </div>
          <PlayerHand
            hand={human.hand}
            playableIndices={playableIndices}
            drawnCard={drawnCard}
            phase={phase}
            onPlay={onPlay}
            onEndTurn={onEndTurn}
          />
        </div>
      </div>
    </div>
  );
}
