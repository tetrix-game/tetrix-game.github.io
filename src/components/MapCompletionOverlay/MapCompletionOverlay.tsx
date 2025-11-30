import React from 'react';
import './MapCompletionOverlay.css';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import Grid from '../Grid';

interface MapCompletionOverlayProps {
  stars: number; // 0-3 stars (0 = failure)
  matchedTiles: number;
  totalTiles: number;
  missedTiles: number;
}

const MapCompletionOverlay: React.FC<MapCompletionOverlayProps> = ({
  stars,
  matchedTiles,
  totalTiles,
  missedTiles,
}) => {
  const dispatch = useTetrixDispatchContext();
  const { gameMode } = useTetrixStateContext();

  const isSuccess = stars > 0;

  const handleContinue = () => {
    // Close the completion overlay and return to hub/map
    if (gameMode === 'daily') {
      dispatch({ type: 'SET_GAME_MODE', value: { mode: 'hub' } });
    } else {
      dispatch({ type: 'CLOSE_MAP' });
    }
  };

  const handleRetry = () => {
    // Reset the current level
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="map-completion-overlay">
      <div className="map-completion-content">
        <div className="completion-grid-preview">
          <Grid />
        </div>
        
        <div className="completion-details">
          <h1 className={`completion-title ${isSuccess ? 'success' : 'failure'}`}>
            {isSuccess ? 'Level Complete!' : 'Level Failed'}
          </h1>
          
          {isSuccess && (
            <div className="star-rating">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= stars ? 'filled' : 'empty'}`}
                >
                  ★
                </span>
              ))}
            </div>
          )}
          
          <div className="completion-stats">
            <div className="stat-row">
              <span className="stat-label">Matched Tiles:</span>
              <span className="stat-value">{matchedTiles} / {totalTiles}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Missed Tiles:</span>
              <span className={`stat-value ${missedTiles === 0 ? 'perfect' : 'miss'}`}>
                {missedTiles}
              </span>
            </div>
          </div>
          
          {isSuccess && (
            <div className="rating-description">
              {stars === 3 && <p>Perfect! All tiles matched their target colors!</p>}
              {stars === 2 && <p>Great job! Only 1-2 tiles didn't match.</p>}
              {stars === 1 && <p>Good effort! 3-5 tiles need correction.</p>}
            </div>
          )}
          
          {!isSuccess && (
            <div className="failure-message">
              <p>Too many tiles didn't match their target colors.</p>
              <p>Try again to achieve a better result!</p>
            </div>
          )}
          
          <div className="completion-actions">
            <button className="retry-button" onClick={handleRetry}>
              Try Again
            </button>
            <button className="continue-button" onClick={handleContinue}>
              {gameMode === 'daily' ? 'Back to Hub' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapCompletionOverlay;
