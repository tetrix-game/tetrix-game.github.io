import React, { useState, useEffect, useRef } from 'react';

import { BoardClearIcon } from '../BoardClearIcon';
import { BoardClearShower } from '../BoardClearShower';
import { useTetrixStateContext } from '../TetrixProvider';
import './BoardClearDisplay.css';

export const BoardClearDisplay: React.FC = () => {
  const { stats, boardClearIconPulseCount } = useTetrixStateContext();
  const iconRef = useRef<HTMLDivElement>(null);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Extract values with safety checks
  const currentBoardClears = stats?.current?.fullBoardClears?.total ?? 0;
  const allTimeBoardClears = stats?.allTime?.fullBoardClears?.total ?? 0;

  // Trigger animation on first board clear
  useEffect((): void => {
    if (currentBoardClears > 0 && !hasAnimatedIn) {
      setHasAnimatedIn(true);
    }
  }, [currentBoardClears, hasAnimatedIn]);

  // Trigger pulse animation when pulse count changes
  useEffect((): (() => void) | void => {
    if (boardClearIconPulseCount > 0) {
      setIsPulsing(true);
      const timeout = setTimeout(() => setIsPulsing(false), 300);
      return (): void => clearTimeout(timeout);
    }
  }, [boardClearIconPulseCount]);

  // Hide completely if no board clears ever
  if (allTimeBoardClears === 0) {
    return null;
  }

  const animationClass = hasAnimatedIn && currentBoardClears === 1
    ? 'board-clear-display-slide-in'
    : '';

  return (
    <>
      <div
        className={`board-clear-display ${animationClass}`}
        title={`Board clears this game: ${currentBoardClears} (${allTimeBoardClears} all time)`}
      >
        <div ref={iconRef} className={isPulsing ? 'pulse' : ''}>
          <BoardClearIcon />
        </div>
        <span className="board-clear-display-value">
          {currentBoardClears}
        </span>
      </div>

      <BoardClearShower boardClearIconRef={iconRef} />
    </>
  );
};
