import React from 'react';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import './MapButton.css';

const MapButton: React.FC = () => {
  const { score, isMapUnlocked, gameState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  const UNLOCK_COST = 100; // Cost to unlock map first time
  const MINIMUM_SCORE = 500; // Minimum score to show map button

  const handleMapClick = () => {
    if (isMapUnlocked) {
      // Map already unlocked - just open it
      dispatch({ type: 'OPEN_MAP' });
    } else if (score >= UNLOCK_COST) {
      // First time - unlock the map by spending points
      dispatch({ type: 'SPEND_COIN', value: { shapeIndex: -1, mousePosition: undefined } });
      dispatch({ type: 'UNLOCK_MAP' });
      dispatch({ type: 'OPEN_MAP' });
    }
  };

  // Don't show button until minimum score reached
  if (score < MINIMUM_SCORE) {
    return null;
  }

  // Don't show when map is already open
  if (gameState === 'map') {
    return null;
  }

  const isAffordable = isMapUnlocked || score >= UNLOCK_COST;
  const buttonText = isMapUnlocked ? '🗺️ Level Map' : `🗺️ Unlock Map (${UNLOCK_COST} pts)`;

  return (
    <button
      className={`map-button ${isAffordable ? '' : 'disabled'} ${isMapUnlocked ? '' : 'locked'}`}
      onClick={handleMapClick}
      disabled={!isAffordable}
      type="button"
    >
      {buttonText}
    </button>
  );
};

export default MapButton;