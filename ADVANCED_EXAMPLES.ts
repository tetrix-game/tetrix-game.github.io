/**
 * Advanced Shape Usage Examples
 * 
 * This file contains examples of more advanced patterns you can use
 * with the shape-centric API.
 */

import type { Shape, Location } from './src/utils/types';
import {
  getShapeCenter,
  getShapeBounds,
  getShapeGridPositions,
  canPlaceShape,
  rotateShape,
  cloneShape,
  getFilledBlocks,
} from './src/utils/shapeUtils';

// ============================================================================
// EXAMPLE 1: Shape Rotation System
// ============================================================================

class RotatableShape {
  private shape: Shape;
  private rotationState: number = 0; // 0, 1, 2, 3 for 0°, 90°, 180°, 270°

  constructor(shape: Shape) {
    this.shape = cloneShape(shape);
  }

  rotate(): void {
    this.shape = rotateShape(this.shape);
    this.rotationState = (this.rotationState + 1) % 4;
  }

  getShape(): Shape {
    return this.shape;
  }

  getRotationState(): number {
    return this.rotationState;
  }

  resetRotation(): void {
    while (this.rotationState !== 0) {
      this.rotate();
    }
  }
}

// Usage:
// const rotatable = new RotatableShape(lShape);
// rotatable.rotate(); // 90°
// rotatable.rotate(); // 180°
// const currentShape = rotatable.getShape();

// ============================================================================
// EXAMPLE 2: Shape Validation with Preview
// ============================================================================

interface PlacementValidation {
  canPlace: boolean;
  reason?: string;
  positions?: Array<{ location: Location; valid: boolean }>;
}

function validateShapePlacement(
  shape: Shape,
  location: Location,
  gridSize: { rows: number; columns: number },
  occupiedPositions: Set<string>
): PlacementValidation {
  const positions = getShapeGridPositions(shape, location);

  // Check each position
  const positionValidation = positions.map(({ location: pos }) => {
    const inBounds =
      pos.row >= 1 &&
      pos.row <= gridSize.rows &&
      pos.column >= 1 &&
      pos.column <= gridSize.columns;

    const notOccupied = !occupiedPositions.has(`${pos.row},${pos.column}`);

    return {
      location: pos,
      valid: inBounds && notOccupied,
    };
  });

  const allValid = positionValidation.every((p) => p.valid);

  if (!allValid) {
    const firstInvalid = positionValidation.find((p) => !p.valid);
    const outOfBounds = firstInvalid && (
      firstInvalid.location.row < 1 ||
      firstInvalid.location.row > gridSize.rows ||
      firstInvalid.location.column < 1 ||
      firstInvalid.location.column > gridSize.columns
    );

    return {
      canPlace: false,
      reason: outOfBounds ? 'Shape extends outside grid' : 'Position already occupied',
      positions: positionValidation,
    };
  }

  return {
    canPlace: true,
    positions: positionValidation,
  };
}

// Usage:
// const validation = validateShapePlacement(
//   myShape,
//   { row: 5, column: 5 },
//   { rows: 10, columns: 10 },
//   occupiedSet
// );
// if (!validation.canPlace) {
//   console.log(`Cannot place: ${validation.reason}`);
// }

// ============================================================================
// EXAMPLE 3: Shape Scoring System
// ============================================================================

function calculateShapeScore(shape: Shape): number {
  const bounds = getShapeBounds(shape);
  const blockCount = getFilledBlocks(shape).length;

  // Base score = number of blocks
  let score = blockCount * 10;

  // Bonus for compact shapes (more blocks in smaller area)
  const area = bounds.width * bounds.height;
  const density = blockCount / area;
  score += Math.floor(density * 50);

  // Bonus for larger shapes
  if (blockCount >= 4) {
    score += 20;
  }
  if (blockCount >= 6) {
    score += 50;
  }

  return score;
}

// Usage:
// const score = calculateShapeScore(myShape);
// console.log(`This shape is worth ${score} points!`);

// ============================================================================
// EXAMPLE 4: Auto-Placement Algorithm
// ============================================================================

function findBestPlacement(
  shape: Shape,
  gridSize: { rows: number; columns: number },
  occupiedPositions: Set<string>
): Location | null {
  const positions: Array<{ location: Location; score: number }> = [];

  // Try every position on the grid
  for (let row = 1; row <= gridSize.rows; row++) {
    for (let col = 1; col <= gridSize.columns; col++) {
      const location = { row, column: col };

      if (canPlaceShape(shape, location, gridSize, occupiedPositions)) {
        // Calculate desirability score (prefer lower-left positions)
        const score = (gridSize.rows - row) + (col * 0.1);
        positions.push({ location, score });
      }
    }
  }

  if (positions.length === 0) {
    return null; // No valid placement found
  }

  // Return the position with the lowest score (most desirable)
  positions.sort((a, b) => a.score - b.score);
  return positions[0].location;
}

// Usage:
// const bestSpot = findBestPlacement(
//   myShape,
//   { rows: 10, columns: 10 },
//   occupiedSet
// );
// if (bestSpot) {
//   console.log(`Best placement at row ${bestSpot.row}, col ${bestSpot.column}`);
// } else {
//   console.log("No valid placement available");
// }

// ============================================================================
// EXAMPLE 5: Shape Pattern Matcher
// ============================================================================

