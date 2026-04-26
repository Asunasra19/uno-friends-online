import React from 'react';
import UnoCard from '../UnoCard/UnoCard';
import './PlayerHand.css';

export default function PlayerHand({
  hand, playableIndices, drawnCard,
  phase, onPlay, onEndTurn,
}) {
  const isMyTurn  = phase === 'player_turn' || phase === 'player_drawn';
  const hasDrawn  = phase === 'player_drawn';

  return (
    <div className="ph-root">
      <div className="ph-cards" style={{ '--count': hand.length }}>
        {hand.map((card, i) => {
          const isPlayable = playableIndices.includes(i);
          const isJustDrawn = hasDrawn && card === drawnCard;
          
          // Compute arc layout
          const center = (hand.length - 1) / 2;
          const offset = i - center;
          const angle = offset * 4;
          const yOffset = Math.abs(offset) * 3;

          return (
            <div
              key={card.id}
              className={[
                'ph-card',
                isPlayable && isMyTurn ? 'ph-card--playable' : '',
                isJustDrawn ? 'ph-card--drawn' : '',
                !isPlayable && isMyTurn ? 'ph-card--dim' : '',
              ].join(' ')}
              style={{ 
                '--rot': `${angle}deg`, 
                '--y': `${yOffset}px`,
                zIndex: i 
              }}
              onClick={() => isPlayable && isMyTurn && onPlay(i)}
              title={isPlayable ? `Play ${card.color ?? ''} ${card.value}` : ''}
            >
              <UnoCard
                color={card.color}
                type={card.type}
                value={card.value}
                width={110}
              />
            </div>
          );
        })}
      </div>

      {hasDrawn && (
        <button id="btn-end-turn" className="ph-end-btn" onClick={onEndTurn}>
          End Turn →
        </button>
      )}
    </div>
  );
}
