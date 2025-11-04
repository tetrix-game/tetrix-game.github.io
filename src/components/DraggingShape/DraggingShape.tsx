import { useTetrixStateContext } from '../Tetrix/TetrixContext';
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

    console.log('[DraggingShape] Starting position interpolation');
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
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, animationStartPosition, animationTargetPosition]);

  if (!selectedShape || !gridTileSize || !gridBounds) {
    return null;
  }

  // Unmount during settling phase (TileVisual hoveredBlocks take over with grow animation)
  if (placementAnimationState === 'settling') {
    console.log('[DraggingShape] Unmounted (settling phase - blocks now on TileVisuals)');
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

  if (isAnimating && animationStartPosition && animationTargetPosition && mouseGridLocation) {
    // During animation: interpolate from start to target
    const currentX = animationStartPosition.x + (animationTargetPosition.x - animationStartPosition.x) * animationProgress;
    const currentY = animationStartPosition.y + (animationTargetPosition.y - animationStartPosition.y) * animationProgress;

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
