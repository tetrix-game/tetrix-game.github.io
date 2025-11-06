import React from 'react';
import { formatScore } from '../../utils/scoringUtils';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import './ScoreDisplay.css';

const ScoreDisplay: React.FC = () => {
  const { score } = useTetrixStateContext();

  return (
    <div className="score-display">
      <span className="score-label">Score:</span>
      <span className="score-value">{formatScore(score)}</span>
    </div>
  );
};

export default ScoreDisplay;