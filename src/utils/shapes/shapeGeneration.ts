import type { Shape, Block, ColorName } from '../types';
import { rotateShape, cloneShape, makeRandomColor } from './shapeTransforms';

/**
 * Shape generation functions - Templates and random generation
 */

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
