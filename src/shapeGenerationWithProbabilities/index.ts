import { getShapeColor, type ShapeType } from '../shapeColorMapping';
import { generateIPiece } from '../shapeGeneration'; // TEMPORARY TEST IMPORT - Remove when board clear testing is complete
import { shapeTransforms } from '../shapeTransforms';
import type { Shape, ColorProbability, Block } from '../types';

const { rotateShape, cloneShape } = shapeTransforms;

/**
 * Shape generation with configurable color probabilities
 * Note: Color probabilities are now deprecated in favor of consistent shape-based colors
 */

/**
 * Helper function to create an empty block
 */
function createEmptyBlock(): Block {
  return { color: 'grey', isFilled: false };
}

/**
 * Generate a random shape with specified color probabilities
 * Note: Color probabilities are now ignored as shapes use consistent colors based on type.
 * This parameter is kept for backward compatibility.
 * @param _colorProbabilities Array of colors and their weights (ignored)
 * @returns Random shape with color based on shape type
 */
export function generateRandomShapeWithProbabilities(
  _colorProbabilities: ColorProbability[],
): Shape {
  // ============================================================
  // TEMPORARY TEST CODE - Remove when board clear testing is complete
  // Force all shapes to be I-pieces (1x4 horizontal lines) for testing full board clears
  // ============================================================
  return generateIPiece('blue');
  // ============================================================
  // END TEMPORARY TEST CODE - Uncomment code below to restore normal behavior
  // ============================================================

  /* ORIGINAL CODE - UNCOMMENT TO RESTORE:

  // Define base shape templates with their type metadata and unique rotation counts
  const shapeTemplates: Array<{ type: ShapeType; rotations: number }> = [
    { type: 'I', rotations: 2 },
    { type: 'O', rotations: 1 },
    { type: 'T', rotations: 4 },
    { type: 'S', rotations: 2 },
    { type: 'Z', rotations: 2 },
    { type: 'J', rotations: 4 },
    { type: 'L', rotations: 4 },
  ];

  // Select a random shape template
  const { type, rotations } = shapeTemplates[Math.floor(Math.random() * shapeTemplates.length)];

  // Get the designated color for this shape type
  const color = getShapeColor(type);
  const _ = createEmptyBlock;
  const X = (): Block => ({ color, isFilled: true });

  // Map shape type to template
  const shapeTypeTemplates: Record<ShapeType, Shape> = {
    'I': [
      [_(), _(), _(), _()],
      [_(), _(), _(), _()],
      [X(), X(), X(), X()],
      [_(), _(), _(), _()],
    ],
    'O': [
      [_(), _(), _(), _()],
      [_(), X(), X(), _()],
      [_(), X(), X(), _()],
      [_(), _(), _(), _()],
    ],
    'T': [
      [_(), _(), _(), _()],
      [_(), X(), _(), _()],
      [X(), X(), X(), _()],
      [_(), _(), _(), _()],
    ],
    'S': [
      [_(), _(), _(), _()],
      [_(), X(), X(), _()],
      [X(), X(), _(), _()],
      [_(), _(), _(), _()],
    ],
    'Z': [
      [_(), _(), _(), _()],
      [X(), X(), _(), _()],
      [_(), X(), X(), _()],
      [_(), _(), _(), _()],
    ],
    'J': [
      [_(), _(), _(), _()],
      [X(), _(), _(), _()],
      [X(), X(), X(), _()],
      [_(), _(), _(), _()],
    ],
    'L': [
      [_(), _(), _(), _()],
      [X(), X(), X(), _()],
      [X(), _(), _(), _()],
      [_(), _(), _(), _()],
    ],
    // Extended shapes (not used in this function but required by type)
    '3x3': [],
    '3x2': [],
    '5x1': [],
    '3x1': [],
    '2x1': [],
    '1x1': [],
    'EvenL': [],
  };

  const template = shapeTypeTemplates[type];

  // Apply a random number of rotations (0 to rotations-1)
  const numRotations = Math.floor(Math.random() * rotations);
  let shape = cloneShape(template);

  for (let i = 0; i < numRotations; i++) {
    shape = rotateShape(shape);
  }

  return shape;

  END OF ORIGINAL CODE - UNCOMMENT ABOVE TO RESTORE */
}

