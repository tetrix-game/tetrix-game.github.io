import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { getShapeBounds } from '../../utils/shapeUtils';

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
  shapeOptionFullSize: number;
};

const ShapeOption = ({ shape, shapeIndex, shapeOptionFullSize }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();
  const {
    dragState,
    isTurningModeActive,
    turningDirection,
    isDoubleTurnModeActive,
    removingShapeIndex,
    shapeRemovalAnimationState,
    shapeOptionBounds,
    score
  } = useTetrixStateContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRemoval = removingShapeIndex === shapeIndex && shapeRemovalAnimationState === 'removing';

  // Track if bounds are currently null (need registration)
  const boundsAreNull = shapeOptionBounds[shapeIndex] === null || shapeOptionBounds[shapeIndex] === undefined;

  // ShapeOption has 4x4 grid with 1px gaps (3 gaps total)
  // Add padding to prevent clipping of shape edges/borders
  const containerPadding = 4;
  const cellGap = 1;
  const cellGapSpace = cellGap * 3;
  const availableSize = shapeOptionFullSize - (containerPadding * 2);
  const shapeOptionCellSize = (availableSize - cellGapSpace) / 4;

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

  // Register bounds when component mounts or updates
  // Re-register when shape changes (e.g., after rotation or queue updates)
  // OR when bounds become null (cleared by reducer)
  useEffect(() => {
    // Only register if bounds are null (not already registered)
    if (containerRef.current && boundsAreNull) {
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
  }, [dispatch, shapeIndex, shape, boundsAreNull]);

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
      if (score >= 2) {
        // Deduct cost
        dispatch({
          type: 'ADD_SCORE',
          value: {
            scoreData: {
              rowsCleared: 0,
              columnsCleared: 0,
              pointsEarned: -2
            }
          }
        });

        const clockwise = turningDirection === 'cw';

        dispatch({
          type: 'ROTATE_SHAPE',
          value: { shapeIndex, clockwise }
        });

        // Deactivate turning mode after rotation
        dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
      } else {
        // Not enough score - deactivate mode
        dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
      }

      return;
    }

    // Handle double turn mode - rotate shape 180 degrees (2 rotations)
    if (isDoubleTurnModeActive) {
      if (score >= 3) {
        // Deduct cost
        dispatch({
          type: 'ADD_SCORE',
          value: {
            scoreData: {
              rowsCleared: 0,
              columnsCleared: 0,
              pointsEarned: -3
            }
          }
        });

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
      } else {
        // Not enough score - deactivate mode
        dispatch({ type: 'DEACTIVATE_DOUBLE_TURN_MODE' });
      }

      return;
    }

    if (dragState.selectedShapeIndex === shapeIndex) {
      // Already selected - do nothing, let the global pointerup handler in App.tsx
      // handle the return logic (it will detect we're over a ShapeOption)
      return;
    }

    // Select this shape - DraggingShape will handle all animations
    dispatch({
      type: 'SELECT_SHAPE',
      value: { shapeIndex }
    });
  }, [dispatch, shapeIndex, dragState.selectedShapeIndex, isTurningModeActive, turningDirection, isDoubleTurnModeActive, isAnimatingRemoval, score]);

  const isSelected = dragState.selectedShapeIndex === shapeIndex;

  // Render empty blocks during removal animation
  const displayShape = isAnimatingRemoval
    ? shape.map(row => row.map(block => ({ ...block, isFilled: false })))
    : shape;

  // Simple opacity: fully visible when not selected, fade when selected
  const opacity = isSelected ? 0 : 1;

  return (
    <div
      ref={containerRef}
      className={`shape-container${isSelected ? ' selected' : ''}`}
      style={{
        '--shape-cell-size': `${shapeOptionCellSize}px`,
        '--shape-cell-gap': `${cellGap}px`,
        '--centering-offset-x': `${centeringOffset.x}px`,
        '--centering-offset-y': `${centeringOffset.y}px`,
        '--block-border-width': `${shapeOptionCellSize * 0.2}px`,
        opacity,
        transition: 'opacity 0.15s ease-out',
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
    >
      {displayShape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="shape-tile-visual"
          >
            <BlockVisual block={block} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;