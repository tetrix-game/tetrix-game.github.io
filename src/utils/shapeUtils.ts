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
 * Get the anchor block position for a shape - the block that should be centered on the mouse.
 * For tie-breaking when there's an even number of blocks, choose the block that is above and to the left.
 * 
 * Examples:
 * - 2x2 square: upper-left block
 * - 3x3 square: center block
 * - 1x3 line (any orientation): center block
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

/**
 * Generate a random color for a shape
 */
export function makeRandomColor() {
  const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
  const randomColorIndex = Math.floor(Math.random() * colors.length);
  const randomColor = colors[randomColorIndex];

  switch (randomColor) {
    case 'blue':
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };
    case 'red':
      return {
        lightest: '#ff6b6b',
        light: '#ee5a52',
        main: '#d63031',
        dark: '#b71c1c',
        darkest: '#7f0000'
      };
    case 'green':
      return {
        lightest: '#51cf66',
        light: '#40c057',
        main: '#2f9e44',
        dark: '#2b8a3e',
        darkest: '#1b5e20'
      };
    case 'yellow':
      return {
        lightest: '#ffd43b',
        light: '#fcc419',
        main: '#fab005',
        dark: '#f59f00',
        darkest: '#e67700'
      };
    case 'purple':
      return {
        lightest: '#b197fc',
        light: '#9775fa',
        main: '#7950f2',
        dark: '#6741d9',
        darkest: '#4c2a85'
      };
    case 'orange':
      return {
        lightest: '#ffa94d',
        light: '#ff922b',
        main: '#fd7e14',
        dark: '#f76707',
        darkest: '#d9480f'
      };
    default:
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };
  }
}

/**
 * Generate a random shape (one of several predefined Tetris patterns in various orientations)
 * Includes all standard Tetris pieces that fit in a 3x3 grid:
 * - I piece (vertical only - horizontal doesn't fit)
 * - O piece (square, no rotations needed)
 * - T piece (4 rotations)
 * - S piece (2 rotations)
 * - Z piece (2 rotations)
 * - L piece (4 rotations)
 * - J piece (4 rotations)
 * Plus smaller variations for gameplay variety
 */
export function generateRandomShape(): Shape {
  const shapePatterns = [
    // I-piece (vertical) - 3 blocks
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [e, { ...f }, e],
        [e, { ...f }, e],
      ];
    },

    // O-piece (square) - 4 blocks
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [f, { ...f }, e],
        [{ ...f }, { ...f }, e],
        [e, e, e],
      ];
    },

    // T-piece - Rotation 1 (pointing up)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [{ ...f }, { ...f }, { ...f }],
        [e, e, e],
      ];
    },

    // T-piece - Rotation 2 (pointing right)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [e, { ...f }, { ...f }],
        [e, { ...f }, e],
      ];
    },

    // T-piece - Rotation 3 (pointing down)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [{ ...f }, { ...f }, { ...f }],
        [e, { ...f }, e],
      ];
    },

    // T-piece - Rotation 4 (pointing left)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [{ ...f }, { ...f }, e],
        [e, { ...f }, e],
      ];
    },

    // S-piece - Rotation 1 (horizontal)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, { ...f }],
        [{ ...f }, { ...f }, e],
        [e, e, e],
      ];
    },

    // S-piece - Rotation 2 (vertical)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [e, { ...f }, { ...f }],
        [e, e, { ...f }],
      ];
    },

    // Z-piece - Rotation 1 (horizontal)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [f, { ...f }, e],
        [e, { ...f }, { ...f }],
        [e, e, e],
      ];
    },

    // Z-piece - Rotation 2 (vertical)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, f],
        [e, { ...f }, { ...f }],
        [e, { ...f }, e],
      ];
    },

    // L-piece - Rotation 1 (pointing up-right)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, f],
        [e, e, { ...f }],
        [e, { ...f }, { ...f }],
      ];
    },

    // L-piece - Rotation 2 (pointing down-right)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [{ ...f }, { ...f }, { ...f }],
        [{ ...f }, e, e],
      ];
    },

    // L-piece - Rotation 3 (pointing down-left)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [{ ...f }, { ...f }, e],
        [e, { ...f }, e],
        [e, { ...f }, e],
      ];
    },

    // L-piece - Rotation 4 (pointing up-left)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, { ...f }],
        [{ ...f }, { ...f }, { ...f }],
        [e, e, e],
      ];
    },

    // J-piece - Rotation 1 (pointing up-left)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [f, e, e],
        [{ ...f }, e, e],
        [{ ...f }, { ...f }, e],
      ];
    },

    // J-piece - Rotation 2 (pointing down-left)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [{ ...f }, { ...f }, { ...f }],
        [e, e, { ...f }],
      ];
    },

    // J-piece - Rotation 3 (pointing down-right)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, { ...f }, { ...f }],
        [e, { ...f }, e],
        [e, { ...f }, e],
      ];
    },

    // J-piece - Rotation 4 (pointing up-right)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [{ ...f }, e, e],
        [{ ...f }, { ...f }, { ...f }],
        [e, e, e],
      ];
    },

    // Single block (for variety)
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [e, f, e],
        [e, e, e],
      ];
    },

    // 2-block horizontal
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [e, f, { ...f }],
        [e, e, e],
      ];
    },

    // 2-block vertical
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [e, f, e],
        [e, { ...f }, e],
      ];
    },

    // Small L (3 blocks) - Rotation 1
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, f, e],
        [e, { ...f }, e],
        [e, { ...f }, { ...f }],
      ];
    },

    // Small L (3 blocks) - Rotation 2
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [e, e, e],
        [e, e, f],
        [e, { ...f }, { ...f }],
      ];
    },

    // Small L (3 blocks) - Rotation 3
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [{ ...f }, { ...f }, e],
        [e, { ...f }, e],
        [e, e, e],
      ];
    },

    // Small L (3 blocks) - Rotation 4
    () => {
      const color = makeRandomColor();
      const e = { color: makeRandomColor(), isFilled: false };
      const f = { color, isFilled: true };
      return [
        [{ ...f }, { ...f }, e],
        [{ ...f }, e, e],
        [e, e, e],
      ];
    },
  ];

  const randomIndex = Math.floor(Math.random() * shapePatterns.length);
  return shapePatterns[randomIndex]();
}
