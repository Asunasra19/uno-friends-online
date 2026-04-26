import React from 'react';
import UnoCard from '../UnoCard/UnoCard';
import './OpponentHand.css';

export default function OpponentHand({ player, position, isActive, currentColor }) {
  const COLOR_HEX = {
    red: '#D32F2F', yellow: '#F9A825', green: '#2E7D32', blue: '#1565C0',
  };
  const count = player.hand.length;
  const shown = Math.min(count, 10);

  return (
    <div className={[
      'opp-root',
      `opp-root--${position}`,
      isActive ? 'opp-root--active' : '',
    ].join(' ')}>

      {/* Name badge */}
      <div className="opp-info" style={{ '--cc': COLOR_HEX[currentColor] ?? '#ffd700' }}>
        <span className="opp-emoji">{player.character?.emoji ?? '🤖'}</span>
        <span className="opp-name">{player.name}</span>
        <span className="opp-count">{count}</span>
        {count === 1 && <span className="opp-uno">UNO</span>}
      </div>

      {/* Card fan */}
      <div className={`opp-fan opp-fan--${position}`}>
        {Array.from({ length: shown }).map((_, i) => {
          const center = (shown - 1) / 2;
          const offset = i - center;
          const angle = offset * 6;
          const yOffset = Math.abs(offset) * 2.5;

          return (
            <div
              key={i}
              className={`opp-card opp-card--${position}`}
              style={{ '--rot': `${angle}deg`, '--y': `${yOffset}px`, zIndex: i }}
            >
              <UnoCard type="back" width={position === 'top' ? 64 : 56} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
