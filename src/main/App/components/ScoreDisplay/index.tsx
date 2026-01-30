import React, { useRef, useEffect } from 'react';

import { Shared_BlueGemIcon } from '../../../Shared/BlueGemIcon';
import { useVisualError } from '../../hooks/useVisualError';
import { formatScore } from '../../Shared/Shared_scoringUtils';
import { useTetrixDispatchContext } from '../../Shared/Shared_TetrixProvider';
import { useTetrixStateContext } from '../../Shared/Shared_TetrixProvider';
import { ErrorPointer } from '../Pointer/ErrorPointer';
import { StatsOverlay } from '../StatsOverlay';
import '../../styles/feedback.css';
import './ScoreDisplay.css';

export const ScoreDisplay: React.FC = (): JSX.Element => {
  const { score, gameState, isStatsOpen, insufficientFundsError } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gemIconRef = useRef<HTMLDivElement>(null);

  // Use the reusable hook for error pulsing
  const isErrorPulsing = useVisualError(insufficientFundsError);

  // Use the reusable hook for arrow visibility (longer duration)
  const isArrowVisible = useVisualError(insufficientFundsError, 2500);

  // Update gem icon position whenever it changes (for GemShower particle physics)
  useEffect((): (() => void) | void => {
    if (gemIconRef.current) {
      const updatePosition = (): void => {
        const rect = gemIconRef.current?.getBoundingClientRect();
        if (rect) {
          const position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          dispatch({
            type: 'UPDATE_GEM_ICON_POSITION',
            value: position,
          });
        }
      };

      // Update on mount and when window resizes
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return (): void => window.removeEventListener('resize', updatePosition);
    }
  }, [dispatch]);

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
        <div ref={gemIconRef}>
          <Shared_BlueGemIcon />
        </div>
        <span className="score-display-value">
          {formatScore(score)}
        </span>
      </div>

      <ErrorPointer
        targetRef={gemIconRef}
        isVisible={isArrowVisible}
        message="Need points to turn shapes!"
        offsetFromTarget={50}
      />

      {isStatsOpen && <StatsOverlay onClose={handleCloseStats} />}
    </>
  );
};
