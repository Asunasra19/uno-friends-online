import React, { useState } from 'react';
import './LandingPage.css';
import GameDialog from '../../helpers/dialogs/GameDialog/GameDialog';

/* ── Floating background UNO card decorations ─────────────── */
const BG_CARDS = [
  { src: '/cards/red_plus4.png', glow: '#ff3b3b', rot: -18, sc: 0.9, top: '8%', left: '4%', delay: '0s' },
  { src: '/cards/yellow_reverse.png', glow: '#ffd700', rot: 12, sc: 1.1, top: '15%', left: '88%', delay: '0.8s' },
  { src: '/cards/green_skip.png', glow: '#00e676', rot: -8, sc: 0.8, top: '70%', left: '6%', delay: '1.4s' },
  { src: '/cards/blue_plus2.png', glow: '#2979ff', rot: 22, sc: 1.0, top: '75%', left: '90%', delay: '0.4s' },
  { src: '/cards/wild.png', glow: '#c44eff', rot: -30, sc: 0.75, top: '45%', left: '2%', delay: '2s' },
  { src: '/cards/red_7.png', glow: '#ff7043', rot: 15, sc: 0.85, top: '50%', left: '93%', delay: '1.1s' },
  { src: '/cards/blue_reverse.png', glow: '#2979ff', rot: -12, sc: 0.7, top: '85%', left: '45%', delay: '1.7s' },
  { src: '/cards/green_0.png', glow: '#00e676', rot: 28, sc: 0.95, top: '5%', left: '52%', delay: '0.3s' },
];

/* ── Ring card images (4 positions around UNO badge) ──────── */
const RING_CARDS = [
  { src: '/cards/yellow_reverse.png', glow: '#ffd700', pos: 'top' },
  { src: '/cards/blue_plus2.png', glow: '#2979ff', pos: 'right' },
  { src: '/cards/green_skip.png', glow: '#00e676', pos: 'bottom' },
  { src: '/cards/red_plus4.png', glow: '#ff3b3b', pos: 'left' },
];

function FloatingCard({ src, glow, rot, sc, top, left, delay }) {
  return (
    <img
      src={src}
      alt="UNO card"
      className="bg-card"
      style={{
        '--rot': `${rot}deg`,
        '--sc': sc,
        top, left,
        animationDelay: delay,
        filter: `drop-shadow(0 0 14px ${glow}99) drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
      }}
    />
  );
}

export default function LandingPage({ onViewCards, onStartGame }) {
  const [dialogState, setDialogState] = useState(null); // { mode: 'computer' | 'friends', tab?: 'create' | 'join' }
  const landingRef = React.useRef(null);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!landingRef.current) return;
      const { clientWidth, clientHeight } = document.documentElement;
      const x = (e.clientX / clientWidth) * 2 - 1; // -1 to 1
      const y = (e.clientY / clientHeight) * 2 - 1; // -1 to 1
      landingRef.current.style.setProperty('--mouse-x', x);
      landingRef.current.style.setProperty('--mouse-y', y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-root" ref={landingRef} style={{ '--mouse-x': 0, '--mouse-y': 0 }}>
      {/* ── Animated background ── */}
      <div className="bg-layer parallax-layer" aria-hidden="true">
        <div className="bg-rays"></div>
        <div className="particles-layer"></div>
        {BG_CARDS.map((c, i) => <FloatingCard key={i} {...c} />)}
        <div className="confetti-container">
          <div className="confetti" style={{ top: '10%', left: '20%', '--color': '#ff3b3b' }}></div>
          <div className="confetti" style={{ top: '80%', left: '15%', '--color': '#ffd700' }}></div>
          <div className="confetti" style={{ top: '25%', left: '80%', '--color': '#00e676' }}></div>
          <div className="confetti" style={{ top: '70%', left: '85%', '--color': '#2979ff' }}></div>
          <div className="confetti" style={{ top: '50%', left: '50%', '--color': '#c44eff' }}></div>
        </div>
      </div>

      {/* ── Header ── */}
      {/* <header className="landing-header">
        {onViewCards && (
          <button className="header-btn" onClick={onViewCards}>
            <span className="icon">📖</span> How to Play
          </button>
        )}
        <button className="header-btn">
          <span className="icon">⚙️</span> Settings
        </button>
      </header> */}

      {/* ── Hero content ── */}
      <main className="hero">
        {/* Logo */}
        <div className="hero-logo-wrap animate-fade-up">
          <div className="hero-logo-badge">UNO</div>
        </div>
        <div className="hero-subtitle animate-fade-up" style={{ animationDelay: '0.1s' }}>
          The classic card game for everyone!
        </div>

        <div className="mode-cards-container animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {/* Friends Card */}
          <div className="mode-card mode-card--friends">
            <div className="mode-card-content">
              <div className="mode-card-icon">👥</div>
              <h2>PLAY WITH<br />FRIENDS</h2>
              <p>Create a room and invite your friends for a classic game of UNO.</p>
            </div>
            <div className="mode-card-actions">
              <button
                className="mode-btn mode-btn--friends"
                onClick={() => setDialogState({ mode: 'friends', tab: 'create' })}
              >
                CREATE ROOM &gt;
              </button>
              <button
                className="mode-btn mode-btn--friends"
                onClick={() => setDialogState({ mode: 'friends', tab: 'join' })}
              >
                JOIN ROOM &gt;
              </button>
            </div>
          </div>

          {/* Bots Card */}
          <div className="mode-card mode-card--bots">
            <div className="mode-card-content">
              <div className="mode-card-icon">🤖</div>
              <h2>PLAY WITH<br />BOTS</h2>
              <p>Challenge our intelligent AI bots and practice your skills.</p>
            </div>
            <div className="mode-card-actions">
              <button
                className="mode-btn mode-btn--bots"
                onClick={() => setDialogState({ mode: 'computer' })}
              >
                PLAY WITH BOTS &gt;
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* <footer className="landing-footer animate-fade-up" style={{ animationDelay: '0.4s' }}>
        ENJOY THE GAME! Have fun and play fair! ❤️
      </footer> */}

      {/* ── Dialog ── */}
      {dialogState && (
        <GameDialog
          mode={dialogState.mode}
          initialTab={dialogState.tab}
          onClose={() => setDialogState(null)}
          onStartGame={onStartGame}
        />
      )}
    </div>
  );
}
