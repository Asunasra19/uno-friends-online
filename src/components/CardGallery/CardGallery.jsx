import React, { useState } from 'react';
import './CardGallery.css';
import UnoCard from '../UnoCard/UnoCard';
import { ALL_CARDS, COLORS } from '../../data/cards';

const SECTIONS = [
  { label: 'Red Cards',    filter: (c) => c.color === 'red'    },
  { label: 'Yellow Cards', filter: (c) => c.color === 'yellow' },
  { label: 'Green Cards',  filter: (c) => c.color === 'green'  },
  { label: 'Blue Cards',   filter: (c) => c.color === 'blue'   },
  { label: 'Wild Cards',   filter: (c) => c.type  === 'wild'   },
];

export default function CardGallery({ onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="gallery-root">
      <header className="gallery-header">
        <button className="gallery-back" onClick={onBack}>← Back</button>
        <div className="gallery-title-wrap">
          <h1 className="gallery-title">UNO Card Gallery</h1>
          <span className="gallery-count">54 unique card designs</span>
        </div>
      </header>

      <div className="gallery-body">
        {SECTIONS.map(({ label, filter }) => {
          const cards = ALL_CARDS.filter(filter);
          const color = cards[0]?.color;
          const accent = color ? COLORS[color]?.bg : '#c44eff';
          return (
            <section key={label} className="gallery-section">
              <h2 className="gallery-section-title" style={{ '--accent': accent }}>
                {label}
              </h2>
              <div className="gallery-grid">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`gallery-card-wrap ${hovered === card.id ? 'gallery-card-wrap--hovered' : ''}`}
                    onMouseEnter={() => setHovered(card.id)}
                    onMouseLeave={() => setHovered(null)}
                    title={card.id.replace(/_/g, ' ')}
                  >
                    <UnoCard
                      cardId={card.id}
                      color={card.color}
                      type={card.type}
                      value={card.value}
                      width={90}
                    />
                    <span className="gallery-card-label">
                      {card.value === 'wild_plus4' ? 'Wild +4'
                        : card.value === 'wild' ? 'Wild'
                        : card.value === 'skip' ? 'Skip'
                        : card.value === 'reverse' ? 'Rev'
                        : card.value === 'plus2' ? '+2'
                        : card.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
