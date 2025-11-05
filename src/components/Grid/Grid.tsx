import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useCallback, useLayoutEffect } from 'react';
import { mousePositionToGridLocation, isValidPlacement } from '../../utils/shapeUtils';

const gridCss = {
  display: "grid",
  gridTemplateColumns: "repeat(10, 1fr)",
  gridTemplateRows: "repeat(10, 1fr)",
  backgroundColor: "rgb(10, 10, 10)",
  gap: "2px,",
  position: "relative" as const,
  touchAction: "none" as const, // Prevent browser touch gestures during drag
}

export default function Grid() {
  const { tiles, selectedShape, hoveredBlockPositions, isShapeDragging } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    // Only track pointer movement when actively dragging (not during animation)
    if (!gridRef.current || !selectedShape || !isShapeDragging) return;

    const location = mousePositionToGridLocation(
      clientX,
      clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    // Calculate the tile size based on grid dimensions
    const gridRect = gridRef.current.getBoundingClientRect();
    const tileSize = (gridRect.width - 9 * 2) / 10; // Subtract gap space (9 gaps of 2px), divide by 10 tiles

    // Check if placement is valid
    const isValid = location ? isValidPlacement(selectedShape, location, tiles) : false;

    dispatch({
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location,
        position: { x: clientX, y: clientY },
        tileSize,
        gridBounds: {
          top: gridRect.top,
          left: gridRect.left,
          width: gridRect.width,
          height: gridRect.height
        },
        isValid,
      }
    });
  }, [selectedShape, isShapeDragging, tiles, dispatch]);

  const handlePointerLeave = useCallback(() => {
    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location: null, position: null } });
  }, [dispatch]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!selectedShape || !gridRef.current) return;

    // Immediately update position when pointer goes down on grid
    const location = mousePositionToGridLocation(
      e.clientX,
      e.clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    const gridRect = gridRef.current.getBoundingClientRect();
    const tileSize = (gridRect.width - 9 * 2) / 10;
    const isValid = location ? isValidPlacement(selectedShape, location, tiles) : false;

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
        },
        isValid,
      }
    });
  }, [selectedShape, tiles, dispatch]);

  const handlePointerUp = useCallback((clientX: number, clientY: number) => {
    if (!selectedShape || !gridRef.current) return;

    const clickLocation = mousePositionToGridLocation(
      clientX,
      clientY,
      gridRef.current,
      { rows: 10, columns: 10 }
    );

    if (!clickLocation) {
      // Pointer up outside grid - return shape to selector
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Check if placement is valid
    if (!isValidPlacement(selectedShape, clickLocation, tiles)) {
      // Invalid placement - return shape to selector
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Valid placement - proceed with animation
    dispatch({ type: 'UPDATE_MOUSE_LOCATION', value: { location: clickLocation } });
    dispatch({ type: 'START_PLACEMENT_ANIMATION' });
  }, [selectedShape, tiles, dispatch]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Handle escape key to return shape to selector
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedShape) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    // Pointer event handlers
    const onPointerDown = (e: PointerEvent) => {
      handlePointerDown(e);
    };

    const onPointerMove = (e: PointerEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      handlePointerLeave();
    };

    const onPointerUp = (e: PointerEvent) => {
      handlePointerUp(e.clientX, e.clientY);
    };

    grid.addEventListener('pointerdown', onPointerDown);
    grid.addEventListener('pointermove', onPointerMove);
    grid.addEventListener('pointerleave', onPointerLeave);
    grid.addEventListener('pointerup', onPointerUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      grid.removeEventListener('pointerdown', onPointerDown);
      grid.removeEventListener('pointermove', onPointerMove);
      grid.removeEventListener('pointerleave', onPointerLeave);
      grid.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerLeave, handlePointerUp, selectedShape, dispatch]);

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
