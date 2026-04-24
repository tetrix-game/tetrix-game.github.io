import React, { useRef, useEffect, useState } from 'react';

import { BlueGemIcon } from '../BlueGemIcon';
import { GemShower } from '../GemShower';
import { ErrorPointer } from '../Pointer/ErrorPointer';
import { formatScore } from '../scoringUtils';
import { StatsOverlay } from '../StatsOverlay';
import {
  useTetrixDispatchContext,
  useTetrixStateContext,
} from '../TetrixProvider';
import { useVisualError } from '../useVisualError';
import '../App/feedback.css';
import './ScoreDisplay.css';

export const ScoreDisplay: React.FC = (): JSX.Element => {
  const {
    score,
    gameState,
    isStatsOpen,
    insufficientFundsError,
    gemIconPulseCount,
  } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gemIconRef = useRef<HTMLDivElement>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  // Use the reusable hook for error pulsing
  const isErrorPulsing = useVisualError(insufficientFundsError);

  // Use the reusable hook for arrow visibility (longer duration)
  const isArrowVisible = useVisualError(insufficientFundsError, 2500);

  // Trigger pulse animation when pulse count changes
  useEffect((): (() => void) | void => {
    if (gemIconPulseCount > 0) {
      setIsPulsing(true);
      const timeout = setTimeout(() => setIsPulsing(false), 300);
      return (): void => clearTimeout(timeout);
    }
  }, [gemIconPulseCount]);

  const handleOpenStats = (): void => {
    dispatch({ type: 'OPEN_STATS' });
  };

  const handleCloseStats = (): void => {
    dispatch({ type: 'CLOSE_STATS' });
  };

  return (
    <>
      <div
        className={`score-display ${gameState === 'gameover' ? 'score-display-pulsing' : ''} ${isErrorPulsing ? 'error-pulse' : ''}`}
        onClick={handleOpenStats}
        style={{ cursor: 'pointer' }}
        title="Click to view stats"
      >
        <div ref={gemIconRef} className={isPulsing ? 'pulse' : ''}>
          <BlueGemIcon />
        </div>
        <span className="score-display-value" data-testid="score">
          {formatScore(score)}
        </span>
      </div>

      <ErrorPointer
        targetRef={gemIconRef}
        isVisible={isArrowVisible}
        message="Need points to turn shapes!"
        offsetFromTarget={50}
      />

      <GemShower gemIconRef={gemIconRef} />

      {isStatsOpen && <StatsOverlay onClose={handleCloseStats} />}
    </>
  );
};
