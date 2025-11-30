import {
  generateIPiece, generateOPiece, generateTPiece, generateSPiece, generateZPiece, generateJPiece, generateLPiece,
  generate3x3Piece, generate3x2Piece, generate5x1Piece, generate3x1Piece, generate2x1Piece, generate1x1Piece, generateEvenLPiece,
  rotateShape, getFilledBlocks
} from './shapes';
import type { Shape, TilesSet, ColorName } from '../types';

// Simple seeded RNG (Linear Congruential Generator)
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a number between 0 and 1
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Fisher-Yates shuffle
  shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

type SolverShape = {
  shape: Shape;
  name: string;
};

// All available shape generators
const SHAPE_GENERATORS = [
  { gen: generateIPiece, name: 'I' },
  { gen: generateOPiece, name: 'O' },
  { gen: generateTPiece, name: 'T' },
  { gen: generateSPiece, name: 'S' },
  { gen: generateZPiece, name: 'Z' },
  { gen: generateJPiece, name: 'J' },
  { gen: generateLPiece, name: 'L' },
  { gen: generate3x3Piece, name: '3x3' },
  { gen: generate3x2Piece, name: '3x2' },
  { gen: generate5x1Piece, name: '5x1' },
  { gen: generate3x1Piece, name: '3x1' },
  { gen: generate2x1Piece, name: '2x1' },
  { gen: generate1x1Piece, name: '1x1' },
  { gen: generateEvenLPiece, name: 'EvenL' },
];

// Pre-compute all unique rotations for each shape type
// We use a dummy color 'blue' for generation, but will overwrite colors during solving
const ALL_SHAPE_VARIANTS: SolverShape[] = [];

SHAPE_GENERATORS.forEach(({ gen, name }) => {
  const baseShape = gen('blue');
  const variants: Shape[] = [baseShape];

  // Generate rotations
  let current = baseShape;
  for (let i = 0; i < 3; i++) {
    current = rotateShape(current);
    // Check if this rotation is unique
    const isUnique = !variants.some(v => areShapesEqual(v, current));
    if (isUnique) {
      variants.push(current);
    }
  }

  variants.forEach(v => {
    ALL_SHAPE_VARIANTS.push({ shape: v, name });
  });
});

function areShapesEqual(s1: Shape, s2: Shape): boolean {
  if (s1.length !== s2.length || s1[0].length !== s2[0].length) return false;
  for (let r = 0; r < s1.length; r++) {
    for (let c = 0; c < s1[r].length; c++) {
      if (s1[r][c].isFilled !== s2[r][c].isFilled) return false;
    }
  }
  return true;
}

export type SolvedShape = {
  shape: Shape;
  gridPosition: { row: number; col: number }; // Top-left of the shape grid
};

export function solveDailyChallenge(tiles: TilesSet, seed: number): SolvedShape[] | null {
  const rng = new SeededRNG(seed);

  // Convert TilesSet to a boolean grid for easier processing
  // 1-indexed to 0-indexed for internal solver logic
  const gridHeight = 20; // Max height
  const gridWidth = 20; // Max width
  const grid: (ColorName | null)[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));

  let minRow = gridHeight, maxRow = 0, minCol = gridWidth, maxCol = 0;
  let tileCount = 0;

  tiles.forEach((tile, key) => {
    if (tile.block.isFilled) {
      // Parse key "row,col"
      const [rStr, cStr] = key.split(',');
      const r = parseInt(rStr) - 1; // 0-indexed
      const c = parseInt(cStr) - 1; // 0-indexed

      if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
        grid[r][c] = tile.block.color;
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
        tileCount++;
      }
    }
  });

  if (tileCount === 0) return [];

  // Recursive solver
  function solve(currentGrid: (ColorName | null)[][], usedShapes: SolvedShape[]): SolvedShape[] | null {
    // Find first empty (but filled in original) cell
    let targetR = -1, targetC = -1;

    // Scan within bounds
    outer: for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (currentGrid[r][c] !== null) {
          targetR = r;
          targetC = c;
          break outer;
        }
      }
    }

    // If no target found, we are done!
    if (targetR === -1) {
      return usedShapes;
    }

    // Find all shapes that can cover targetR, targetC
    // The shape must cover (targetR, targetC) with its *first* filled block (in reading order)
    // to ensure unique placement order.

    const candidates: { shape: Shape, gridPos: { row: number, col: number } }[] = [];

    for (const variant of ALL_SHAPE_VARIANTS) {
      const shape = variant.shape;
      const filledBlocks = getFilledBlocks(shape);
      if (filledBlocks.length === 0) continue;

      // The first filled block of the shape MUST align with (targetR, targetC)
      const firstBlock = filledBlocks[0];

      // Calculate where the top-left of the shape would be
      const shapeGridRow = targetR - firstBlock.row;
      const shapeGridCol = targetC - firstBlock.col;

      // Check if this placement is valid
      let isValid = true;
      const coloredShape: Shape = shape.map(row => row.map(b => ({ ...b }))); // Deep copy to apply colors

      for (const fb of filledBlocks) {
        const gridR = shapeGridRow + fb.row;
        const gridC = shapeGridCol + fb.col;

        // Check bounds
        if (gridR < 0 || gridR >= gridHeight || gridC < 0 || gridC >= gridWidth) {
          isValid = false;
          break;
        }

        // Check if grid has a tile here
        if (currentGrid[gridR][gridC] === null) {
          isValid = false;
          break;
        }

        // Apply color from grid to shape
        coloredShape[fb.row][fb.col].color = currentGrid[gridR][gridC]!;
      }

      if (isValid) {
        candidates.push({
          shape: coloredShape,
          gridPos: { row: shapeGridRow + 1, col: shapeGridCol + 1 } // Convert back to 1-indexed for result
        });
      }
    }

    // Shuffle candidates
    const shuffledCandidates = rng.shuffle(candidates);

    // Try each candidate
    for (const candidate of shuffledCandidates) {
      // Create new grid state
      const nextGrid = currentGrid.map(row => [...row]);
      const filledBlocks = getFilledBlocks(candidate.shape);

      // Remove covered tiles from grid
      // gridPos is 1-indexed, so subtract 1
      const startR = candidate.gridPos.row - 1;
      const startC = candidate.gridPos.col - 1;

      for (const fb of filledBlocks) {
        nextGrid[startR + fb.row][startC + fb.col] = null;
      }

      const result = solve(nextGrid, [...usedShapes, { shape: candidate.shape, gridPosition: candidate.gridPos }]);
      if (result) return result;
    }

    // Backtrack
    return null;
  }

  // Start solving
  // We might need a timeout or retry mechanism if it takes too long, 
  // but for now let's trust the "fallback shapes" (1x1) will ensure a solution is found quickly.
  // With 1x1 available, a solution is ALWAYS guaranteed (worst case: all 1x1s).

  return solve(grid, []);
}
