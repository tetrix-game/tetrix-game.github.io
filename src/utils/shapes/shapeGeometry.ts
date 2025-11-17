import type { Shape, Block, Location } from '../types';

/**
 * Shape geometry functions - Calculate bounds, centers, and anchor points
 */

/**
 * Get the bounding box of a shape (smallest rectangle that contains all filled blocks)
 */
export function getShapeBounds(shape: Shape): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  width: number;
  height: number;
} {
  let minRow = shape.length;
  let maxRow = -1;
  let minCol = shape[0]?.length ?? 0;
  let maxCol = -1;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col].isFilled) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1,
  };
}

/**
 * Get the center point of a shape based on its filled blocks
 */
export function getShapeCenter(shape: Shape): { row: number; col: number } {
  const bounds = getShapeBounds(shape);

  return {
    row: bounds.minRow + (bounds.height - 1) / 2,
    col: bounds.minCol + (bounds.width - 1) / 2,
  };
}

/**
 * Get the anchor block position for a shape - the block that should be centered on the mouse.
 * For tie-breaking when there's an even number of blocks, choose the block that is above and to the left.
 * 
 * Examples:
 * - 2x2 square: upper-left block
 * - 4x4 square: center block (1.5, 1.5 rounded down to 1, 1)
 * - 1x4 line (any orientation): center between blocks 1 and 2
 */
export function getShapeAnchorBlock(shape: Shape): { row: number; col: number } {
  const bounds = getShapeBounds(shape);

  // For odd dimensions, use the mathematical center (which will be a filled block)
  // For even dimensions, round down to prefer upper-left
  const anchorRow = bounds.minRow + Math.floor((bounds.height - 1) / 2);
  const anchorCol = bounds.minCol + Math.floor((bounds.width - 1) / 2);

  return {
    row: anchorRow,
    col: anchorCol,
  };
}

/**
 * Get all filled block positions relative to the shape's anchor block
 */
export function getFilledBlocksRelativeToCenter(shape: Shape): Array<{ row: number; col: number; block: Block }> {
  const anchor = getShapeAnchorBlock(shape);
  const filledBlocks: Array<{ row: number; col: number; block: Block }> = [];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col].isFilled) {
        filledBlocks.push({
          row: row - anchor.row,
          col: col - anchor.col,
          block: shape[row][col],
        });
      }
    }
  }

  return filledBlocks;
}

/**
 * Calculate grid positions for a shape centered at a specific location
 */
export function getShapeGridPositions(
  shape: Shape,
  centerLocation: Location
): Array<{ location: Location; block: Block }> {
  const relativeBlocks = getFilledBlocksRelativeToCenter(shape);

  return relativeBlocks.map(({ row, col, block }) => ({
    location: {
      row: Math.round(centerLocation.row + row),
      column: Math.round(centerLocation.column + col),
    },
    block,
  }));
}

/**
 * Get all filled blocks from a shape
 */
export function getFilledBlocks(shape: Shape): Array<{ row: number; col: number; block: Block }> {
  const filledBlocks: Array<{ row: number; col: number; block: Block }> = [];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col].isFilled) {
        filledBlocks.push({ row, col, block: shape[row][col] });
      }
    }
  }

  return filledBlocks;
}

/**
 * Calculate the visual offset from 4x4 grid center to filled blocks center
 * This is used to position the dragging shape visual so filled blocks appear centered on the mouse
 */
export function getShapeVisualOffset(
  shape: Shape,
  tileSize: number,
  gridGap: number
): { offsetX: number; offsetY: number } {
  const bounds = getShapeBounds(shape);

  // Calculate center of filled blocks within the 4x4 grid (0-indexed)
  const filledCenterCol = bounds.minCol + (bounds.width - 1) / 2;
  const filledCenterRow = bounds.minRow + (bounds.height - 1) / 2;

  // The 4x4 grid's center is at (1.5, 1.5) in 0-indexed coordinates
  const gridCenter = 1.5;

  // Calculate offset from 4x4 center to filled blocks center
  const offsetX = (filledCenterCol - gridCenter) * (tileSize + gridGap);
  const offsetY = (filledCenterRow - gridCenter) * (tileSize + gridGap);

  return { offsetX, offsetY };
}

