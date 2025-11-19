import React, { useRef, useEffect, useState } from 'react';
import { formatScore } from '../../utils/scoringUtils';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlueGemIcon from '../BlueGemIcon';
import StatsOverlay from '../StatsOverlay/StatsOverlay';
import './ScoreDisplay.css';

const ScoreDisplay: React.FC = () => {
  const { score } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gemIconRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  // Update gem icon position whenever it changes
  useEffect(() => {
    if (gemIconRef.current) {
      const updatePosition = () => {
        const rect = gemIconRef.current?.getBoundingClientRect();
        if (rect) {
          const position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          console.log('ScoreDisplay: updating gem icon position to', position);
          dispatch({
            type: 'UPDATE_GEM_ICON_POSITION',
            value: position
          });
        }
      };

      // Update on mount and when window resizes
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [dispatch]);

  return (
    <>
      <div className="score-display" onClick={() => setShowStats(true)} style={{ cursor: 'pointer' }} title="Click to view stats">
        <div ref={gemIconRef}>
          <BlueGemIcon />
        </div>
        <span className="score-display-value">
          {formatScore(score)}
        </span>
      </div>
      {showStats && <StatsOverlay onClose={() => setShowStats(false)} />}
    </>
  );
};

export default ScoreDisplay;