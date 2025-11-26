import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugGridInteractions } from '../../hooks/useDebugGridInteractions';
import { GRID_ADDRESSES, GRID_SIZE, parseTileKey } from '../../utils/gridConstants';

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
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      } as React.CSSProperties}
    >
      {
        GRID_ADDRESSES.map((key) => {
          const tileData = tiles.get(key);
          if (!tileData) {
            console.error(`Missing tile data for key: ${key}`);
            return null;
          }

          const { row, column } = parseTileKey(key);
          const tile: Tile = {
            id: `(row: ${row}, column: ${column})`,
            location: { row, column },
            block: { isFilled: tileData.isFilled, color: tileData.color },
          };

          const posKey = `${row},${column}`;
          const hoveredBlock = hoveredBlockMap.get(posKey);
          const isHovered = hoveredBlock?.isFilled ?? false;

          return (
            <TileVisual
              key={key}
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
