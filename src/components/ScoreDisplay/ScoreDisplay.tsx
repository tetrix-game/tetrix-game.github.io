import React from 'react';
import { formatScore } from '../../utils/scoringUtils';
import { convertPointsToCurrency, formatCurrencyBreakdown, getHighestCurrencyColor } from '../../utils/currencyUtils';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import './ScoreDisplay.css';

const ScoreDisplay: React.FC = () => {
  const { score, showCoinDisplay } = useTetrixStateContext();

  // Convert points to currency breakdown
  const currencyBreakdown = convertPointsToCurrency(score);
  const currencyDisplay = formatCurrencyBreakdown(currencyBreakdown);
  const displayColor = getHighestCurrencyColor(score);

  // Show currency if user has any points AND coin display is enabled, otherwise show numeric score
  const showCurrency = currencyBreakdown.length > 0 && showCoinDisplay;

  return (
    <div className="score-display">
      <span className="score-label">Score:</span>
      <span
        className="score-value"
        style={{ color: showCurrency ? displayColor : '#00ff88' }}
      >
        {showCurrency ? currencyDisplay : formatScore(score)}
      </span>
    </div>
  );
};

export default ScoreDisplay;