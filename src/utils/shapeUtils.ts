import type { Shape, Block, Location, ColorName, TilesSet } from './types';

/**
 * Shape utility functions - Work with shapes as a whole without worrying about individual blocks
 */

/**
 * Helper function to create a tile key from location
 */
export function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

/**
 * Get the bounding box of a shape (smallest rectangle that contains all X blocks)
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
 * Get the center point of a shape based on its X blocks
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

  // For odd dimensions, use the mathematical center (which will be a X block)
  // For even dimensions, round down to prefer upper-left
  const anchorRow = bounds.minRow + Math.floor((bounds.height - 1) / 2);
  const anchorCol = bounds.minCol + Math.floor((bounds.width - 1) / 2);

  return {
    row: anchorRow,
    col: anchorCol,
  };
}

/**
 * Get all X block positions relative to the shape's anchor block
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
 * @param shape - The 4x4 shape grid
 * @param centerLocation - Center location where the shape should be placed
 * @param gridSize - Size of the grid (rows and columns)
 * @param tiles - Map of tile keys to tile data for checking occupancy
 * @returns true if the shape can be placed without overlapping or going out of bounds
 */
export function canPlaceShape(
  shape: Shape,
  centerLocation: Location,
  gridSize: { rows: number; columns: number },
  tiles: TilesSet
): boolean {
  // Get the shape's anchor block
  const anchor = getShapeAnchorBlock(shape);

  // Iterate through the 4x4 shape grid
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    for (let shapeCol = 0; shapeCol < shape[shapeRow].length; shapeCol++) {
      const block = shape[shapeRow][shapeCol];

      // Only check filled blocks
      if (block.isFilled) {
        // Calculate the grid position for this block
        const rowOffset = shapeRow - anchor.row;
        const colOffset = shapeCol - anchor.col;

        const gridRow = centerLocation.row + rowOffset;
        const gridCol = centerLocation.column + colOffset;

        // Check bounds
        if (
          gridRow < 1 ||
          gridRow > gridSize.rows ||
          gridCol < 1 ||
          gridCol > gridSize.columns
        ) {
          return false;
        }

        // Check if position is already occupied
        const tileKey = makeTileKey(gridRow, gridCol);
        const tileData = tiles.get(tileKey);

        if (tileData?.isFilled) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Check if a shape can be placed at a given location based on tile Map
 * This function iterates through the shape's 4x4 grid and checks each filled block
 * against the tiles Map for O(1) lookup performance.
 * 
 * @param shape - The 4x4 shape grid to check
 * @param centerLocation - The center location where the shape should be placed
 * @param tiles - Map of tile keys to tile data for O(1) lookup
 * @returns true if the shape can be placed without overlapping filled tiles or going out of bounds
 */
export function isValidPlacement(
  shape: Shape,
  centerLocation: Location | null,
  tiles: TilesSet
): boolean {
  // Return false if location is null
  if (centerLocation === null) {
    return false;
  }

  // Get the shape's anchor block (the block that should be centered on centerLocation)
  const anchor = getShapeAnchorBlock(shape);

  // Iterate through the 4x4 shape grid
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    for (let shapeCol = 0; shapeCol < shape[shapeRow].length; shapeCol++) {
      const block = shape[shapeRow][shapeCol];

      // Only check filled blocks
      if (block.isFilled) {
        // Calculate the grid position for this block
        // Offset relative to anchor block
        const rowOffset = shapeRow - anchor.row;
        const colOffset = shapeCol - anchor.col;

        // Absolute grid position (1-indexed)
        const gridRow = centerLocation.row + rowOffset;
        const gridCol = centerLocation.column + colOffset;

        // Check bounds (10x10 grid, 1-indexed)
        if (gridRow < 1 || gridRow > 10 || gridCol < 1 || gridCol > 10) {
          return false;
        }

        // Check if position is already occupied using O(1) Map lookup
        const tileKey = makeTileKey(gridRow, gridCol);
        const tileData = tiles.get(tileKey);

        if (tileData?.isFilled) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Convert a mouse position to a grid location
 * Returns null if the mouse is outside the grid bounds
 */
export function mousePositionToGridLocation(
  mouseX: number,
  mouseY: number,
  gridElement: HTMLElement,
  gridSize: { rows: number; columns: number },
  offsetY: number = 0
): Location | null {
  const rect = gridElement.getBoundingClientRect();

  // Apply offset (for mobile touch positioning)
  const adjustedY = mouseY - offsetY;

  // Check if mouse is within grid bounds
  if (
    mouseX < rect.left ||
    mouseX > rect.right ||
    adjustedY < rect.top ||
    adjustedY > rect.bottom
  ) {
    return null;
  }

  const relativeX = mouseX - rect.left;
  const relativeY = adjustedY - rect.top;

  const cellWidth = rect.width / gridSize.columns;
  const cellHeight = rect.height / gridSize.rows;

  const column = Math.floor(relativeX / cellWidth) + 1;
  const row = Math.floor(relativeY / cellHeight) + 1;

  return { row, column };
}

/**
 * Create an _ shape (4x4 grid)
 */
export function createEmptyShape(color: Block['color']): Shape {
  return new Array(4).fill(null).map(() =>
    new Array(4).fill(null).map(() => ({
      color,
      isFilled: false,
    }))
  );
}

/**
 * Get all X blocks from a shape
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
 * @param colorCount - Number of colors to use from the palette (1-7). Defaults to 7.
 *                     Colors are used in rainbow order: Grey, Red, Orange, Yellow, Green, Blue, Purple
 */
export function makeRandomColor(colorCount: number = 7): ColorName {
  // Available colors in rainbow order (starting with grey)
  const allColors: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

  // Clamp colorCount to valid range (1-7)
  const count = Math.max(1, Math.min(7, colorCount));

  // Use only the first 'count' colors from the list
  const colors = allColors.slice(0, count);

  const randomColorIndex = Math.floor(Math.random() * colors.length);
  return colors[randomColorIndex];
}

/**
 * Detect if there's a 4x4 super combo pattern on the grid.
 * Pattern: 4 consecutive rows where each row has exactly 9 filled blocks (one missing),
 * and the missing block position increases or decreases by 1 for each row (forming a diagonal).
 * Same pattern must exist for columns.
 * 
 * Supports both ascending and descending diagonal patterns:
 * 
 * Ascending diagonal example (X = filled, O = empty):
 * Row 1: O X X X X X X X X X
 * Row 2: X O X X X X X X X X
 * Row 3: X X O X X X X X X X
 * Row 4: X X X O X X X X X X
 * 
 * Descending diagonal example (X = filled, O = empty):
 * Row 1: X X X O X X X X X X
 * Row 2: X X O X X X X X X X
 * Row 3: X O X X X X X X X X
 * Row 4: O X X X X X X X X X
 * 
 * @param tiles - Array of tiles (10x10 grid, 1-indexed)
 * @returns true if the pattern exists
 */
export function detectSuperComboPattern(tiles: TilesSet): boolean {
  // Build a 2D grid for easier pattern checking
  const grid: boolean[][] = new Array(11).fill(null).map(() => new Array(11).fill(false));

  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      const tile = tiles.get(makeTileKey(row, column));
      if (tile?.isFilled) {
        grid[row][column] = true;
      }
    }
  }

  // Check all possible 4x4 starting positions
  for (let startRow = 1; startRow <= 7; startRow++) {
    for (let startCol = 1; startCol <= 7; startCol++) {
      if (checkDiagonalPattern(grid, startRow, startCol)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a diagonal pattern exists at the given starting position
 * Checks both ascending and descending diagonal patterns
 */
function checkDiagonalPattern(grid: boolean[][], startRow: number, startCol: number): boolean {
  // Check ascending diagonal (top-left to bottom-right)
  const ascendingRowPattern = checkRowPattern(grid, startRow, startCol, true);
  const ascendingColPattern = checkColumnPattern(grid, startRow, startCol, true);

  if (ascendingRowPattern && ascendingColPattern) {
    return true;
  }

  // Check descending diagonal (top-right to bottom-left)
  const descendingRowPattern = checkRowPattern(grid, startRow, startCol, false);
  const descendingColPattern = checkColumnPattern(grid, startRow, startCol, false);

  return descendingRowPattern && descendingColPattern;
}

/**
 * Check if 4 consecutive rows have the diagonal empty pattern
 * @param ascending - true for ascending diagonal, false for descending
 */
function checkRowPattern(grid: boolean[][], startRow: number, startCol: number, ascending: boolean): boolean {
  for (let i = 0; i < 4; i++) {
    const row = startRow + i;
    const emptyCol = ascending ? startCol + i : startCol + (3 - i);

    if (!isRowValidWithEmptyAt(grid, row, emptyCol)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if 4 consecutive columns have the diagonal empty pattern
 * @param ascending - true for ascending diagonal, false for descending
 */
function checkColumnPattern(grid: boolean[][], startRow: number, startCol: number, ascending: boolean): boolean {
  for (let i = 0; i < 4; i++) {
    const col = startCol + i;
    const emptyRow = ascending ? startRow + i : startRow + (3 - i);

    if (!isColumnValidWithEmptyAt(grid, col, emptyRow)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a row has exactly 9 filled blocks with empty at specified column
 */
function isRowValidWithEmptyAt(grid: boolean[][], row: number, emptyCol: number): boolean {
  let filledCount = 0;
  let hasEmptyAtPosition = false;

  for (let col = 1; col <= 10; col++) {
    if (grid[row][col]) {
      filledCount++;
    } else if (col === emptyCol) {
      hasEmptyAtPosition = true;
    }
  }

  return filledCount === 9 && hasEmptyAtPosition;
}

/**
 * Check if a column has exactly 9 filled blocks with empty at specified row
 */
function isColumnValidWithEmptyAt(grid: boolean[][], col: number, emptyRow: number): boolean {
  let filledCount = 0;
  let hasEmptyAtPosition = false;

  for (let row = 1; row <= 10; row++) {
    if (grid[row][col]) {
      filledCount++;
    } else if (row === emptyRow) {
      hasEmptyAtPosition = true;
    }
  }

  return filledCount === 9 && hasEmptyAtPosition;
}

/**
 * Generate the super combo shape - a 4x4 diagonal piece (easter egg)
 */
export function generateSuperShape(): Shape {
  const color = makeRandomColor();
  const _ = () => ({ color: makeRandomColor(), isFilled: false });
  const X = () => ({ color, isFilled: true });

  // Create diagonal pattern with random orientation
  const baseTemplate = [
    [X(), _(), _(), _()],
    [_(), X(), _(), _()],
    [_(), _(), X(), _()],
    [_(), _(), _(), X()],
  ];

  // Randomly rotate 0 or 1 times (diagonal or anti-diagonal)
  const rotations = Math.floor(Math.random() * 2);
  let shape = cloneShape(baseTemplate);

  for (let i = 0; i < rotations; i++) {
    shape = rotateShape(shape);
  }

  return shape;
}

/**
 * Helper function to create an empty block
 */
function createEmptyBlock(): Block {
  return { color: makeRandomColor(), isFilled: false };
}

/**
 * Helper function to create a filled block with a specific color
 */
function createFilledBlock(color: ColorName): Block {
  return { color, isFilled: true };
}

/**
 * Generate an I-piece (4-block line) in base orientation with specified color
 */
export function generateIPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), _(), _(), _()],
    [X(), X(), X(), X()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate an O-piece (2x2 square) with specified color
 */
export function generateOPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), X(), X(), _()],
    [_(), X(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate a T-piece in base orientation with specified color
 */
export function generateTPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), X(), _(), _()],
    [X(), X(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate an S-piece in base orientation with specified color
 */
export function generateSPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), X(), X(), _()],
    [X(), X(), _(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate a Z-piece in base orientation with specified color
 */
export function generateZPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [X(), X(), _(), _()],
    [_(), X(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate a J-piece in base orientation with specified color
 */
export function generateJPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [X(), _(), _(), _()],
    [X(), X(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate an L-piece in base orientation with specified color
 */
export function generateLPiece(color: ColorName): Shape {
  const _ = createEmptyBlock;
  const X = () => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [X(), X(), X(), _()],
    [X(), _(), _(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Generate a random shape with balanced probability distribution
 * Each base shape type has equal likelihood of being selected, then orientation is randomly chosen
 * 
 * Shape types and their rotation counts:
 * - I-piece (4-block line): 2 unique rotations
 * - O-piece (square): 1 rotation (no change)
 * - T-piece: 4 rotations
 * - S-piece: 2 unique rotations
 * - Z-piece: 2 unique rotations
 * - L-piece: 4 rotations
 * - J-piece: 4 rotations
 * 
 * Note: Super combo piece is not in regular rotation - only generated as easter egg
 */
export function generateRandomShape(): Shape {
  const color = makeRandomColor();
  const _ = () => ({ color: makeRandomColor(), isFilled: false }); // empty block
  const X = () => ({ color, isFilled: true }); // filled block

  // Define base shape templates and their unique rotation counts
  const shapeTemplates: Array<{ template: Shape; rotations: number }> = [
    // I-piece (4-block line) - 2 unique rotations
    {
      template: [
        [_(), _(), _(), _()],
        [_(), _(), _(), _()],
        [X(), X(), X(), X()],
        [_(), _(), _(), _()],
      ],
      rotations: 2
    },
    // O-piece (2x2 square) - 1 rotation (all rotations are identical)
    {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), X(), _()],
        [_(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 1
    },
    // T-piece - 4 rotations
    {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), _(), _()],
        [X(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4
    },
    // S-piece - 2 unique rotations
    {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), X(), _()],
        [X(), X(), _(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 2
    },
    // Z-piece - 2 unique rotations
    {
      template: [
        [_(), _(), _(), _()],
        [X(), X(), _(), _()],
        [_(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 2
    },
    // J-piece - 4 rotations
    {
      template: [
        [_(), _(), _(), _()],
        [X(), _(), _(), _()],
        [X(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4
    },
    // L-piece - 4 rotations
    {
      template: [
        [_(), _(), _(), _()],
        [X(), X(), X(), _()],
        [X(), _(), _(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4
    }
  ];

  // Select a random shape template
  const { template, rotations } = shapeTemplates[Math.floor(Math.random() * shapeTemplates.length)];

  // Apply a random number of rotations (0 to rotations-1)
  const numRotations = Math.floor(Math.random() * rotations);
  let shape = cloneShape(template);

  for (let i = 0; i < numRotations; i++) {
    shape = rotateShape(shape);
  }

  return shape;
}