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
    const padding = 40; // Total padding to ensure content doesn't touch edges

    let gridSize: number;
    let gameControlsLength: number;
    let gameControlsWidth: number;

    if (isLandscape) {
      // Landscape: controls on the right, side-by-side layout
      // Total width constraint: gridSize + gap + gameControlsWidth <= containerWidth - padding
      // Total height constraint: max(gridSize, gameControlsLength) <= containerHeight - padding

      const availableWidth = containerWidth - gap - padding;
      const availableHeight = containerHeight - padding;

      // Aim for controls to be ~35-40% of available width
      const targetControlsRatio = 0.35;
      const targetGridWidth = availableWidth * (1 - targetControlsRatio);

      // Grid must be square and fit in available height
      gridSize = Math.min(targetGridWidth, availableHeight);

      // Ensure grid + controls + gap actually fit
      gameControlsWidth = Math.min(
        availableWidth - gridSize,
        gridSize * 0.6  // Cap at 60% of grid size
      );

      // Verify total width fits, shrink grid if needed
      const totalWidth = gridSize + gap + gameControlsWidth;
      if (totalWidth > containerWidth - padding) {
        const scale = (containerWidth - padding) / totalWidth;
        gridSize *= scale;
        gameControlsWidth *= scale;
      }

      gameControlsLength = gridSize; // Match grid height

    } else {
      // Portrait: controls below, stacked layout
      // Total height constraint: gridSize + gap + gameControlsWidth <= containerHeight - padding
      // Total width constraint: max(gridSize, gameControlsLength) <= containerWidth - padding

      const availableHeight = containerHeight - gap - padding;
      const availableWidth = containerWidth - padding;

      // Aim for controls to be ~35-40% of available height
      const targetControlsRatio = 0.35;
      const targetGridHeight = availableHeight * (1 - targetControlsRatio);

      // Grid must be square and fit in available width
      gridSize = Math.min(targetGridHeight, availableWidth);

      // Ensure grid + controls + gap actually fit
      gameControlsWidth = Math.min(
        availableHeight - gridSize,
        gridSize * 0.6  // Cap at 60% of grid size
      );

      // Verify total height fits, shrink grid if needed
      const totalHeight = gridSize + gap + gameControlsWidth;
      if (totalHeight > containerHeight - padding) {
        const scale = (containerHeight - padding) / totalHeight;
        gridSize *= scale;
        gameControlsWidth *= scale;
      }

      gameControlsLength = gridSize; // Match grid width
    }

    // Grid has 10 cells with 2px gaps (9 gaps total)
    const gridGap = 2;
    const gridGapSpace = gridGap * 9;
    const gridCellSize = (gridSize - gridGapSpace) / 10;

    // Button sizing based on controls width
    const buttonSize = gameControlsWidth * 0.9; // Slightly smaller to ensure padding

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