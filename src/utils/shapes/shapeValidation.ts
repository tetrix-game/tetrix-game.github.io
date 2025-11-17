import type { Shape, Location, TilesSet } from '../types';

/**
 * Shape validation functions - Placement validation and collision detection
 */

/**
 * Helper function to create a tile key from location
 */
export function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

/**
 * Check if a shape can be placed at a given location on the grid
 * @param shape - The 4x4 shape grid
 * @param gridTopLeftLocation - Location where the 4x4 grid's top-left corner (0,0) would be placed
 * @param gridSize - Size of the grid (rows and columns)
 * @param tiles - Map of tile keys to tile data for checking occupancy
 * @returns true if the shape can be placed without overlapping or going out of bounds
 */
export function canPlaceShape(
  shape: Shape,
  gridTopLeftLocation: Location,
  gridSize: { rows: number; columns: number },
  tiles: TilesSet
): boolean {
  // Iterate through all 16 tiles of the 4x4 shape
  for (let shapeRow = 0; shapeRow < 4; shapeRow++) {
    for (let shapeCol = 0; shapeCol < 4; shapeCol++) {
      const block = shape[shapeRow][shapeCol];

      // Only check filled blocks
      if (block.isFilled) {
        // Calculate the grid position for this block
        const gridRow = gridTopLeftLocation.row + shapeRow;
        const gridCol = gridTopLeftLocation.column + shapeCol;

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
 * @param gridTopLeftLocation - Location where the 4x4 grid's top-left corner (0,0) would be placed
 * @param tiles - Map of tile keys to tile data for O(1) lookup
 * @returns true if the shape can be placed without overlapping filled tiles or going out of bounds
 */
export function isValidPlacement(
  shape: Shape,
  gridTopLeftLocation: Location | null,
  tiles: TilesSet
): boolean {
  // Return false if location is null
  if (gridTopLeftLocation === null) {
    return false;
  }

  // Iterate through all 16 tiles of the 4x4 shape
  for (let shapeRow = 0; shapeRow < 4; shapeRow++) {
    for (let shapeCol = 0; shapeCol < 4; shapeCol++) {
      const block = shape[shapeRow][shapeCol];

      // Only check filled blocks
      if (block.isFilled) {
        // Calculate the grid position for this block
        const gridRow = gridTopLeftLocation.row + shapeRow;
        const gridCol = gridTopLeftLocation.column + shapeCol;

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
 * Get the positions of blocks in the shape that cannot be placed (out of bounds or overlapping)
 * Returns an array of shape-relative coordinates (row, col in the 4x4 grid)
 * 
 * @param shape - The 4x4 shape grid to check
 * @param gridTopLeftLocation - Location where the 4x4 grid's top-left corner (0,0) would be placed
 * @param tiles - Map of tile keys to tile data for O(1) lookup
 * @returns Array of invalid block positions with their shape-relative coordinates
 */
export function getInvalidBlocks(
  shape: Shape,
  gridTopLeftLocation: Location | null,
  tiles: TilesSet
): Array<{ shapeRow: number; shapeCol: number }> {
  const invalidBlocks: Array<{ shapeRow: number; shapeCol: number }> = [];

  // Return empty array if location is null
  if (gridTopLeftLocation === null) {
    return invalidBlocks;
  }

  // Iterate through all 16 tiles of the 4x4 shape
  for (let shapeRow = 0; shapeRow < 4; shapeRow++) {
    for (let shapeCol = 0; shapeCol < 4; shapeCol++) {
      const block = shape[shapeRow][shapeCol];

      // Only check filled blocks
      if (block.isFilled) {
        // Calculate the grid position for this block
        const gridRow = gridTopLeftLocation.row + shapeRow;
        const gridCol = gridTopLeftLocation.column + shapeCol;

        // Check bounds (10x10 grid, 1-indexed)
        const outOfBounds = gridRow < 1 || gridRow > 10 || gridCol < 1 || gridCol > 10;

        // Check if position is already occupied using O(1) Map lookup
        let overlapping = false;
        if (!outOfBounds) {
          const tileKey = makeTileKey(gridRow, gridCol);
          const tileData = tiles.get(tileKey);
          overlapping = tileData?.isFilled ?? false;
        }

        // If invalid, add to the list
        if (outOfBounds || overlapping) {
          invalidBlocks.push({ shapeRow, shapeCol });
        }
      }
    }
  }

  return invalidBlocks;
}
