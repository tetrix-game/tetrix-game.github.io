import type { Shape, Block, Location } from './types';

/**
 * Shape utility functions - Work with shapes as a whole without worrying about individual blocks
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
 * Get all filled block positions relative to the shape's center
 */
export function getFilledBlocksRelativeToCenter(shape: Shape): Array<{ row: number; col: number; block: Block }> {
  const center = getShapeCenter(shape);
  const filledBlocks: Array<{ row: number; col: number; block: Block }> = [];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col].isFilled) {
        filledBlocks.push({
          row: row - center.row,
          col: col - center.col,
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
 * Check if a shape can be placed at a given center location on the grid
 */
export function canPlaceShape(
  shape: Shape,
  centerLocation: Location,
  gridSize: { rows: number; columns: number },
  occupiedPositions: Set<string>
): boolean {
  const positions = getShapeGridPositions(shape, centerLocation);

  for (const { location } of positions) {
    // Check bounds
    if (
      location.row < 1 ||
      location.row > gridSize.rows ||
      location.column < 1 ||
      location.column > gridSize.columns
    ) {
      return false;
    }

    // Check if position is already occupied
    const key = `${location.row},${location.column}`;
    if (occupiedPositions.has(key)) {
      return false;
    }
  }

  return true;
}

/**
 * Convert a mouse position to a grid location
 */
export function mousePositionToGridLocation(
  mouseX: number,
  mouseY: number,
  gridElement: HTMLElement,
  gridSize: { rows: number; columns: number }
): Location | null {
  const rect = gridElement.getBoundingClientRect();

  // Check if mouse is within grid bounds
  if (
    mouseX < rect.left ||
    mouseX > rect.right ||
    mouseY < rect.top ||
    mouseY > rect.bottom
  ) {
    return null;
  }

  const relativeX = mouseX - rect.left;
  const relativeY = mouseY - rect.top;

  const cellWidth = rect.width / gridSize.columns;
  const cellHeight = rect.height / gridSize.rows;

  const column = Math.floor(relativeX / cellWidth) + 1;
  const row = Math.floor(relativeY / cellHeight) + 1;

  return { row, column };
}

/**
 * Create an empty shape (3x3 grid)
 */
export function createEmptyShape(color: Block['color']): Shape {
  return new Array(3).fill(null).map(() =>
    new Array(3).fill(null).map(() => ({
      color,
      isFilled: false,
    }))
  );
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
 * Rotate a shape 90 degrees clockwise
 */
export function rotateShape(shape: Shape): Shape {
  const n = shape.length;
  const rotated: Shape = new Array(n).fill(null).map(() =>
    new Array(n).fill(null).map(() => ({ ...shape[0][0], isFilled: false }))
  );

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      rotated[col][n - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

/**
 * Clone a shape
 */
export function cloneShape(shape: Shape): Shape {
  return shape.map(row => row.map(block => ({ ...block })));
}
