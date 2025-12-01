import React from 'react';
import './GameOverOverlay.css';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';

const GameOverOverlay: React.FC = () => {
  const { gameMode } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  const handleRestart = () => {
    if (gameMode === 'daily') {
      dispatch({ type: 'RESTART_DAILY_CHALLENGE' });
    } else {
      dispatch({ type: 'RESET_GAME' });
    }
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h1 className="game-over-title">Game Over</h1>
        <p className="game-over-subtitle">
          Check your stats to see how you did!
        </p>
        <button className="new-game-button" onClick={handleRestart}>
          {gameMode === 'daily' ? 'Restart Challenge' : 'Back to Menu'}
        </button>
      </div>
    </div>
  );
};

export default GameOverOverlay;
