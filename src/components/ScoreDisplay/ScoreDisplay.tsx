import React from 'react';
import { formatScore } from '../../utils/scoringUtils';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import BlueGemIcon from '../BlueGemIcon';
import './ScoreDisplay.css';

const ScoreDisplay: React.FC = () => {
  const { score } = useTetrixStateContext();

  return (
    <div className="score-display">
      <BlueGemIcon size={20} />
      <span className="score-display-value">
        {formatScore(score)}
      </span>
    </div>
  );
};

export default ScoreDisplay;