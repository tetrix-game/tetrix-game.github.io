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
 * Convert a mouse position to a grid location
 * Returns null if the mouse is outside the grid bounds
 * 
 * The grid location changes only when the mouse moves more than half a tile away from
 * the current tile center. This ensures that shape blocks are at least halfway inside
 * their target tiles before the hover location changes.
 * 
 * When a shape is provided, accounts for the shape's filled blocks center offset
 * to determine which grid cell the shape's center should map to.
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
  const adjustedY = mouseY - offsetY;

  // Calculate shape center offset if shape is provided
  let shapeCenterOffsetX = 0;
  let shapeCenterOffsetY = 0;

  if (shape) {
    const bounds = getShapeBounds(shape);
    // Calculate center of filled blocks in the 4x4 grid
    const filledCenterCol = bounds.minCol + (bounds.width - 1) / 2;
    const filledCenterRow = bounds.minRow + (bounds.height - 1) / 2;
    // Offset from 4x4 grid center (1.5, 1.5)
    const gridCenter = 1.5;
    // Use tileWithGap to match how DraggingShape calculates its visual position
    // This is the distance from one tile edge to the next tile edge
    // NOTE: We ADD the offset because if filled blocks are right of center,
    // the grid location should shift left (positive offset to mouse = earlier grid cell)
    shapeCenterOffsetX = (filledCenterCol - gridCenter) * tileWithGap;
    shapeCenterOffsetY = (filledCenterRow - gridCenter) * tileWithGap;
  }

  // Apply shape center offset to mouse position
  // Add (not subtract) because we want to shift the grid calculation
  // in the opposite direction of the visual offset
  const offsetMouseX = mouseX + shapeCenterOffsetX;
  const offsetMouseY = adjustedY + shapeCenterOffsetY;

  // Check if adjusted mouse position is within grid bounds
  if (
    offsetMouseX < rect.left ||
    offsetMouseX > rect.right ||
    offsetMouseY < rect.top ||
    offsetMouseY > rect.bottom
  ) {
    return null;
  }

  const relativeX = offsetMouseX - rect.left;
  const relativeY = offsetMouseY - rect.top;

  // Calculate which tile the mouse is in using fractional coordinates
  // Use tileWithGap to match the visual spacing used in DraggingShape
  const exactColumn = relativeX / tileWithGap;
  const exactRow = relativeY / tileWithGap;

  // Round to nearest integer using standard rounding (0.5 rounds up)
  // This means:
  // - When mouse is at tile center (0.5): rounds up to next tile
  // - When mouse is < 0.5 from left edge: stays in current tile  
  // - When mouse is >= 0.5 from left edge: moves to next tile
  // Result: grid location changes when blocks are more than halfway into the next tile
  const column = Math.round(exactColumn) + 1; // +1 for 1-indexed
  const row = Math.round(exactRow) + 1; // +1 for 1-indexed

  // Clamp to valid grid bounds (should already be in bounds due to earlier check, but be safe)
  const clampedColumn = Math.max(1, Math.min(gridSize.columns, column));
  const clampedRow = Math.max(1, Math.min(gridSize.rows, row));

  return { row: clampedRow, column: clampedColumn };
}
