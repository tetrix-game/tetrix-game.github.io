import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';

export default function Grid() {
  const { tiles, selectedShape, hoveredBlockPositions } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const { gridSize, gridGap } = useGameSizing();

  const gridCss = {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gridTemplateRows: "repeat(10, 1fr)",
    backgroundColor: "rgb(10, 10, 10)",
    gap: `${gridGap}px`,
    position: "relative" as const,
    touchAction: "none" as const,
    width: `${gridSize}px`,
    height: `${gridSize}px`,
  };

  // Handle escape key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedShape) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShape, dispatch]);

  // Create a map of hovered block positions for quick lookup
  const hoveredBlockMap = new Map(
    hoveredBlockPositions.map(pos => [
      `${pos.location.row},${pos.location.column}`,
      pos.block
    ])
  );

  return (
    <div
      ref={gridRef}
      className={`grid ${selectedShape ? 'dragging' : ''}`}
      style={gridCss}
    >
      {
        tiles.map((tile: Tile) => {
          const key = `${tile.location.row},${tile.location.column}`;
          const hoveredBlock = hoveredBlockMap.get(key);
          const isHovered = hoveredBlock?.isFilled ?? false;

          return (
            <TileVisual
              key={tile.id}
              tile={tile}
              isHovered={isHovered}
              hoveredBlock={hoveredBlock}
            />
          )
        })
      }
    </div >
  )
}
