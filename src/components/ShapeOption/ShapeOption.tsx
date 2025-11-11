import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { mousePositionToGridLocation, isValidPlacement } from '../../utils/shapeUtils';
import { useGameSizing } from '../../hooks/useGameSizing';

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
};

const getAnimationStyles = (
  isAnimatingRemoval: boolean,
  isVerticalAnimation: boolean,
  shapeOptionFullSize: number
) => {
  if (isAnimatingRemoval) {
    return {
      width: isVerticalAnimation ? `${shapeOptionFullSize}px` : '0px',
      height: isVerticalAnimation ? '0px' : `${shapeOptionFullSize}px`,
      minWidth: isVerticalAnimation ? `${shapeOptionFullSize}px` : '0px',
      minHeight: isVerticalAnimation ? '0px' : `${shapeOptionFullSize}px`,
      opacity: 0,
      marginRight: '0px',
      marginBottom: '0px',
    };
  }

  // Normal state - sized to contain 1.05 scale
  return {
    width: `${shapeOptionFullSize}px`,
    height: `${shapeOptionFullSize}px`,
    minWidth: `${shapeOptionFullSize}px`,
    minHeight: `${shapeOptionFullSize}px`,
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

  // Get dynamic sizing from hook
  const { gameControlsWidth, gridSize } = useGameSizing();

  // ShapeOption sizing: full width is 1/1.05 of gameControlsWidth (to account for 1.05 hover scale)
  const shapeOptionFullSize = gameControlsWidth / 1.05;

  // ShapeOption has 4x4 grid with 1px gaps (3 gaps total)
  const cellGap = 1;
  const cellGapSpace = cellGap * 3;
  const shapeOptionCellSize = (shapeOptionFullSize - cellGapSpace) / 4;

  // Calculate padding for normal (non-hovered) state
  const shapeOptionNormalSize = shapeOptionFullSize / 1.05;
  const normalPadding = (shapeOptionFullSize - shapeOptionNormalSize) / 2;

  // Determine if landscape for animation direction
  const isLandscape = window.innerWidth >= window.innerHeight;
  const isVerticalAnimation = isLandscape;

  const animationTransition = useMemo(() => {
    const verticalTransition = 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1), margin-bottom 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    const horizontalTransition = 'width 0.3s cubic-bezier(0.25, 1, 0.5, 1), margin-right 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    const normalTransition = 'all 0.2s ease';

    if (isAnimatingRemoval) {
      return isVerticalAnimation ? verticalTransition : horizontalTransition;
    }
    return normalTransition;
  }, [isAnimatingRemoval, isVerticalAnimation]);

  const removeTransform = isVerticalAnimation ? 'scaleY(0)' : 'scaleX(0)';
  const normalTransform = isVerticalAnimation ? 'scaleY(1)' : 'scaleX(1)';

  let animationTransform = normalTransform;
  if (isAnimatingRemoval) {
    animationTransform = removeTransform;
  }

  const animationStyles = getAnimationStyles(isAnimatingRemoval, isVerticalAnimation, shapeOptionFullSize);

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

    // Use dynamic grid calculations from hook
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const TILE_SIZE = (gridSize - GRID_GAPS_TOTAL) / 10;

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? TILE_SIZE * 2.5 : 0;
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
        tileSize: TILE_SIZE,
        gridBounds: {
          top: gridRect.top,
          left: gridRect.left,
          width: gridRect.width,
          height: gridRect.height
        },
        isValid,
      }
    });
  }, [isDragging, shape, tiles, dispatch, isTouchDevice, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval, gridSize]);

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

    // Use dynamic grid calculations from hook
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const TILE_SIZE = (gridSize - GRID_GAPS_TOTAL) / 10;

    // Calculate grid bounds and tile size
    const gridRect = gridElement.getBoundingClientRect();

    // Apply mobile offset to match DraggingShape visual offset
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? TILE_SIZE * 2.5 : 0;
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
  }, [isDragging, shape, tiles, dispatch, isTouchDevice, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval, gridSize]);

  const isSelected = selectedShapeIndex === shapeIndex;

  // Render empty blocks during removal animation
  const displayShape = isAnimatingRemoval
    ? shape.map(row => row.map(block => ({ ...block, isFilled: false })))
    : shape;

  return (
    <div
      ref={containerRef}
      className={`shape-container${isSelected ? ' selected' : ''}`}
      style={{
        '--shape-cell-size': `${shapeOptionCellSize}px`,
        '--shape-cell-gap': `${cellGap}px`,
        '--shape-padding': `${normalPadding}px`,
        transition: animationTransition,
        ...animationStyles,
        transform: animationTransform,
        pointerEvents: isAnimatingRemoval ? 'none' : 'auto',
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => {
        if (!isDragging) {
          // Scale up the grid content by removing padding
          e.currentTarget.style.setProperty('--shape-padding', '0px');
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
      }}
      onPointerLeave={(e) => {
        if (!isDragging) {
          // Scale down by restoring padding
          e.currentTarget.style.setProperty('--shape-padding', `${normalPadding}px`);
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
    >
      {displayShape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="shape-cell"
            style={{
              opacity: isSelected ? 0.1 : 1,
            }}
          >
            <BlockVisual block={block} borderWidth={shapeOptionCellSize / 4} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;