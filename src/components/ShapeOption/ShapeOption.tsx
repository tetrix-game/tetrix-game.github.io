import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useCallback, useRef, useEffect, useState } from 'react';
import { mousePositionToGridLocation, isValidPlacement } from '../../utils/shapeUtils';

const shapeContainerCss = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 30px)',
  gridTemplateRows: 'repeat(3, 30px)',
  gap: '2px',
  padding: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  touchAction: 'none' as const,
  boxSizing: 'border-box' as const,
  border: '3px solid rgba(255, 255, 255, 0.2)',
};

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
};

const ShapeOption = ({ shape, shapeIndex }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();
  const { selectedShapeIndex, tiles } = useTetrixStateContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Detect if this is a touch device (mobile) - same logic as DraggingShape
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;

  // Register bounds when component mounts or updates
  useEffect(() => {
    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      dispatch({
        type: 'SET_SHAPE_OPTION_BOUNDS',
        value: {
          index: shapeIndex,
          bounds: {
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          },
        },
      });
    }
  }, [dispatch, shapeIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();

    if (selectedShapeIndex === shapeIndex) {
      // Already selected - return to selector
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Capture pointer so all future events come to this element
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);

    // Start drag by selecting this shape
    dispatch({
      type: 'SELECT_SHAPE',
      value: {
        shape,
        shapeIndex,
        initialPosition: { x: e.clientX, y: e.clientY }
      }
    });
  }, [dispatch, shape, shapeIndex, selectedShapeIndex]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    // Find the grid element
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if (!gridElement) return;

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();
    const tileSize = (gridRect.width - 9 * 2) / 10;

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? tileSize * 2.5 : 0;
    const adjustedY = e.clientY - MOBILE_TOUCH_OFFSET;

    // For touch devices, extend the grid bounds downward to allow placement
    // when thumb is below the grid but adjusted position is within
    const extendedBottom = gridRect.bottom + MOBILE_TOUCH_OFFSET;

    // Manual boundary check with extended bottom boundary
    let location: ReturnType<typeof mousePositionToGridLocation> = null;

    if (
      e.clientX >= gridRect.left &&
      e.clientX <= gridRect.right &&
      adjustedY >= gridRect.top &&
      adjustedY <= gridRect.bottom &&
      e.clientY <= extendedBottom  // Allow thumb to be below grid
    ) {
      const relativeX = e.clientX - gridRect.left;
      const relativeY = adjustedY - gridRect.top;

      const cellWidth = gridRect.width / 10;
      const cellHeight = gridRect.height / 10;

      const column = Math.floor(relativeX / cellWidth) + 1;
      const row = Math.floor(relativeY / cellHeight) + 1;

      // Ensure within bounds
      if (row >= 1 && row <= 10 && column >= 1 && column <= 10) {
        location = { row, column };
      }
    }

    // Check if placement is valid
    const isValid = location ? isValidPlacement(shape, location, tiles) : false;

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
  }, [isDragging, shape, tiles, dispatch, isTouchDevice]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    // Find the grid element
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if (!gridElement) {
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();
    const tileSize = (gridRect.width - 9 * 2) / 10;

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? tileSize * 2.5 : 0;
    const adjustedY = e.clientY - MOBILE_TOUCH_OFFSET;

    // For touch devices, extend the grid bounds downward to allow placement
    // when thumb is below the grid but adjusted position is within
    const extendedBottom = gridRect.bottom + MOBILE_TOUCH_OFFSET;

    // Manual boundary check with extended bottom boundary
    let location: ReturnType<typeof mousePositionToGridLocation> = null;

    if (
      e.clientX >= gridRect.left &&
      e.clientX <= gridRect.right &&
      adjustedY >= gridRect.top &&
      adjustedY <= gridRect.bottom &&
      e.clientY <= extendedBottom  // Allow thumb to be below grid
    ) {
      const relativeX = e.clientX - gridRect.left;
      const relativeY = adjustedY - gridRect.top;

      const cellWidth = gridRect.width / 10;
      const cellHeight = gridRect.height / 10;

      const column = Math.floor(relativeX / cellWidth) + 1;
      const row = Math.floor(relativeY / cellHeight) + 1;

      // Ensure within bounds
      if (row >= 1 && row <= 10 && column >= 1 && column <= 10) {
        location = { row, column };
      }
    }

    if (!location) {
      // Pointer up outside grid - return shape
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Check if placement is valid
    if (!isValidPlacement(shape, location, tiles)) {
      // Invalid placement - return shape
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Valid placement - start animation
    dispatch({
      type: 'PLACE_SHAPE',
      value: {
        location,
        mousePosition: { x: e.clientX, y: e.clientY }
      }
    });
  }, [isDragging, shape, tiles, dispatch, isTouchDevice]);

  const isSelected = selectedShapeIndex === shapeIndex;

  return (
    <div
      ref={containerRef}
      style={{
        ...shapeContainerCss,
        border: isSelected ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid rgba(255, 255, 255, 0.2)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
      }}
      onPointerLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
    >
      {shape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              position: 'relative',
              opacity: isSelected ? 0.1 : 1,
            }}
          >
            <BlockVisual block={block} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;