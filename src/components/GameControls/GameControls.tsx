import React from 'react';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { clearGameBoard } from '../../utils/persistence';
import './GameControls.css';

const GameControls: React.FC = () => {
  const dispatch = useTetrixDispatchContext();

  const handleNewGame = async () => {
    try {
      await clearGameBoard(); // Clear board & score, but preserve stats
      dispatch({ type: 'RESET_GAME' });
      // Refresh the page to fully reset state (shapes, etc.)
      globalThis.location.reload();
    } catch (error) {
      console.error('Failed to reset game:', error);
      // Still reset the game state even if clearing storage fails
      dispatch({ type: 'RESET_GAME' });
    }
  };

  return (
    <div className="game-controls">
      <button
        className="game-controls-button"
        onClick={handleNewGame}
        type="button"
      >
        New Game
      </button>
    </div>
  );
};

export default GameControls;