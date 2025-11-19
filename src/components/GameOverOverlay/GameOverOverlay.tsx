import React from 'react';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import './GameOverOverlay.css';

const GameOverOverlay: React.FC = () => {
  const dispatch = useTetrixDispatchContext();

  const handleNewGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

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
