import type { Shape, ColorName } from '../../types/core';
import type { ColorProbability } from '../../types/shapeQueue';
import { rotateShape, cloneShape } from './shapeTransforms';

/**
 * Shape generation with configurable color probabilities
 */

/**
 * Select a random color based on probability weights
 * @param probabilities Array of colors and their weights
 * @returns Selected color
 */
export function selectColorByProbability(probabilities: ColorProbability[]): ColorName {
  // Calculate total weight
  const totalWeight = probabilities.reduce((sum, p) => sum + p.weight, 0);
  
  if (totalWeight === 0) {
    // Fallback to first color if no weights
    return probabilities[0]?.color || 'blue';
  }
  
  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight;
  
  // Find which color this random value corresponds to
  let cumulativeWeight = 0;
  for (const { color, weight } of probabilities) {
    cumulativeWeight += weight;
    if (random < cumulativeWeight) {
      return color;
    }
  }
  
  // Fallback (should never reach here)
  return probabilities[probabilities.length - 1].color;
}

/**
 * Generate a random shape with specified color probabilities
 * @param colorProbabilities Array of colors and their weights
 * @returns Random shape with color selected by probability
 */
export function generateRandomShapeWithProbabilities(
  colorProbabilities: ColorProbability[]
): Shape {
  const color = selectColorByProbability(colorProbabilities);
  
  // Use same logic as generateRandomShape but with selected color
  const _ = () => ({ color: selectColorByProbability(colorProbabilities), isFilled: false });
  const X = () => ({ color, isFilled: true });

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

/**
 * Generate multiple shapes with color probabilities
 * @param count Number of shapes to generate
 * @param colorProbabilities Array of colors and their weights
 * @returns Array of generated shapes
 */
export function generateShapesWithProbabilities(
  count: number,
  colorProbabilities: ColorProbability[]
): Shape[] {
  const shapes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    shapes.push(generateRandomShapeWithProbabilities(colorProbabilities));
  }
  return shapes;
}
