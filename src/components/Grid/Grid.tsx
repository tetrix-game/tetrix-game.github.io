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
  const { tiles, selectedShape, hoveredBlockPositions, isShapeDragging } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Only track mouse movement when actively dragging (not during animation)
    if (!gridRef.current || !selectedShape || !isShapeDragging) return;

    const location = mousePositionToGridLocation(
      e.clientX,
      e.clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    // Calculate the tile size based on grid dimensions
    const gridRect = gridRef.current.getBoundingClientRect();
    const tileSize = (gridRect.width - 9 * 2) / 10; // Subtract gap space (9 gaps of 2px), divide by 10 tiles

    dispatch({
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location,
        position: { x: e.clientX, y: e.clientY },
        tileSize,
        gridBounds: {
          top: gridRect.top,
          left: gridRect.left,
          width: gridRect.width,
          height: gridRect.height
        }
      }
    });
  }, [selectedShape, isShapeDragging, dispatch]);

  const handleMouseLeave = useCallback(() => {
    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location: null, position: null } });
  }, [dispatch]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!selectedShape || !gridRef.current) return;

    const clickLocation = mousePositionToGridLocation(
      e.clientX,
      e.clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    if (!clickLocation) return;

    console.log('[Grid] Click → starting animation');
    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location: clickLocation } });
    dispatch({ type: 'START_PLACEMENT_ANIMATION' });
  }, [selectedShape, dispatch]);

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
