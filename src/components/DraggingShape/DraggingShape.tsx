import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { getShapeAnchorBlock } from '../../utils/shapeUtils';
import { useEffect, useState } from 'react';

export default function DraggingShape() {
  const {
    selectedShape,
    mousePosition,
    mouseGridLocation,
    gridTileSize,
    gridBounds,
    placementAnimationState,
    animationStartPosition,
    animationTargetPosition,
  } = useTetrixStateContext();

  const dispatch = useTetrixDispatchContext();
  const [animationProgress, setAnimationProgress] = useState(0);

  // Detect if this is a touch device (mobile)
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
  // Offset shape above finger on mobile (in pixels) - roughly 2-3 shape heights
  const MOBILE_TOUCH_OFFSET = isTouchDevice && gridTileSize ? gridTileSize * 2.5 : 0;

  // Animate position during placement
  useEffect(() => {
    if (placementAnimationState !== 'placing' || !animationStartPosition || !animationTargetPosition) {
      setAnimationProgress(0);
      return;
    }

    const ANIMATION_DURATION = 250; // 250ms total animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
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

  if (!selectedShape || !gridTileSize || !gridBounds) {
    return null;
  }

  // Don't render during non-dragging states
  if (!mousePosition && placementAnimationState === 'none') {
    return null;
  }

  // Calculate the shape's anchor block
  const shapeAnchor = getShapeAnchorBlock(selectedShape);
  const tileWithGap = gridTileSize + 2;

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
      const targetCellCenterX = targetCellLeft + gridTileSize / 2;
      const targetCellCenterY = targetCellTop + gridTileSize / 2;

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
    const hoveredCellCenterX = hoveredCellLeft + gridTileSize / 2;
    const hoveredCellCenterY = hoveredCellTop + gridTileSize / 2;

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
    gridTemplateColumns: `repeat(4, ${gridTileSize}px)`,
    gridTemplateRows: `repeat(4, ${gridTileSize}px)`,
    gap: '2px',
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
              width: `${gridTileSize}px`,
              height: `${gridTileSize}px`,
              position: 'relative',
            }}
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
