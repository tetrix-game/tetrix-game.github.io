import './Grid.css'
import TetrixTile from '../TetrixTile/TetrixTile';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect, useMemo } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugGridInteractions } from '../../hooks/useDebugGridInteractions';
import { GRID_SIZE } from '../../utils/gridConstants';

interface GridProps {
  width?: number; // Grid width in tiles (default: GRID_SIZE)
  height?: number; // Grid height in tiles (default: GRID_SIZE)
}

export default function Grid({ width = GRID_SIZE, height = GRID_SIZE }: GridProps) {
  const { tiles, dragState, gameMode } = useTetrixStateContext();
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

  // Generate all potential tile positions in the grid
  const allPositions = useMemo(() => {
    const positions: string[] = [];
    for (let row = 1; row <= height; row++) {
      for (let col = 1; col <= width; col++) {
        positions.push(`R${row}C${col}`);
      }
    }
    return positions;
  }, [width, height]);

  return (
    <div
      ref={gridRef}
      className={`grid ${dragState.selectedShape ? 'grid-dragging' : ''}`}
      style={
        {
          '--grid-gap': `${gridGap}px`,
          '--grid-size': `${gridSize}px`,
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
        } as React.CSSProperties
      }
    >
      {
        allPositions.map((position) => {
          const tileData = tiles.get(position);

          // In daily challenge mode, only render tiles that exist in the tiles Map
          // This prevents out-of-bounds areas from showing as gray tiles
          if (gameMode === 'daily' && !tileData) {
            return null;
          }

          // For empty spaces, create default tile
          const defaultBlock = { isFilled: false, color: 'grey' as const };
          const backgroundColor = tileData?.backgroundColor || 'grey';
          const block = tileData ? tileData.block : defaultBlock;

          // Parse position to location
          const match = position.match(/R(\d+)C(\d+)/);
          if (!match) {
            console.error(`Invalid position format: ${position}`);
            return null;
          }
          const row = parseInt(match[1]);
          const column = parseInt(match[2]);

          const tile: Tile = {
            position,
            backgroundColor,
            block,
            activeAnimations: tileData?.activeAnimations || []
          };

          const posKey = `${row},${column}`;
          const hoveredBlock = hoveredBlockMap.get(posKey);
          const isHovered = hoveredBlock?.isFilled ?? false;

          return (
            <TetrixTile
              key={position}
              tile={tile}
              location={{ row, column }}
              isHovered={isHovered}
              hoveredBlock={hoveredBlock}
              onClick={isDebugMode ? () => handleDebugClick({ row, column }) : undefined}
              size={gridCellSize}
            />
          )
        })
      }
    </div >
  )
}
