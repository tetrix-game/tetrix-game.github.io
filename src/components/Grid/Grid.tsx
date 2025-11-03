import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useCallback, useEffect } from 'react';
import { mousePositionToGridLocation } from '../../utils/shapeUtils';

const gridCss = {
  display: "grid",
  gridTemplateColumns: "repeat(10, 1fr)",
  gridTemplateRows: "repeat(10, 1fr)",
  backgroundColor: "rgb(10, 10, 10)",
  gap: "2px,",
  position: "relative" as const,
}

export default function Grid() {
  const { tiles, selectedShape, mouseGridLocation, hoveredBlockPositions } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!gridRef.current || !selectedShape) return;

    const location = mousePositionToGridLocation(
      e.clientX,
      e.clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location } });
  }, [selectedShape, dispatch]);

  const handleMouseLeave = useCallback(() => {
    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location: null } });
  }, [dispatch]);

  const handleClick = useCallback(() => {
    if (selectedShape && mouseGridLocation) {
      dispatch({ type: 'PLACE_SHAPE' });
    }
  }, [selectedShape, mouseGridLocation, dispatch]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Handle escape key to clear selection
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedShape) {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    };

    grid.addEventListener('mousemove', handleMouseMove);
    grid.addEventListener('mouseleave', handleMouseLeave);
    grid.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      grid.removeEventListener('mousemove', handleMouseMove);
      grid.removeEventListener('mouseleave', handleMouseLeave);
      grid.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseLeave, handleClick, selectedShape, dispatch]);

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
          const isHovered = hoveredBlock !== undefined && !tile.block.isFilled;

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