function shapesMatch(shape1: Shape, shape2: Shape): boolean {
  if (shape1.length !== shape2.length) return false;

  for (let row = 0; row < shape1.length; row++) {
    if (shape1[row].length !== shape2[row].length) return false;

    for (let col = 0; col < shape1[row].length; col++) {
      if (shape1[row][col].isFilled !== shape2[row][col].isFilled) {
        return false;
      }
    }
  }

  return true;
}

function findMatchingShapes(targetShape: Shape, shapeLibrary: Shape[]): Shape[] {
  return shapeLibrary.filter(shape => shapesMatch(shape, targetShape));
}

// Usage:
// const matches = findMatchingShapes(myShape, [lShape, tShape, squareShape]);
// console.log(`Found ${matches.length} matching shapes`);

// ============================================================================
// EXAMPLE 6: Shape Generator
// ============================================================================

function generateRandomShape(
  color: Shape[0][0]['color'],
  minBlocks: number = 3,
  maxBlocks: number = 5
): Shape {
  const targetBlocks = Math.floor(Math.random() * (maxBlocks - minBlocks + 1)) + minBlocks;
  const shape: Shape = new Array(3).fill(null).map(() =>
    new Array(3).fill(null).map(() => ({
      color,
      isFilled: false,
    }))
  );

  // Start with center block
  shape[1][1].isFilled = true;
  let blockCount = 1;

  // Add adjacent blocks randomly
  while (blockCount < targetBlocks) {
    const filledPositions: Array<[number, number]> = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (shape[row][col].isFilled) {
          filledPositions.push([row, col]);
        }
      }
    }

    // Pick a random filled position
    const [row, col] = filledPositions[Math.floor(Math.random() * filledPositions.length)];

    // Try to add an adjacent block
    const adjacent: Array<[number, number]> = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    const validAdjacent = adjacent.filter(
      ([r, c]) => r >= 0 && r < 3 && c >= 0 && c < 3 && !shape[r][c].isFilled
    );

    if (validAdjacent.length === 0) break;

    const [newRow, newCol] = validAdjacent[Math.floor(Math.random() * validAdjacent.length)];
    shape[newRow][newCol].isFilled = true;
    blockCount++;
  }

  return shape;
}

// Usage:
// const randomShape = generateRandomShape(makeColor(), 3, 6);
// console.log(`Generated shape with ${getFilledBlocks(randomShape).length} blocks`);

// ============================================================================
// EXAMPLE 7: Shape Analysis
// ============================================================================

interface ShapeAnalysis {
  blockCount: number;
  width: number;
  height: number;
  area: number;
  density: number;
  isSquare: boolean;
  isLine: boolean;
  centerPoint: { row: number; col: number };
}

function analyzeShape(shape: Shape): ShapeAnalysis {
  const bounds = getShapeBounds(shape);
  const blocks = getFilledBlocks(shape);
  const center = getShapeCenter(shape);
  const area = bounds.width * bounds.height;

  return {
    blockCount: blocks.length,
    width: bounds.width,
    height: bounds.height,
    area,
    density: blocks.length / area,
    isSquare: bounds.width === bounds.height,
    isLine: bounds.width === 1 || bounds.height === 1,
    centerPoint: center,
  };
}

// Usage:
// const analysis = analyzeShape(myShape);
// console.log(`Shape has ${analysis.blockCount} blocks`);
// console.log(`Density: ${(analysis.density * 100).toFixed(1)}%`);
// if (analysis.isLine) console.log("This is a line shape!");

// ============================================================================
// EXAMPLE 8: Shape Collision Detection
// ============================================================================

function checkShapeCollision(
  shape1: Shape,
  location1: Location,
  shape2: Shape,
  location2: Location
): boolean {
  const positions1 = new Set(
    getShapeGridPositions(shape1, location1).map(
      (p) => `${p.location.row},${p.location.column}`
    )
  );

  const positions2 = getShapeGridPositions(shape2, location2);

  for (const { location } of positions2) {
    if (positions1.has(`${location.row},${location.column}`)) {
      return true; // Collision detected
    }
  }

  return false; // No collision
}

// Usage:
// const collision = checkShapeCollision(
//   shape1, { row: 5, column: 5 },
//   shape2, { row: 6, column: 5 }
// );
// if (collision) console.log("Shapes overlap!");

// ============================================================================
// EXAMPLE 9: Shape Queue System
// ============================================================================

class ShapeQueue {
  private queue: Shape[] = [];
  private maxSize: number;

  constructor(maxSize: number = 3) {
    this.maxSize = maxSize;
  }

  add(shape: Shape): void {
    this.queue.push(cloneShape(shape));
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  getNext(): Shape | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  removeNext(): Shape | null {
    return this.queue.shift() || null;
  }

  peek(index: number): Shape | null {
    return this.queue[index] || null;
  }

  getAll(): Shape[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }

  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }
}

// Usage:
// const queue = new ShapeQueue(3);
// queue.add(lShape);
// queue.add(tShape);
// queue.add(squareShape);
// const nextShape = queue.getNext();
// const allShapes = queue.getAll(); // [lShape, tShape, squareShape]

export {
  RotatableShape,
  validateShapePlacement,
  calculateShapeScore,
  findBestPlacement,
  shapesMatch,
  findMatchingShapes,
  generateRandomShape,
  analyzeShape,
  checkShapeCollision,
  ShapeQueue,
};
