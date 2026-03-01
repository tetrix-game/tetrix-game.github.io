import type { ColorName } from '../types';

/**
 * Shape type definitions
 * Standard Tetris shapes (7) + Extended shapes (7)
 */
export type ShapeType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' // Standard Tetris shapes
  | '3x3' | '3x2' | '5x1' | '3x1' | '2x1' | '1x1' | 'EvenL'; // Extended shapes

/**
 * Centralized shape-to-color mapping
 * Following traditional Tetris conventions where each shape type has a consistent color
 *
 * Standard Tetris shapes:
 * - I-piece (4-block line) → white (modern take on classic cyan)
 * - O-piece (2x2 square) → yellow
 * - T-piece (T-shaped) → purple
 * - S-piece (S-shaped) → green
 * - Z-piece (Z-shaped) → red
 * - J-piece (J-shaped) → blue
 * - L-piece (L-shaped) → orange
 *
 * Extended shapes:
 * - 3x3Piece (9 blocks) → purple (large power shape)
 * - 3x2Piece (6 blocks) → green (medium rectangle)
 * - 5x1Piece (5 blocks) → white (extended line, similar to I-piece)
 * - 3x1Piece (3 blocks) → orange (small line)
 * - 2x1Piece (2 blocks) → yellow (tiny piece)
 * - 1x1Piece (1 block) → grey (single dot)
 * - EvenLPiece (5 blocks) → red (variant L-shape)
 */
export const SHAPE_COLORS: Record<ShapeType, ColorName> = {
  // Standard Tetris shapes
  'I': 'white',
  'O': 'yellow',
  'T': 'purple',
  'S': 'green',
  'Z': 'red',
  'J': 'blue',
  'L': 'orange',

  // Extended shapes
  '3x3': 'purple',
  '3x2': 'green',
  '5x1': 'white',
  '3x1': 'orange',
  '2x1': 'yellow',
  '1x1': 'grey',
  'EvenL': 'red',
};

/**
 * Get the designated color for a shape type
 * @param shapeType The type of shape
 * @returns The color assigned to this shape type
 */
export function getShapeColor(shapeType: ShapeType): ColorName {
  return SHAPE_COLORS[shapeType];
}

// Facade export to match folder name
export const shapeColorMapping = {
  SHAPE_COLORS,
  getShapeColor,
};
