import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { isValidPlacement, getShapeBounds } from '../../utils/shapeUtils';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useSoundEffects } from '../SoundEffectsContext';

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
  shapeOptionFullSize: number;
};

const ShapeOption = ({ shape, shapeIndex, shapeOptionFullSize }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();
  const { selectedShapeIndex, tiles, isTurningModeActive, turningDirection, isDoubleTurnModeActive, removingShapeIndex, shapeRemovalAnimationState } = useTetrixStateContext();
  const { playSound } = useSoundEffects();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isAnimatingRemoval = removingShapeIndex === shapeIndex && shapeRemovalAnimationState === 'removing';

  // Get dynamic sizing from hook
  const { gridSize } = useGameSizing();

  // ShapeOption has 4x4 grid with 1px gaps (3 gaps total)
  const cellGap = 1;
  const cellGapSpace = cellGap * 3;
  const shapeOptionCellSize = (shapeOptionFullSize - cellGapSpace) / 4;

  // Calculate padding for normal (non-hovered) state
  const shapeOptionNormalSize = shapeOptionFullSize / 1.05;
  const normalPadding = (shapeOptionFullSize - shapeOptionNormalSize) / 2;

  // Calculate centering offset for shapes with odd dimensions
  const shapeBounds = useMemo(() => getShapeBounds(shape), [shape]);
  const centeringOffset = useMemo(() => {
    // Calculate how much to shift the shape to center it in the 4x4 grid
    // Each cell + gap is (shapeOptionCellSize + cellGap)
    const cellWithGap = shapeOptionCellSize + cellGap;

    // The shape's visual center in grid coordinates (0-based, fractional)
    const shapeVisualCenterCol = shapeBounds.minCol + (shapeBounds.width - 1) / 2;
    const shapeVisualCenterRow = shapeBounds.minRow + (shapeBounds.height - 1) / 2;

    // The 4x4 grid's center (1.5, 1.5 in 0-based coordinates)
    const gridCenter = 1.5;

    // Calculate offset needed to center the shape
    const offsetX = (gridCenter - shapeVisualCenterCol) * cellWithGap;
    const offsetY = (gridCenter - shapeVisualCenterRow) * cellWithGap;

    return { x: offsetX, y: offsetY };
  }, [shapeBounds, shapeOptionCellSize, cellGap]);

  // Detect if this is a touch device (mobile) - same logic as DraggingShape
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;

  // Memoize grid calculations to avoid duplication
  const gridCalculations = useMemo(() => {
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const TILE_SIZE = (gridSize - GRID_GAPS_TOTAL) / 10;
    const MOBILE_TOUCH_OFFSET = isTouchDevice ? TILE_SIZE * 2.5 : 0;

    return { TILE_SIZE, MOBILE_TOUCH_OFFSET };
  }, [gridSize, isTouchDevice]);

  // Memoize location calculation function
  const calculateLocationFromMouse = useCallback((clientX: number, clientY: number) => {
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if (!gridElement) return null;

    const gridRect = gridElement.getBoundingClientRect();
    const { MOBILE_TOUCH_OFFSET } = gridCalculations;
    const adjustedY = clientY - MOBILE_TOUCH_OFFSET;
    const extendedBottom = gridRect.bottom + MOBILE_TOUCH_OFFSET;

    // Boundary check with extended bottom boundary
    if (
      clientX < gridRect.left ||
      clientX > gridRect.right ||
      adjustedY < gridRect.top ||
      adjustedY > gridRect.bottom ||
      clientY > extendedBottom
    ) {
      return null;
    }

    const relativeX = clientX - gridRect.left;
    const relativeY = adjustedY - gridRect.top;

    const cellWidth = gridRect.width / 10;
    const cellHeight = gridRect.height / 10;

    const column = Math.floor(relativeX / cellWidth) + 1;
    const row = Math.floor(relativeY / cellHeight) + 1;

    // Ensure within bounds
    if (row >= 1 && row <= 10 && column >= 1 && column <= 10) {
      return { row, column, gridRect };
    }

    return null;
  }, [gridCalculations]);

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

  // Handle removal animation - trigger completion after animation duration
  useEffect(() => {
    if (removingShapeIndex === shapeIndex && shapeRemovalAnimationState === 'removing') {
      // Start the animation and trigger completion after 300ms
      const animationTimer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_SHAPE_REMOVAL' });
      }, 300); // 0.3s animation duration

      return () => clearTimeout(animationTimer);
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

    // Play pickup sound with slight offset to skip silent lead-in
    playSound('pickup_shape', 0.05);

    // Start drag by selecting this shape
    dispatch({
      type: 'SELECT_SHAPE',
      value: {
        shape,
        shapeIndex,
        initialPosition: { x: e.clientX, y: e.clientY }
      }
    });
  }, [dispatch, shape, shapeIndex, selectedShapeIndex, isTurningModeActive, turningDirection, isDoubleTurnModeActive, isAnimatingRemoval, playSound]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || isTurningModeActive || isDoubleTurnModeActive || isAnimatingRemoval) return;

    const result = calculateLocationFromMouse(e.clientX, e.clientY);
    const location = result ? { row: result.row, column: result.column } : null;
    const isValid = location ? isValidPlacement(shape, location, tiles) : false;

    dispatch({
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location,
        position: { x: e.clientX, y: e.clientY },
        tileSize: gridCalculations.TILE_SIZE,
        gridBounds: result ? {
          top: result.gridRect.top,
          left: result.gridRect.left,
          width: result.gridRect.width,
          height: result.gridRect.height
        } : { top: 0, left: 0, width: 0, height: 0 },
        isValid,
      }
    });
  }, [isDragging, shape, tiles, dispatch, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval, calculateLocationFromMouse, gridCalculations]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isTurningModeActive || isDoubleTurnModeActive || isAnimatingRemoval) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    const result = calculateLocationFromMouse(e.clientX, e.clientY);

    if (!result) {
      // Pointer up outside grid - return shape
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    const location = { row: result.row, column: result.column };

    // Check if placement is valid
    if (!isValidPlacement(shape, location, tiles)) {
      // Invalid placement - return shape
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      return;
    }

    // Valid placement - start animation
    // Apply the same mobile touch offset to the mouse position so animation starts from where shape visually appears
    const { MOBILE_TOUCH_OFFSET } = gridCalculations;
    dispatch({
      type: 'PLACE_SHAPE',
      value: {
        location,
        mousePosition: { x: e.clientX, y: e.clientY - MOBILE_TOUCH_OFFSET }
      }
    });
  }, [isDragging, shape, tiles, dispatch, isTurningModeActive, isDoubleTurnModeActive, isAnimatingRemoval, calculateLocationFromMouse, gridCalculations]);

  const isSelected = selectedShapeIndex === shapeIndex;

  // Render empty blocks during removal animation
  const displayShape = isAnimatingRemoval
    ? shape.map(row => row.map(block => ({ ...block, isFilled: false })))
    : shape;

  const cellOpacityClass = isSelected ? 'shape-cell-selected' : '';

  return (
    <div
      ref={containerRef}
      className={`shape-container${isSelected ? ' selected' : ''}`}
      style={{
        '--shape-cell-size': `${shapeOptionCellSize}px`,
        '--shape-cell-gap': `${cellGap}px`,
        '--shape-padding': `${normalPadding}px`,
        '--centering-offset-x': `${centeringOffset.x}px`,
        '--centering-offset-y': `${centeringOffset.y}px`,
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => {
        if (!isDragging) {
          // Scale up the grid content by removing padding
          e.currentTarget.style.setProperty('--shape-padding', '0px');
          e.currentTarget.classList.add('shape-container-hover');
        }
      }}
      onPointerLeave={(e) => {
        if (!isDragging) {
          // Scale down by restoring padding
          e.currentTarget.style.setProperty('--shape-padding', `${normalPadding}px`);
          e.currentTarget.classList.remove('shape-container-hover');
        }
      }}
    >
      {displayShape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`shape-cell ${cellOpacityClass}`}
          >
            <BlockVisual block={block} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;