/**
 * Convert a mouse position to a grid location
 * Returns null if the mouse is outside the grid bounds
 * 
 * When a shape is provided, calculates the grid location based on where the visual
 * 4x4 container's top-left corner would be positioned. This matches the actual visual
 * appearance of the dragging shape.
 * 
 * The shape visual is centered on filled blocks (not the 4x4 grid center), so we:
 * 1. Calculate the 4x4 container's top-left corner position
 * 2. Map that corner to grid coordinates
 * 3. Determine which grid cell that maps to
 */
export function mousePositionToGridLocation(
  mouseX: number,
  mouseY: number,
  gridElement: HTMLElement,
  gridSize: { rows: number; columns: number },
  offsetY: number = 0,
  shape?: Shape
): Location | null {
  const rect = gridElement.getBoundingClientRect();

  // Grid has 10 cells with 2px gaps (9 gaps between cells)
  const GRID_GAP = 2;
  const gridGapSpace = GRID_GAP * 9;
  const tileSize = (rect.width - gridGapSpace) / gridSize.columns;
  const tileWithGap = tileSize + GRID_GAP; // Distance from one tile's left edge to the next

  // Apply offset (for mobile touch positioning)
  const adjustedMouseX = mouseX;
  const adjustedMouseY = mouseY - offsetY;

  // Calculate the 4x4 visual container's top-left corner position
  let containerTopLeftX = adjustedMouseX;
  let containerTopLeftY = adjustedMouseY;

  if (shape) {
    // Calculate the visual offset (filled blocks center relative to 4x4 grid center)
    const { offsetX, offsetY } = getShapeVisualOffset(shape, tileSize, GRID_GAP);

    // The 4x4 container dimensions
    const shapeWidth = 4 * tileSize + 3 * GRID_GAP;
    const shapeHeight = 4 * tileSize + 3 * GRID_GAP;

    // DraggingShape positions the container so filled blocks are centered on mouse:
    // containerLeft = mouseX - shapeWidth/2 - centerOffsetX
    // We reverse this to find where the container's top-left actually is
    containerTopLeftX = adjustedMouseX - shapeWidth / 2 - offsetX;
    containerTopLeftY = adjustedMouseY - shapeHeight / 2 - offsetY;
  }

  // Check if the container's top-left corner is within reasonable bounds
  // Allow some tolerance for shapes near the edge
  const tolerance = tileSize * 2; // Allow up to 2 tiles outside
  if (
    containerTopLeftX < rect.left - tolerance ||
    containerTopLeftX > rect.right + tolerance ||
    containerTopLeftY < rect.top - tolerance ||
    containerTopLeftY > rect.bottom + tolerance
  ) {
    return null;
  }

  // Calculate grid position relative to the container's top-left corner
  const relativeX = containerTopLeftX - rect.left;
  const relativeY = containerTopLeftY - rect.top;

  // Calculate which tile the container's top-left corner is in
  // Use tileWithGap to match the visual spacing
  const exactColumn = relativeX / tileWithGap;
  const exactRow = relativeY / tileWithGap;

  // Round to nearest integer - when top-left is between tiles, pick the nearest
  const column = Math.round(exactColumn) + 1; // +1 for 1-indexed
  const row = Math.round(exactRow) + 1; // +1 for 1-indexed

  // Clamp to valid grid bounds
  const clampedColumn = Math.max(1, Math.min(gridSize.columns, column));
  const clampedRow = Math.max(1, Math.min(gridSize.rows, row));

  return { row: clampedRow, column: clampedColumn };
}
