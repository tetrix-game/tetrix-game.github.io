import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { getShapeAnchorBlock } from '../../utils/shapeUtils';
import { useSoundEffects } from '../SoundEffectsContext';
import { useEffect, useState } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import './DraggingShape.css';

export default function DraggingShape() {
  const {
    selectedShape,
    mousePosition,
    mouseGridLocation,
    gridBounds,
    placementAnimationState,
    animationStartPosition,
    animationTargetPosition,
    pickupAnimationState,
    pickupStartPosition,
  } = useTetrixStateContext();

  const dispatch = useTetrixDispatchContext();
  const { playSound } = useSoundEffects();
  const [animationProgress, setAnimationProgress] = useState(0);
  const [pickupProgress, setPickupProgress] = useState(0);

  // Get dynamic sizing from hook
  const { gridSize, gridGap } = useGameSizing();

  // Calculate dynamic grid dimensions
  const GRID_GAP = gridGap;
  const GRID_GAPS_TOTAL = 9 * GRID_GAP;
  const TILE_SIZE = (gridSize - GRID_GAPS_TOTAL) / 10;

  // Detect if this is a touch device (mobile)
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
  // Offset shape above finger on mobile (in pixels) - roughly 2-3 shape heights
  const MOBILE_TOUCH_OFFSET = isTouchDevice ? TILE_SIZE * 2.5 : 0;

  // Animate pick-up from ShapeOption to cursor
  useEffect(() => {
    if (pickupAnimationState !== 'animating' || !pickupStartPosition) {
      setPickupProgress(1); // Fully picked up if not animating
      return;
    }

    const PICKUP_DURATION = 600; // 600ms animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / PICKUP_DURATION, 1);

      // Ease-in-out cubic for smooth pick-up
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setPickupProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - shape now follows cursor normally
        setPickupProgress(1);
      }
    };

    requestAnimationFrame(animate);
  }, [pickupAnimationState, pickupStartPosition]);

  // Animate position during placement
  useEffect(() => {
    if (placementAnimationState !== 'placing' || !animationStartPosition || !animationTargetPosition) {
      setAnimationProgress(0);
      return;
    }

    const ANIMATION_DURATION = 300; // 500ms total animation (doubled from 250ms)
    const SOUND_DURATION = 97; // Duration of click_into_place.mp3 in milliseconds
    const SOUND_START_TIME = ANIMATION_DURATION - SOUND_DURATION; // Start sound so it ends with animation (343ms)

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

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - place the shape
        dispatch({ type: 'COMPLETE_PLACEMENT' });
      }
    };

    requestAnimationFrame(animate);
  }, [placementAnimationState, animationStartPosition, animationTargetPosition, dispatch, playSound]);

  if (!selectedShape) {
    return null;
  }

  // Don't render during non-dragging states
  if (!mousePosition && placementAnimationState === 'none') {
    return null;
  }

  // Calculate the shape's anchor block
  const shapeAnchor = getShapeAnchorBlock(selectedShape);
  const tileWithGap = TILE_SIZE + GRID_GAP;

  let containerTop: number;
  let containerLeft: number;
  let scale = 1;

  if (placementAnimationState === 'placing' && animationStartPosition && animationTargetPosition && gridBounds) {
    // During placement animation: interpolate to target with scale effect
    const currentX = animationStartPosition.x + (animationTargetPosition.x - animationStartPosition.x) * animationProgress;
    const currentY = animationStartPosition.y + (animationTargetPosition.y - animationStartPosition.y) * animationProgress;

    // Add a subtle scale effect (1.0 -> 0.95 -> 1.0)
    scale = 1 - 0.05 * Math.sin(animationProgress * Math.PI);

    if (mouseGridLocation) {
      // Calculate target cell position
      const targetCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
      const targetCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + TILE_SIZE / 2;
      const targetCellCenterY = targetCellTop + TILE_SIZE / 2;

      // Offset from animated position to target cell center
      const offsetX = currentX - targetCellCenterX;
      const offsetY = currentY - targetCellCenterY;

      const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
      const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

      containerTop = targetCellTop - shapeAnchorOffsetY + offsetY;
      containerLeft = targetCellLeft - shapeAnchorOffsetX + offsetX;
    } else {
      return null;
    }
  } else if (pickupProgress < 1 && pickupStartPosition) {
    // During pick-up animation: interpolate from ShapeOption to cursor
    const targetX = mousePosition.x;
    const targetY = mousePosition.y - MOBILE_TOUCH_OFFSET;

    const currentX = pickupStartPosition.x + (targetX - pickupStartPosition.x) * pickupProgress;
    const currentY = pickupStartPosition.y + (targetY - pickupStartPosition.y) * pickupProgress;

    // Calculate position based on animated coordinates
    if (mouseGridLocation && gridBounds) {
      const hoveredCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
      const hoveredCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
      const hoveredCellCenterX = hoveredCellLeft + TILE_SIZE / 2;
      const hoveredCellCenterY = hoveredCellTop + TILE_SIZE / 2;

      const mouseOffsetX = currentX - hoveredCellCenterX;
      const mouseOffsetY = currentY - hoveredCellCenterY;

      const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
      const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

      containerTop = hoveredCellTop - shapeAnchorOffsetY + mouseOffsetY;
      containerLeft = hoveredCellLeft - shapeAnchorOffsetX + mouseOffsetX;
    } else {
      // Not over grid yet - position directly at animated coordinates
      const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
      const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

      containerTop = currentY - shapeAnchorOffsetY - TILE_SIZE / 2;
      containerLeft = currentX - shapeAnchorOffsetX - TILE_SIZE / 2;
    }
  } else if (mousePosition && mouseGridLocation && gridBounds) {
    // Normal dragging over grid: follow the mouse snapped to grid
    const hoveredCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
    const hoveredCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
    const hoveredCellCenterX = hoveredCellLeft + TILE_SIZE / 2;
    const hoveredCellCenterY = hoveredCellTop + TILE_SIZE / 2;

    const mouseOffsetX = mousePosition.x - hoveredCellCenterX;
    const mouseOffsetY = mousePosition.y - hoveredCellCenterY;

    const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
    const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

    containerTop = hoveredCellTop - shapeAnchorOffsetY + mouseOffsetY - MOBILE_TOUCH_OFFSET;
    containerLeft = hoveredCellLeft - shapeAnchorOffsetX + mouseOffsetX;
  } else if (mousePosition) {
    // Outside grid: position directly at mouse cursor
    const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
    const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

    containerTop = mousePosition.y - shapeAnchorOffsetY - TILE_SIZE / 2 - MOBILE_TOUCH_OFFSET;
    containerLeft = mousePosition.x - shapeAnchorOffsetX - TILE_SIZE / 2;
  } else {
    return null;
  }

  // Safety check
  if (!Number.isFinite(containerTop) || !Number.isFinite(containerLeft)) {
    return null;
  }

  return (
    <div
      className="dragging-shape-container"
      style={{
        '--container-top': `${containerTop}px`,
        '--container-left': `${containerLeft}px`,
        '--tile-size': `${TILE_SIZE}px`,
        '--grid-gap': `${GRID_GAP}px`,
        '--scale': scale,
      } as React.CSSProperties}
    >
      {selectedShape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="dragging-shape-cell"
          >
            {block.isFilled && (
              <BlockVisual block={block} />
            )}
          </div>
        ))
      ))}
    </div>
  );
}
