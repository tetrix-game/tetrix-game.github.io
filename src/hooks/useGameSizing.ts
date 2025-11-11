import { useState, useEffect, useMemo } from 'react';

export interface GameSizing {
  gridSize: number;
  gridCellSize: number;
  gridGap: number;
  gameControlsLength: number;
  gameControlsWidth: number;
  buttonSize: number;
}

export const useGameSizing = (): GameSizing => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sizing = useMemo(() => {
    const { width: vw, height: vh } = windowSize;
    const isLandscape = vw >= vh;

    // Available space in the .tetrix container
    // .tetrix is 90vh tall, full width, with 20px gap between grid and controls
    const containerHeight = vh * 0.9; // 90vh
    const containerWidth = vw;
    const gap = 20; // Gap between grid and controls

    // In landscape: grid and controls side-by-side (controls take ~1/3 width)
    // In portrait: grid and controls stacked (controls take ~1/3 height)

    let gridSize: number;
    let gameControlsLength: number;
    let gameControlsWidth: number;

    if (isLandscape) {
      // Landscape: controls on the right
      // Available width = containerWidth - gap
      // Grid should be square and fit within containerHeight
      // Controls get remaining width

      // Target: grid takes ~2/3 of available width
      const availableWidth = containerWidth - gap;
      const targetGridWidth = availableWidth * 0.65; // ~2/3

      // Grid must be square and fit in containerHeight
      gridSize = Math.min(targetGridWidth, containerHeight * 0.95); // Leave 5% padding

      // Controls take remaining space
      gameControlsLength = gridSize; // Match grid height
      gameControlsWidth = Math.min(availableWidth - gridSize, gridSize * 0.6); // Cap at 60% of grid size

    } else {
      // Portrait: controls below
      // Available height = containerHeight - gap
      // Grid should be square and fit within containerWidth
      // Controls get remaining height

      const availableHeight = containerHeight - gap;
      const targetGridHeight = availableHeight * 0.65; // ~2/3

      // Grid must be square and fit in containerWidth
      gridSize = Math.min(targetGridHeight, containerWidth * 0.95); // Leave 5% padding

      // Controls take remaining space
      gameControlsLength = gridSize; // Match grid width
      gameControlsWidth = Math.min(availableHeight - gridSize, gridSize * 0.6); // Cap at 60% of grid size
    }

    // Grid has 10 cells with 2px gaps (9 gaps total)
    const gridGap = 2;
    const gridGapSpace = gridGap * 9;
    const gridCellSize = (gridSize - gridGapSpace) / 10;

    // Button sizing based on controls width
    const buttonSize = gameControlsWidth * 0.95;

    return {
      gridSize,
      gridCellSize,
      gridGap,
      gameControlsLength,
      gameControlsWidth,
      buttonSize,
    };
  }, [windowSize]);

  return sizing;
};