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
  getShapeGridPositions,
  getFilledBlocks,
  getShapeVisualOffset,
  mousePositionToGridLocation,
} from './shapeGeometry';

// Re-export transform functions
export {
  rotateShape,
  cloneShape,
} from './shapeTransforms';

// Re-export validation functions
export {
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
  generate3x3Piece,
  generate3x2Piece,
  generate5x1Piece,
  generate3x1Piece,
  generate2x1Piece,
  generate1x1Piece,
  generateEvenLPiece,
  generateSuperShape,
  generateRandomShape,
} from './shapeGeneration';

// Re-export generation with probabilities
export {
  generateRandomShapeWithProbabilities,
  generateShapesWithProbabilities,
  generateRandomShapeWithGrandpaMode,
} from './shapeGenerationWithProbabilities';

// Re-export pattern detection functions
export {
  detectSuperComboPattern,
} from './shapePatterns';
