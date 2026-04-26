import React, { useState } from 'react';
import LandingPage from './components/LandingPage/LandingPage';
import CardGallery from './components/CardGallery/CardGallery';
import Game from './components/Game/Game';

export default function App() {
  const [page, setPage] = useState(() => {
    return localStorage.getItem('uno_save_state') ? 'game' : 'landing';
  });
  const [gameConfig, setGameConfig] = useState(() => {
    const saved = localStorage.getItem('uno_save_state');
    try {
      return saved ? JSON.parse(saved).config : null;
    } catch (e) {
      return null;
    }
  });

  const startGame = (config) => {
    localStorage.removeItem('uno_save_state'); // Clear any old save when explicitly starting new game
    setGameConfig(config);
    setPage('game');
  };

  if (page === 'gallery') {
    return <CardGallery onBack={() => setPage('landing')} />;
  }

  if (page === 'game' && gameConfig) {
    return (
      <Game
        config={gameConfig}
        onReturnToMenu={() => {
          localStorage.removeItem('uno_save_state');
          setGameConfig(null);
          setPage('landing');
        }}
      />
    );
  }

  return (
    <LandingPage
      onStartGame={startGame}
      onViewCards={() => setPage('gallery')}
    />
  );
}
