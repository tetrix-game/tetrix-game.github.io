import React, { useState, useEffect } from 'react';

import { BoardClearIcon } from '../BoardClearIcon';
import { useTetrixStateContext } from '../TetrixProvider';
import './BoardClearDisplay.css';

export const BoardClearDisplay: React.FC = () => {
  const { stats } = useTetrixStateContext();
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  // Safety check: ensure stats structure exists
  if (!stats?.current?.fullBoardClears || !stats?.allTime?.fullBoardClears) {
    return null;
  }

  const currentBoardClears = stats.current.fullBoardClears.total;
  const allTimeBoardClears = stats.allTime.fullBoardClears.total;

  // Trigger animation on first board clear
  useEffect(() => {
    if (currentBoardClears > 0 && !hasAnimatedIn) {
      setHasAnimatedIn(true);
    }
  }, [currentBoardClears, hasAnimatedIn]);

  // Hide completely if no board clears ever
  if (allTimeBoardClears === 0) {
    return null;
  }

  const animationClass = hasAnimatedIn && currentBoardClears === 1
    ? 'board-clear-display-slide-in'
    : '';

  return (
    <div
      className={`board-clear-display ${animationClass}`}
      title="Board clears this game / all time"
    >
      <BoardClearIcon />
      <span className="board-clear-display-value">
        {currentBoardClears} / {allTimeBoardClears}
      </span>
    </div>
  );
};
