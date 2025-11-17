import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { useSoundEffects } from '../SoundEffectsContext';
import { useEffect, useState } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugEditor } from '../DebugEditor';
import './DraggingShape.css';

export default function DraggingShape() {
  const {
    dragState,
    mousePosition,
    shapeOptionBounds,
  } = useTetrixStateContext();

  const dispatch = useTetrixDispatchContext();
  const { playSound } = useSoundEffects();
  const [animationProgress, setAnimationProgress] = useState(0);
  const { state: debugState } = useDebugEditor();

  // Get dynamic sizing from hook
  const { gridSize, gridGap } = useGameSizing();

  // Calculate dynamic grid dimensions
  const GRID_GAP = gridGap;
  const GRID_GAPS_TOTAL = 9 * GRID_GAP;
  const TILE_SIZE = (gridSize - GRID_GAPS_TOTAL) / 10;

  // Get touch offset from precomputed offsets or calculate fallback
  const MOBILE_TOUCH_OFFSET = dragState.dragOffsets?.touchOffset ?? 0;

  // Play pickup sound when animation starts
  useEffect(() => {
    if (dragState.phase === 'picking-up' && dragState.startTime) {
      playSound('pickup_shape');
    }
  }, [dragState.phase, dragState.startTime, playSound]);

  // Animate pick-up from ShapeOption to cursor
  useEffect(() => {
    if (dragState.phase !== 'picking-up' || !dragState.sourcePosition) {
      setAnimationProgress(dragState.phase === 'dragging' ? 1 : 0);
      return;
    }

    const PICKUP_DURATION = 300; // 300ms animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / PICKUP_DURATION, 1);

      // Ease-out cubic for smooth pick-up
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - transition to dragging phase
        setAnimationProgress(1);
        // Note: The reducer will handle the phase transition via UPDATE_MOUSE_LOCATION
      }
    };

    requestAnimationFrame(animate);
  }, [dragState.phase, dragState.sourcePosition]);

  // Animate placement
  useEffect(() => {
    if (dragState.phase !== 'placing' || !dragState.targetPosition) {
      return;
    }

    const ANIMATION_DURATION = 300; // 300ms total animation
    const SOUND_DURATION = 97; // Duration of click_into_place.mp3 in milliseconds
    const SOUND_START_TIME = ANIMATION_DURATION - SOUND_DURATION; // Start sound so it ends with animation

    const startTime = performance.now();
    let soundTriggered = false;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Trigger sound at the right time so it ends with the animation
      if (!soundTriggered && elapsed >= SOUND_START_TIME) {
        soundTriggered = true;
        playSound('click_into_place');
      }

      // Ease-in cubic for magnetic acceleration (like being pulled in)
      const eased = Math.pow(progress, 3);
      setAnimationProgress(eased);

      if (progress >= 1) {
        // Animation complete - dispatch completion which will place the shape and hide DraggingShape
        dispatch({ type: 'COMPLETE_PLACEMENT' });
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [dragState.phase, dragState.targetPosition, dispatch, playSound]);

  // Animate return to selector
  useEffect(() => {
    if (dragState.phase !== 'returning' || !dragState.sourcePosition) {
      return;
    }

    const RETURN_DURATION = 250; // 250ms return animation (slightly faster than pickup)
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / RETURN_DURATION, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress >= 1) {
        // Animation complete - dispatch completion to clear the shape
        dispatch({ type: 'COMPLETE_RETURN' });
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [dragState.phase, dragState.sourcePosition, dispatch]);

  if (!dragState.selectedShape || dragState.selectedShapeIndex === null) {
    return null;
  }

  // Don't render if not in an active drag phase
  if (dragState.phase === 'none') {
    return null;
  }

  // Calculate cell size and gap based on phase
  let cellSize = TILE_SIZE;
  let cellGap = GRID_GAP;
  let containerTop: number;
  let containerLeft: number;
  let scale = 1;

  const sourcePosition = dragState.sourcePosition;

  if (dragState.phase === 'returning' && sourcePosition && animationProgress < 1) {
    // During return: interpolate from current position back to ShapeOption
    const shapeOptionSize = sourcePosition.width;
    const shapeOptionCellGap = 1;
    const shapeOptionCellSize = (shapeOptionSize - 3 * shapeOptionCellGap) / 4;

    // Interpolate from grid size back to ShapeOption size
    cellSize = TILE_SIZE + (shapeOptionCellSize - TILE_SIZE) * animationProgress;
    cellGap = GRID_GAP + (shapeOptionCellGap - GRID_GAP) * animationProgress;

    // Start at cursor position
    const startX = mousePosition.x;
    const startY = mousePosition.y - MOBILE_TOUCH_OFFSET;

    // End at ShapeOption center
    const targetX = sourcePosition.x + sourcePosition.width / 2;
    const targetY = sourcePosition.y + sourcePosition.height / 2;

    // Interpolate position
    const currentX = startX + (targetX - startX) * animationProgress;
    const currentY = startY + (targetY - startY) * animationProgress;

    // Position the shape centered at the interpolated point
    const shapeWidth = 4 * cellSize + 3 * cellGap;
    const shapeHeight = 4 * cellSize + 3 * cellGap;

    containerLeft = currentX - shapeWidth / 2;
    containerTop = currentY - shapeHeight / 2;

    // Fade out during return
    scale = 1 - 0.2 * animationProgress;

  } else if (dragState.phase === 'picking-up' && sourcePosition) {
    // During pickup: interpolate from ShapeOption size to grid size
    const shapeOptionSize = sourcePosition.width;
    const shapeOptionCellGap = 1; // ShapeOption uses 1px gap
    const shapeOptionCellSize = (shapeOptionSize - 3 * shapeOptionCellGap) / 4; // 4x4 grid with 3 gaps

    cellSize = shapeOptionCellSize + (TILE_SIZE - shapeOptionCellSize) * animationProgress;
    cellGap = shapeOptionCellGap + (GRID_GAP - shapeOptionCellGap) * animationProgress;

    // Calculate shape bounds from ShapeOption bounds
    const bounds = shapeOptionBounds[dragState.selectedShapeIndex];
    if (!bounds) {
      return null;
    }

    // Start at ShapeOption center
    const startX = bounds.left + bounds.width / 2;
    const startY = bounds.top + bounds.height / 2;

    // End at cursor (with mobile offset)
    const targetX = mousePosition.x;
    const targetY = mousePosition.y - MOBILE_TOUCH_OFFSET;

    // Interpolate position
    const currentX = startX + (targetX - startX) * animationProgress;
    const currentY = startY + (targetY - startY) * animationProgress;

    // Position the shape centered at the interpolated point
    const shapeWidth = 4 * cellSize + 3 * cellGap;
    const shapeHeight = 4 * cellSize + 3 * cellGap;

    containerLeft = currentX - shapeWidth / 2;
    containerTop = currentY - shapeHeight / 2;

  } else if (dragState.phase === 'dragging') {
    // During dragging: follow cursor smoothly, centered on filled blocks
    const shapeWidth = 4 * TILE_SIZE + 3 * GRID_GAP;
    const shapeHeight = 4 * TILE_SIZE + 3 * GRID_GAP;

    // Use precomputed visual offset from dragState (calculated once on SELECT_SHAPE)
    const centerOffsetX = dragState.dragOffsets?.visualOffsetX ?? 0;
    const centerOffsetY = dragState.dragOffsets?.visualOffsetY ?? 0;

    // Position container so filled blocks center is at cursor
    containerLeft = mousePosition.x - shapeWidth / 2 - centerOffsetX;
    containerTop = mousePosition.y - MOBILE_TOUCH_OFFSET - shapeHeight / 2 - centerOffsetY;

  } else if (dragState.phase === 'placing' && dragState.targetPosition) {
    // During placement: animate to target position
    // Start from where the shape was during dragging (centered on filled blocks)

    const shapeWidth = 4 * TILE_SIZE + 3 * GRID_GAP;
    const shapeHeight = 4 * TILE_SIZE + 3 * GRID_GAP;

    // Use precomputed visual offset from dragState (calculated once on SELECT_SHAPE)
    const centerOffsetX = dragState.dragOffsets?.visualOffsetX ?? 0;
    const centerOffsetY = dragState.dragOffsets?.visualOffsetY ?? 0;

    // Start position is where the filled blocks center is (same as dragging)
    const startX = mousePosition.x;
    const startY = mousePosition.y - MOBILE_TOUCH_OFFSET;

    // Target position from dragState (center of the placement location)
    const targetX = dragState.targetPosition.x;
    const targetY = dragState.targetPosition.y;

    // Interpolate with easing
    const currentX = startX + (targetX - startX) * animationProgress;
    const currentY = startY + (targetY - startY) * animationProgress;

    // Add a subtle scale effect (1.0 -> 0.95 -> 1.0)
    scale = 1 - 0.05 * Math.sin(animationProgress * Math.PI);

    // Apply the center offset to maintain filled blocks centering during animation
    containerLeft = currentX - shapeWidth / 2 - centerOffsetX;
    containerTop = currentY - shapeHeight / 2 - centerOffsetY;

  } else {
    return null;
  }

  // Safety check
  if (!Number.isFinite(containerTop) || !Number.isFinite(containerLeft)) {
    return null;
  }

  // Create a Set of invalid block positions for quick lookup
  const invalidBlockSet = new Set(
    dragState.invalidBlockPositions.map(pos => `${pos.shapeRow},${pos.shapeCol}`)
  );

  return (
    <div
      className="dragging-shape-container"
      style={{
        '--container-top': `${containerTop}px`,
        '--container-left': `${containerLeft}px`,
        '--tile-size': `${cellSize}px`,
        '--grid-gap': `${cellGap}px`,
        '--scale': scale,
      } as React.CSSProperties}
    >
      {dragState.selectedShape.map((row, rowIndex) => (
        row.map((block, colIndex) => {
          const blockKey = `${rowIndex},${colIndex}`;
          const isInvalid = invalidBlockSet.has(blockKey);

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="dragging-shape-cell"
              style={isInvalid ? {
                // Shrink to half size while maintaining center position
                width: `calc(var(--tile-size) * 0.5)`,
                height: `calc(var(--tile-size) * 0.5)`,
                // Offset to center the smaller block in its cell
                transform: `translate(calc(var(--tile-size) * 0.25), calc(var(--tile-size) * 0.25))`,
              } : undefined}
            >
              {block.isFilled && (
                <BlockVisual block={block} />
              )}
              {!block.isFilled && debugState.isEditorOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    opacity: 0.6,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        })
      ))}
    </div>
  );
}
