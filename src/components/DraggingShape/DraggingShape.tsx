import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { getShapeAnchorBlock } from '../../utils/shapeUtils';
import { playSound } from '../../utils/soundEffects';
import { useEffect, useState } from 'react';

export default function DraggingShape() {
  const {
    selectedShape,
    mousePosition,
    mouseGridLocation,
    gridBounds,
    placementAnimationState,
    animationStartPosition,
    animationTargetPosition,
  } = useTetrixStateContext();

  const dispatch = useTetrixDispatchContext();
  const [animationProgress, setAnimationProgress] = useState(0);

  // Fixed grid dimensions - 400px grid with 2px gaps
  // Grid has 10 cells with 9 gaps (2px each) = 18px total gap space
  // Cell size = (400 - 18) / 10 = 38.2px
  const FIXED_GRID_SIZE = 400;
  const GRID_GAP = 2;
  const GRID_GAPS_TOTAL = 9 * GRID_GAP; // 18px
  const FIXED_TILE_SIZE = (FIXED_GRID_SIZE - GRID_GAPS_TOTAL) / 10; // 38.2px
  const FIXED_BORDER_WIDTH = FIXED_TILE_SIZE / 2; // 19.1px

  // Detect if this is a touch device (mobile)
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
  // Offset shape above finger on mobile (in pixels) - roughly 2-3 shape heights
  const MOBILE_TOUCH_OFFSET = isTouchDevice ? FIXED_TILE_SIZE * 2.5 : 0;

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
        playSound('click_into_place').catch(error => {
          console.error('Failed to play click_into_place sound:', error);
        });
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
  }, [placementAnimationState, animationStartPosition, animationTargetPosition, dispatch]);

  if (!selectedShape || !gridBounds) {
    return null;
  }

  // Don't render during non-dragging states
  if (!mousePosition && placementAnimationState === 'none') {
    return null;
  }

  // Calculate the shape's anchor block
  const shapeAnchor = getShapeAnchorBlock(selectedShape);
  const tileWithGap = FIXED_TILE_SIZE + GRID_GAP;

  let containerTop: number;
  let containerLeft: number;
  let scale = 1;

  if (placementAnimationState === 'placing' && animationStartPosition && animationTargetPosition) {
    // During placement animation: interpolate to target with scale effect
    const currentX = animationStartPosition.x + (animationTargetPosition.x - animationStartPosition.x) * animationProgress;
    const currentY = animationStartPosition.y + (animationTargetPosition.y - animationStartPosition.y) * animationProgress;

    // Add a subtle scale effect (1.0 -> 0.95 -> 1.0)
    scale = 1 - 0.05 * Math.sin(animationProgress * Math.PI);

    if (mouseGridLocation) {
      // Calculate target cell position
      const targetCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
      const targetCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + FIXED_TILE_SIZE / 2;
      const targetCellCenterY = targetCellTop + FIXED_TILE_SIZE / 2;

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
  } else if (mousePosition && mouseGridLocation) {
    // Normal dragging: follow the mouse
    const hoveredCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
    const hoveredCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
    const hoveredCellCenterX = hoveredCellLeft + FIXED_TILE_SIZE / 2;
    const hoveredCellCenterY = hoveredCellTop + FIXED_TILE_SIZE / 2;

    const mouseOffsetX = mousePosition.x - hoveredCellCenterX;
    const mouseOffsetY = mousePosition.y - hoveredCellCenterY;

    const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
    const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

    containerTop = hoveredCellTop - shapeAnchorOffsetY + mouseOffsetY - MOBILE_TOUCH_OFFSET;
    containerLeft = hoveredCellLeft - shapeAnchorOffsetX + mouseOffsetX;
  } else {
    return null;
  }

  // Safety check
  if (!Number.isFinite(containerTop) || !Number.isFinite(containerLeft)) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: containerTop,
    left: containerLeft,
    pointerEvents: 'none',
    zIndex: 1000,
    display: 'grid',
    gridTemplateColumns: `repeat(4, ${FIXED_TILE_SIZE}px)`,
    gridTemplateRows: `repeat(4, ${FIXED_TILE_SIZE}px)`,
    gap: `${GRID_GAP}px`,
    transform: `scale(${scale})`,
    transition: 'none',
  };

  return (
    <div style={containerStyle}>
      {selectedShape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: `${FIXED_TILE_SIZE}px`,
              height: `${FIXED_TILE_SIZE}px`,
              position: 'relative',
            }}
          >
            {block.isFilled && (
              <BlockVisual block={block} borderWidth={FIXED_BORDER_WIDTH} />
            )}
          </div>
        ))
      ))}
    </div>
  );
}
