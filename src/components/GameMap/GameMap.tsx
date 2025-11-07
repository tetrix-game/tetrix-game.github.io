import React, { useState } from 'react';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import './GameMap.css';

const GameMap: React.FC = () => {
  const { currentLevel } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const [inputLevel, setInputLevel] = useState(currentLevel.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLevel = Number.parseInt(inputLevel, 10);

    if (!Number.isNaN(newLevel) && newLevel >= 0) {
      dispatch({ type: 'SET_LEVEL', value: { levelIndex: newLevel } });
      dispatch({ type: 'CLOSE_MAP' });
    }
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MAP' });
  };

  return (
    <div className="game-map-overlay">
      <div className="game-map">
        <div className="game-map-header">
          <h1>Level Map</h1>
          <button
            className="close-button"
            onClick={handleClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="map-content">
          <div className="current-level-display">
            <span className="current-level-label">Current Level:</span>
            <span className="current-level-value">{currentLevel}</span>
          </div>

          <form onSubmit={handleSubmit} className="level-selector-form">
            <label htmlFor="level-input" className="level-input-label">
              Enter Level Index:
            </label>
            <div className="input-group">
              <input
                id="level-input"
                type="number"
                value={inputLevel}
                onChange={(e) => setInputLevel(e.target.value)}
                min="0"
                max="999"
                className="level-input"
                placeholder="0"
                autoFocus
              />
              <button type="submit" className="level-submit-button">
                Go to Level
              </button>
            </div>
          </form>

          <div className="map-placeholder">
            <p className="placeholder-text">
              🗺️ Full level map coming soon!
            </p>
            <p className="placeholder-description">
              This will show a visual grid of levels with different challenges,
              modifiers, and progression paths.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMap;