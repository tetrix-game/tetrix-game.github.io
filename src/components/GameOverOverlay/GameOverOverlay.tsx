import React from 'react';
import './GameOverOverlay.css';

const GameOverOverlay: React.FC = () => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h1 className="game-over-title">Game Over</h1>
        <p className="game-over-subtitle">
          Check your stats to see how you did!
        </p>
      </div>
    </div>
  );
};

export default GameOverOverlay;
