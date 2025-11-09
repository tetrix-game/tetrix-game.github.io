import { useState, useEffect, useMemo } from 'react';

export interface GameSizing {
  gridCellSize: number;
  shapeOptionCellSize: number;
  gridBorderWidth: number;
  shapeOptionBorderWidth: number;
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
    const aspectRatio = vw / vh;

    // Calculate main grid size using same logic as CSS media queries
    let gridSize: number;
    if (aspectRatio >= 1) {
      // min-aspect-ratio: 1/1 - use 90vh
      gridSize = vh * 0.9 - 1;
    } else {
      // max-aspect-ratio: 1/1 - use 90vw  
      gridSize = vw * 0.9;
    }

    // Grid has 10 cells with 2px gaps (9 gaps total)
    const gapSpace = 2 * 9; // 18px total gap space
    const gridCellSize = (gridSize - gapSpace) / 10;
    const gridBorderWidth = gridCellSize / 2;

    // ShapeOption sizing - keep reasonable size for shape options
    const shapeOptionCellSize = 25;
    const shapeOptionBorderWidth = shapeOptionCellSize / 2;

    return {
      gridCellSize,
      shapeOptionCellSize,
      gridBorderWidth,
      shapeOptionBorderWidth,
    };
  }, [windowSize]);

  return sizing;
};