import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual';
import { getShapeCenter } from '../../utils/shapeUtils';

export default function DraggingShape() {
  const { selectedShape, mousePosition, mouseGridLocation, gridTileSize, gridBounds } = useTetrixStateContext();

  if (!selectedShape || !mousePosition || !mouseGridLocation || !gridTileSize || !gridBounds) {
    return null;
  }

  // Calculate the shape's center in the 3x3 grid
  const shapeCenter = getShapeCenter(selectedShape);

  // Calculate where the mouse-hovered grid cell is in pixels
  const tileWithGap = gridTileSize + 2;

  // The hovered grid cell's top-left corner position
  const hoveredCellLeft = gridBounds.left + (mouseGridLocation.column - 1) * tileWithGap;
  const hoveredCellTop = gridBounds.top + (mouseGridLocation.row - 1) * tileWithGap;

  // The hovered grid cell's center position
  const hoveredCellCenterX = hoveredCellLeft + gridTileSize / 2;
  const hoveredCellCenterY = hoveredCellTop + gridTileSize / 2;

  // Calculate offset from mouse to hovered cell center
  const mouseOffsetX = mousePosition.x - hoveredCellCenterX;
  const mouseOffsetY = mousePosition.y - hoveredCellCenterY;

  // Position the 3x3 grid so that the shape's center block aligns with the hovered grid cell
  // accounting for where the mouse is within that cell
  const shapeCenterOffsetX = shapeCenter.col * tileWithGap;
  const shapeCenterOffsetY = shapeCenter.row * tileWithGap;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: hoveredCellTop - shapeCenterOffsetY + mouseOffsetY,
    left: hoveredCellLeft - shapeCenterOffsetX + mouseOffsetX,
    pointerEvents: 'none', // Don't interfere with mouse events
    zIndex: 1000, // Above everything
    display: 'grid',
    gridTemplateColumns: `repeat(3, ${gridTileSize}px)`,
    gridTemplateRows: `repeat(3, ${gridTileSize}px)`,
    gap: '2px',
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
