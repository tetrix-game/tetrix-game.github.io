import { shapeTransforms } from '../shapeTransforms';
import { isValidPlacement } from '../shapeValidation';
import type { Shape, TilesSet, GameMode } from '../types';

const { rotateShape } = shapeTransforms;

/**
 * Check if the game is over (no valid moves left)
 *
 * @param tiles - The current state of the grid
 * @param shapes - The list of available shapes in the queue
 * @param openRotationMenus - The state of rotation menus for each shape
 * @param gameMode - The current game mode (optional, defaults to 'infinite')
 * @param currentScore - The player's current score (optional, defaults to 0)
 * @returns true if no shape can be placed anywhere on the grid
 */
export function checkGameOver(
  tiles: TilesSet,
  shapes: Shape[],
  openRotationMenus: boolean[],
  gameMode: GameMode = 'infinite',
  currentScore: number = 0,
): boolean {
  // If no shapes left, it's not game over (new ones will spawn)
  if (shapes.length === 0) {
    return false;
  }

  // For each available shape
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const isRotationUnlocked = openRotationMenus[i];
    const canAffordRotation = currentScore >= 1; // Rotation costs 1 point

    // Determine how many rotations we can check
    // If rotation menu is already open for this shape, check all 4 rotations
    // If rotation menu is closed but player can afford to unlock it, check all 4 rotations
    // Otherwise, only check the current orientation (1 rotation)
    const rotationsToCheck = (isRotationUnlocked || canAffordRotation) ? 4 : 1;

    let currentShape = shape;
    for (let rotation = 0; rotation < rotationsToCheck; rotation++) {
      // Check all possible grid positions
      // The grid is 10x10. The shape is 4x4.
      // We need to check placement where the top-left of the 4x4 grid
      // could be such that the shape fits.
      // Since isValidPlacement handles bounds checking, we can iterate
      // a slightly larger range to be safe.
      // Range: -3 to 10 covers all possibilities where at least one block might be in bounds
      // (though isValidPlacement requires ALL filled blocks to be in bounds)
      for (let row = -3; row <= 10; row++) {
        for (let col = -3; col <= 10; col++) {
          if (isValidPlacement(currentShape, { row, column: col }, tiles, gameMode)) {
            return false; // Found a valid move!
          }
        }
      }

      // Rotate for next iteration (only if we're going to check it)
      if (rotation < rotationsToCheck - 1) {
        currentShape = rotateShape(currentShape);
      }
    }
  }

  return true; // No valid moves found for any shape in any rotation
}

// Facade export to match folder name
export const gameOverUtils = {
  checkGameOver,
};
