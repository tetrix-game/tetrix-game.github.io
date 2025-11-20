import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect, useMemo } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugGridInteractions } from '../../hooks/useDebugGridInteractions';
import { parseTileKey } from '../Tetrix/TetrixReducer';

export default function Grid() {
  const { tiles, dragState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const { gridSize, gridGap, gridCellSize } = useGameSizing();
  const { isDebugMode, handleDebugClick } = useDebugGridInteractions();

  // Periodically clean up expired animations
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'CLEANUP_ANIMATIONS' });
    }, 1000); // Cleanup every second

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Handle escape key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle escape if debug editor is open
      if (e.key === 'Escape' && dragState.selectedShape && !isDebugMode) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState.selectedShape, dispatch, isDebugMode]);

  // Convert tiles Map to array for rendering (memoized)
  const tilesArray = useMemo(() => {
    const result: Tile[] = [];
    tiles.forEach((data, key) => {
      const { row, column } = parseTileKey(key);
      result.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: data.isFilled, color: data.color },
      });
    });
    // Sort by row, then column for consistent ordering
    result.sort((a, b) => {
      if (a.location.row !== b.location.row) {
        return a.location.row - b.location.row;
      }
      return a.location.column - b.location.column;
    });
    return result;
  }, [tiles]);

  // Create a map of hovered block positions for quick lookup
  const hoveredBlockMap = new Map(
    dragState.hoveredBlockPositions.map(pos => [
      `${pos.location.row},${pos.location.column}`,
      pos.block
    ])
  );

  return (
    <div
      ref={gridRef}
      className={`grid ${dragState.selectedShape ? 'grid-dragging' : ''}`}
      style={{
        '--grid-gap': `${gridGap}px`,
        '--grid-size': `${gridSize}px`,
      } as React.CSSProperties}
    >
      {
        tilesArray.map((tile: Tile) => {
          const key = `${tile.location.row},${tile.location.column}`;
          const hoveredBlock = hoveredBlockMap.get(key);
          const isHovered = hoveredBlock?.isFilled ?? false;

          return (
            <TileVisual
              key={tile.id}
              tile={tile}
              isHovered={isHovered}
              hoveredBlock={hoveredBlock}
              onClick={isDebugMode ? () => handleDebugClick(tile.location) : undefined}
              size={gridCellSize}
            />
          )
        })
      }
    </div >
  )
}
