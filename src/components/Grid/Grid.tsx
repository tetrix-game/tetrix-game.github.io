import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useCallback, useEffect } from 'react';
import { mousePositionToGridLocation, getShapeGridPositions } from '../../utils/shapeUtils';

const gridCss = {
  display: "grid",
  gridTemplateColumns: "repeat(10, 1fr)",
  gridTemplateRows: "repeat(10, 1fr)",
  backgroundColor: "rgb(10, 10, 10)",
  gap: "2px,",
  position: "relative" as const,
}

export default function Grid() {
  const { tiles, selectedShape, mouseGridLocation } = useTetrixStateContext();
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

  // Calculate preview positions
  const previewPositions = selectedShape && mouseGridLocation
    ? getShapeGridPositions(selectedShape, mouseGridLocation)
    : [];

  const previewSet = new Set(
    previewPositions.map(p => `${p.location.row},${p.location.column}`)
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
          const isPreview = previewSet.has(key);

          return (
            <TileVisual
              key={tile.id}
              tile={tile}
              isPreview={isPreview}
              previewBlock={isPreview ? previewPositions.find(p =>
                p.location.row === tile.location.row &&
                p.location.column === tile.location.column
              )?.block : undefined}
            />
          )
        })
      }
    </div >
  )
}
