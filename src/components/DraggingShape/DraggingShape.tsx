import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { getShapeAnchorBlock } from '../../utils/shapeUtils';
import { usePlacementAnimation } from '../../hooks/usePlacementAnimation';
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

  const { isAnimating } = usePlacementAnimation(
    placementAnimationState,
    animationStartPosition,
    animationTargetPosition
  );

  const [animationProgress, setAnimationProgress] = useState(0);

  // Animate position during placement
  useEffect(() => {
    if (!isAnimating || !animationStartPosition || !animationTargetPosition) {
      setAnimationProgress(0);
      return;
    }

    const ANIMATION_DURATION = 300;
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
        // Animation complete - dispatch based on animation type
        if (placementAnimationState === 'returning') {
          dispatch({ type: 'COMPLETE_RETURN_ANIMATION' });
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, animationStartPosition, animationTargetPosition, placementAnimationState, dispatch]);

  if (!selectedShape || !gridTileSize || !gridBounds) {
    return null;
  }

  // Unmount during settling phase (TileVisual hoveredBlocks take over with grow animation)
  // But stay mounted during 'returning' to show return animation
  if (placementAnimationState === 'settling') {
    return null;
  }

  // If no mouse position and not animating, don't render
  if (!mousePosition && !isAnimating) {
    return null;
  }

  // Calculate the shape's anchor block - the block that should align with the mouse
  const shapeAnchor = getShapeAnchorBlock(selectedShape);
  const tileWithGap = gridTileSize + 2;

  let containerTop: number;
  let containerLeft: number;

  if (isAnimating && animationStartPosition && animationTargetPosition) {
    // During animation: interpolate from start to target
    const currentX = animationStartPosition.x + (animationTargetPosition.x - animationStartPosition.x) * animationProgress;
    const currentY = animationStartPosition.y + (animationTargetPosition.y - animationStartPosition.y) * animationProgress;

    if (placementAnimationState === 'returning') {
      // Returning to selector: animate directly to target position (center of shape)
      const shapeAnchorOffsetX = shapeAnchor.col * tileWithGap;
      const shapeAnchorOffsetY = shapeAnchor.row * tileWithGap;

      containerTop = currentY - shapeAnchorOffsetY;
      containerLeft = currentX - shapeAnchorOffsetX;
    } else if (mouseGridLocation) {
      // Placing on grid: use grid-aligned animation
      // Calculate target cell position
      const targetCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
      const targetCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + gridTileSize / 2;
      const targetCellCenterY = targetCellTop + gridTileSize / 2;

      // Offset from current animated position to target cell center
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

    containerTop = hoveredCellTop - shapeAnchorOffsetY + mouseOffsetY;
    containerLeft = hoveredCellLeft - shapeAnchorOffsetX + mouseOffsetX;
  } else {
    return null;
  }

  // Safety check: ensure valid positions
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
    gridTemplateColumns: `repeat(3, ${gridTileSize}px)`,
    gridTemplateRows: `repeat(3, ${gridTileSize}px)`,
    gap: '2px',
    transition: isAnimating ? 'none' : undefined,
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
              <BlockVisual block={block} isHovered={true} />
            )}
          </div>
        ))
      ))}
    </div>
  );
}
