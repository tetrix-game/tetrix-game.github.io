import React from 'react';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import './LocationButton.css';

const LocationButton = () => {
  const { gameState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  const handleClick = (e: React.MouseEvent) => {
    // Dev backdoor: Shift+Click to open the map
    if (e.shiftKey) {
      if (gameState === 'playing') {
        dispatch({ type: 'OPEN_MAP' });
      } else {
        dispatch({ type: 'CLOSE_MAP' });
      }
      return;
    }

    // Standard behavior: Show "Coming Soon" toast
    if (gameState === 'playing') {
      const event = new CustomEvent('tetrix-show-toast', {
        detail: { message: 'Level Map Coming Soon!' }
      });
      window.dispatchEvent(event);
    } else {
      // If somehow in map mode without shift key (e.g. stuck), allow closing
      dispatch({ type: 'CLOSE_MAP' });
    }
  };

  return (
    <button className="location-button" onClick={handleClick} aria-label="Toggle Level Map">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Map pin shape */}
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Star inside the pin */}
        <path
          d="M12 6.5l1.09 2.21 2.44.36-1.77 1.72.42 2.44L12 11.77l-2.18 1.46.42-2.44-1.77-1.72 2.44-.36L12 6.5z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};

export default LocationButton;