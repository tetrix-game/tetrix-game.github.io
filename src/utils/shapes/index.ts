/**
 * Shape utilities - Unified export for all shape-related functions
 * 
 * This module provides a clean API for working with shapes:
 * - Geometry: bounds, centers, positioning
 * - Transforms: rotation, cloning, colors
 * - Validation: placement checking, collision detection
 * - Generation: templates and random shapes
 * - Patterns: super combo detection
 */

// Re-export geometry functions
export {
  getShapeBounds,
  getShapeCenter,
  getShapeAnchorBlock,
  getFilledBlocksRelativeToCenter,
  getShapeGridPositions,
  getFilledBlocks,
  getShapeVisualOffset,
  mousePositionToGridLocation,
} from './shapeGeometry';

// Re-export transform functions
export {
  rotateShape,
  cloneShape,
  createEmptyShape,
  makeRandomColor,
} from './shapeTransforms';

// Re-export validation functions
export {
  makeTileKey,
  canPlaceShape,
  isValidPlacement,
  getInvalidBlocks,
} from './shapeValidation';

// Re-export generation functions
export {
  generateIPiece,
  generateOPiece,
  generateTPiece,
  generateSPiece,
  generateZPiece,
  generateJPiece,
  generateLPiece,
  generateSuperShape,
  generateRandomShape,
} from './shapeGeneration';

// Re-export generation with probabilities
export {
  selectColorByProbability,
  generateRandomShapeWithProbabilities,
  generateShapesWithProbabilities,
} from './shapeGenerationWithProbabilities';

// Re-export pattern detection functions
export {
  detectSuperComboPattern,
} from './shapePatterns';