/**
 * Generate multiple shapes with color probabilities
 * @param count Number of shapes to generate
 * @param colorProbabilities Array of colors and their weights
 * @returns Array of generated shapes
 */
export function generateShapesWithProbabilities(
  count: number,
  colorProbabilities: ColorProbability[],
): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    shapes.push(generateRandomShapeWithProbabilities(colorProbabilities));
  }
  return shapes;
}

/**
 * Standard Tetris shape type (subset of full ShapeType)
 */
type StandardShapeType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/**
 * Generate a random shape with specified color probabilities and optional grandpa mode
 * In grandpa mode, Z and S shapes occur at 1/4 their normal frequency
 * Note: Color probabilities are now ignored as shapes use consistent colors based on type.
 * This parameter is kept for backward compatibility.
 * @param _colorProbabilities Array of colors and their weights (ignored)
 * @param grandpaMode If true, reduce Z and S shape frequency to 1/4
 * @returns Random shape with color based on shape type
 */
export function generateRandomShapeWithGrandpaMode(
  _colorProbabilities: ColorProbability[],
  grandpaMode: boolean = false,
): Shape {
  // ============================================================
  // TEMPORARY TEST CODE - Remove when board clear testing is complete
  // Force all shapes to be I-pieces (1x4 horizontal lines) for testing full board clears
  // ============================================================
  return generateIPiece('blue');
  // ============================================================
  // END TEMPORARY TEST CODE - Uncomment code below to restore normal behavior
  // ============================================================

  /* ORIGINAL CODE - UNCOMMENT TO RESTORE:

  // Shape types with their weights (normal = 1, grandpa mode reduces Z/S to 0.25)
  const shapeWeights: Array<{ type: StandardShapeType; weight: number }> = [
    { type: 'I', weight: 1 },
    { type: 'O', weight: 1 },
    { type: 'T', weight: 1 },
    { type: 'S', weight: grandpaMode ? 0.25 : 1 },
    { type: 'Z', weight: grandpaMode ? 0.25 : 1 },
    { type: 'J', weight: 1 },
    { type: 'L', weight: 1 },
  ];

  // Select shape type based on weights
  const totalWeight = shapeWeights.reduce((sum, s) => sum + s.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedType: StandardShapeType = 'I';

  for (const { type, weight } of shapeWeights) {
    cumulativeWeight += weight;
    if (random < cumulativeWeight) {
      selectedType = type;
      break;
    }
  }

  // Get the designated color for this shape type
  const color = getShapeColor(selectedType);
  const _ = createEmptyBlock;
  const X = (): Block => ({ color, isFilled: true });

  // Map shape type to template
  const shapeTemplates: Record<StandardShapeType, { template: Shape; rotations: number }> = {
    'I': {
      template: [
        [_(), _(), _(), _()],
        [_(), _(), _(), _()],
        [X(), X(), X(), X()],
        [_(), _(), _(), _()],
      ],
      rotations: 2,
    },
    'O': {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), X(), _()],
        [_(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 1,
    },
    'T': {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), _(), _()],
        [X(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4,
    },
    'S': {
      template: [
        [_(), _(), _(), _()],
        [_(), X(), X(), _()],
        [X(), X(), _(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 2,
    },
    'Z': {
      template: [
        [_(), _(), _(), _()],
        [X(), X(), _(), _()],
        [_(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 2,
    },
    'J': {
      template: [
        [_(), _(), _(), _()],
        [X(), _(), _(), _()],
        [X(), X(), X(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4,
    },
    'L': {
      template: [
        [_(), _(), _(), _()],
        [X(), X(), X(), _()],
        [X(), _(), _(), _()],
        [_(), _(), _(), _()],
      ],
      rotations: 4,
    },
  };

  const { template, rotations } = shapeTemplates[selectedType];
  const numRotations = Math.floor(Math.random() * rotations);
  let shape = cloneShape(template);

  for (let i = 0; i < numRotations; i++) {
    shape = rotateShape(shape);
  }

  return shape;

  END OF ORIGINAL CODE - UNCOMMENT ABOVE TO RESTORE */
}

// Facade export to match folder name
export const shapeGenerationWithProbabilities = {
  generateRandomShapeWithProbabilities,
  generateShapesWithProbabilities,
  generateRandomShapeWithGrandpaMode,
};
