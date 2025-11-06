import React from 'react';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { clearAllSavedData } from '../../utils/persistenceUtils';
import './GameControls.css';

const GameControls: React.FC = () => {
  const dispatch = useTetrixDispatchContext();

  const handleNewGame = async () => {
    try {
      await clearAllSavedData();
      dispatch({ type: 'RESET_GAME' });
      // Refresh the page to fully reset state (music, etc.)
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
        className="new-game-button"
        onClick={handleNewGame}
        type="button"
      >
        New Game
      </button>
    </div>
  );
};

export default GameControls;