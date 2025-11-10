import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { mousePositionToGridLocation, isValidPlacement } from '../../utils/shapeUtils';

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
};

const getAnimationStyles = (
  isAnimatingRemoval: boolean,
  isVerticalAnimation: boolean,
  buttonSize: number
) => {
  if (isAnimatingRemoval) {
    return {
      width: isVerticalAnimation ? `${buttonSize}px` : '0px',
      height: isVerticalAnimation ? '0px' : `${buttonSize}px`,
      minWidth: isVerticalAnimation ? `${buttonSize}px` : '0px',
      minHeight: isVerticalAnimation ? '0px' : `${buttonSize}px`,
      opacity: 0,
      // Use negative margins to collapse the gap during removal
      marginRight: isVerticalAnimation ? '0px' : '-12px',
      marginBottom: isVerticalAnimation ? '-12px' : '0px',
    };
  }

  // Normal state
  return {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    minWidth: `${buttonSize}px`,
    minHeight: `${buttonSize}px`,
    opacity: 1,
    marginRight: '0px',
    marginBottom: '0px',
  };
};

const ShapeOption = ({ shape, shapeIndex }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();
  const { selectedShapeIndex, tiles, isTurningModeActive, turningDirection, isDoubleTurnModeActive, removingShapeIndex, shapeRemovalAnimationState } = useTetrixStateContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingRemoval, setIsAnimatingRemoval] = useState(false);

  // Track screen orientation for animation direction
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixed sizing for consistent shape options
  const buttonSize = 80; // Fixed size instead of responsive
  const cellSize = 16; // Fixed cell size
  const cellGap = 1; // Fixed gap

  // Animation properties based on orientation
  const isVerticalAnimation = isLandscape;
  const verticalTransition = 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1), margin-bottom 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
  const horizontalTransition = 'width 0.3s cubic-bezier(0.25, 1, 0.5, 1), margin-right 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
  const normalTransition = 'all 0.2s ease';

  const animationTransition = useMemo(() => {
    if (isAnimatingRemoval) {
      return isVerticalAnimation ? verticalTransition : horizontalTransition;
    }
    return normalTransition;
  }, [isAnimatingRemoval, isVerticalAnimation, normalTransition, verticalTransition, horizontalTransition]);

  const removeTransform = isVerticalAnimation ? 'scaleY(0)' : 'scaleX(0)';
  const normalTransform = isVerticalAnimation ? 'scaleY(1)' : 'scaleX(1)';

  let animationTransform = normalTransform;
  if (isAnimatingRemoval) {
    animationTransform = removeTransform;
  }

  const animationStyles = getAnimationStyles(isAnimatingRemoval, isVerticalAnimation, buttonSize);

  const shapeContainerCss = {
    display: 'grid',
    gridTemplateColumns: `repeat(4, ${cellSize}px)`,
    gridTemplateRows: `repeat(4, ${cellSize}px)`,
    gap: `${cellGap}px`,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: animationTransition,
    touchAction: 'none' as const,
    boxSizing: 'border-box' as const,
    border: '3px solid rgba(255, 255, 255, 0.2)',
    ...animationStyles,
    transform: animationTransform,
    transformOrigin: 'center',
    overflow: 'hidden' as const,
    pointerEvents: isAnimatingRemoval ? 'none' as const : 'auto' as const,
  };

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

  // Handle removal animation
  useEffect(() => {
    if (removingShapeIndex === shapeIndex && shapeRemovalAnimationState === 'removing') {
      setIsAnimatingRemoval(true);

      // Start the animation and trigger completion after 300ms
      const animationTimer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_SHAPE_REMOVAL' });
        setIsAnimatingRemoval(false);
      }, 300); // 0.3s animation duration

      return () => clearTimeout(animationTimer);
    } else {
      setIsAnimatingRemoval(false);
    }
  }, [removingShapeIndex, shapeIndex, shapeRemovalAnimationState, dispatch]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();

    // Don't handle events during animation
    if (isAnimatingRemoval) return;

    // Handle turning mode - rotate shape instead of dragging
    if (isTurningModeActive) {
      const clockwise = turningDirection === 'cw';

      dispatch({
        type: 'ROTATE_SHAPE',
        value: { shapeIndex, clockwise }
      });

      // Deactivate turning mode after rotation
      dispatch({ type: 'DEACTIVATE_TURNING_MODE' });

      return;
    }

    // Handle double turn mode - rotate shape 180 degrees (2 rotations)
    if (isDoubleTurnModeActive) {
      // Perform two clockwise rotations for 180-degree turn
      dispatch({
        type: 'ROTATE_SHAPE',
        value: { shapeIndex, clockwise: true }
      });

      dispatch({
        type: 'ROTATE_SHAPE',
        value: { shapeIndex, clockwise: true }
      });

      // Deactivate double turn mode after rotation
      dispatch({ type: 'DEACTIVATE_DOUBLE_TURN_MODE' });

      return;
    }

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
  }, [dispatch, shape, shapeIndex, selectedShapeIndex, isTurningModeActive, turningDirection, isDoubleTurnModeActive, isAnimatingRemoval]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || isTurningModeActive || isDoubleTurnModeActive || isAnimatingRemoval) return;

    // Find the grid element
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if (!gridElement) return;

    // Use fixed grid calculations
    const FIXED_GRID_SIZE = 400;
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const FIXED_TILE_SIZE = (FIXED_GRID_SIZE - GRID_GAPS_TOTAL) / 10;

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? FIXED_TILE_SIZE * 2.5 : 0;
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
        tileSize: FIXED_TILE_SIZE,
        gridBounds: {
          top: gridRect.top,
          left: gridRect.left,
          width: gridRect.width,
          height: gridRect.height
        },
        isValid,
      }
    });
  }, [isDragging, shape, tiles, dispatch, isTouchDevice, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isTurningModeActive || isDoubleTurnModeActive || isAnimatingRemoval) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    // Find the grid element
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if (!gridElement) {
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Use fixed grid calculations
    const FIXED_GRID_SIZE = 400;
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const FIXED_TILE_SIZE = (FIXED_GRID_SIZE - GRID_GAPS_TOTAL) / 10;

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? FIXED_TILE_SIZE * 2.5 : 0;
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
  }, [isDragging, shape, tiles, dispatch, isTouchDevice, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval]);

  const isSelected = selectedShapeIndex === shapeIndex;

  // Render empty blocks during removal animation
  const displayShape = isAnimatingRemoval
    ? shape.map(row => row.map(block => ({ ...block, isFilled: false })))
    : shape;

  return (
    <div
      ref={containerRef}
      className="shape-container"
      style={{
        ...shapeContainerCss,
        border: isSelected ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid rgba(255, 255, 255, 0.2)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handleMouseMove}
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
      {displayShape.map((row, rowIndex) => (
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
            <BlockVisual block={block} borderWidth={cellSize / 4} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;