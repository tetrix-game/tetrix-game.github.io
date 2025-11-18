/**
 * Clearing Animation Utilities
 * 
 * Manages tile-based clearing animations with configurable timing and wave effects.
 * Animations are instanced per tile and persist independently of block state.
 * 
 * Animation Types:
 * - row-cw: Clockwise rotation for single row clears
 * - row-double: Dynamic grow/rotate effect for double row clears
 * - row-triple: Octagon with full 360° rotation for triple row clears
 * - column-ccw: Counterclockwise base rotation for single column clears
 * - column-double: Dynamic grow/rotate effect for double column clears
 * - column-triple: Octagon with full 360° rotation for triple column clears
 */

import type { TileAnimation, TilesSet } from '../types/core';

export type AnimationConfig = {
  // Duration for each animation type (ms)
  rowSingleDuration: number;
  rowDoubleDuration: number;
  rowTripleDuration: number;
  columnSingleDuration: number;
  columnDoubleDuration: number;
  columnTripleDuration: number;

  // Wave delays for each animation type (ms)
  rowSingleWaveDelay: number;
  rowDoubleWaveDelay: number;
  rowTripleWaveDelay: number;
  columnSingleWaveDelay: number;
  columnDoubleWaveDelay: number;
  columnTripleWaveDelay: number;

  baseStartTime?: number; // Base timestamp (defaults to performance.now())
};

const DEFAULT_CONFIG: AnimationConfig = {
  rowSingleDuration: 500,
  rowDoubleDuration: 500,
  rowTripleDuration: 600,
  columnSingleDuration: 500,
  columnDoubleDuration: 500,
  columnTripleDuration: 600,

  rowSingleWaveDelay: 30,
  rowDoubleWaveDelay: 30,
  rowTripleWaveDelay: 40,
  columnSingleWaveDelay: 30,
  columnDoubleWaveDelay: 30,
  columnTripleWaveDelay: 40,
};

/**
 * Generates a unique animation ID
 */
let animationIdCounter = 0;
function generateAnimationId(): string {
  return `anim-${Date.now()}-${animationIdCounter++}`;
}

/**
 * Calculates wave offset based on tile position
 * @param index - Tile index in the line (0-9)
 * @param waveDelay - Delay per tile
 */
function calculateWaveOffset(index: number, waveDelay: number): number {
  return index * waveDelay;
}

/**
 * Generates clearing animations and applies them directly to tiles.
 * Animations persist on tiles independently of block state changes.
 * 
 * @param tiles - The tiles map to update with animations
 * @param clearedRows - Array of row numbers being cleared (1-10)
 * @param clearedColumns - Array of column numbers being cleared (1-10)
 * @param config - Animation timing configuration
 * @returns Updated tiles map with animations added
 */
export function generateClearingAnimations(
  tiles: TilesSet,
  clearedRows: number[],
  clearedColumns: number[],
  config: Partial<AnimationConfig> = {}
): TilesSet {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const baseStartTime = finalConfig.baseStartTime ?? performance.now();
  const newTiles = new Map(tiles);

  // Helper to create tile key
  const makeTileKey = (row: number, column: number) => `R${row}C${column}`;

  // Determine animation types based on count
  const rowCount = clearedRows.length;
  const columnCount = clearedColumns.length;

  // Process cleared rows
  for (const row of clearedRows) {
    for (let column = 1; column <= 10; column++) {
      const key = makeTileKey(row, column);
      const tileData = newTiles.get(key);
      if (!tileData) continue;

      const animations: TileAnimation[] = [];

      // Single row animation (always present)
      const singleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rowSingleWaveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'row-cw',
        startTime: baseStartTime + singleWaveOffset,
        duration: finalConfig.rowSingleDuration,
      });

      // Double row animation (2+ rows)
      if (rowCount >= 2) {
        const doubleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rowDoubleWaveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'row-double',
          startTime: baseStartTime + doubleWaveOffset,
          duration: finalConfig.rowDoubleDuration,
        });
      }

      // Triple row animation (3+ rows)
      if (rowCount >= 3) {
        const tripleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rowTripleWaveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'row-triple',
          startTime: baseStartTime + tripleWaveOffset,
          duration: finalConfig.rowTripleDuration,
        });
      }

      newTiles.set(key, {
        ...tileData,
        activeAnimations: [...(tileData.activeAnimations || []), ...animations],
      });
    }
  }

  // Process cleared columns
  for (const column of clearedColumns) {
    for (let row = 1; row <= 10; row++) {
      const key = makeTileKey(row, column);
      const tileData = newTiles.get(key);
      if (!tileData) continue;

      const animations: TileAnimation[] = [];

      // Single column animation (always present)
      const singleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columnSingleWaveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'column-ccw',
        startTime: baseStartTime + singleWaveOffset,
        duration: finalConfig.columnSingleDuration,
      });

      // Double column animation (always present, for backward compatibility)
      const doubleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columnDoubleWaveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'column-double',
        startTime: baseStartTime + doubleWaveOffset,
        duration: finalConfig.columnDoubleDuration,
      });

      // Triple column animation (2+ columns)
      if (columnCount >= 2) {
        const tripleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columnTripleWaveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'column-triple',
          startTime: baseStartTime + tripleWaveOffset,
          duration: finalConfig.columnTripleDuration,
        });
      }

      newTiles.set(key, {
        ...tileData,
        activeAnimations: [...(tileData.activeAnimations || []), ...animations],
      });
    }
  }

  return newTiles;
}

/**
 * Cleans up expired animations from all tiles.
 * Should be called periodically to prevent memory buildup.
 * 
 * @param tiles - The tiles map to clean
 * @param currentTime - Current timestamp (defaults to performance.now())
 * @returns Updated tiles map with expired animations removed
 */
export function cleanupExpiredAnimations(
  tiles: TilesSet,
  currentTime: number = performance.now()
): TilesSet {
  const newTiles = new Map(tiles);
  let hasChanges = false;

  for (const [key, tileData] of newTiles.entries()) {
    if (!tileData.activeAnimations || tileData.activeAnimations.length === 0) continue;

    const activeAnimations = tileData.activeAnimations.filter(
      anim => currentTime < anim.startTime + anim.duration
    );

    if (activeAnimations.length !== tileData.activeAnimations.length) {
      hasChanges = true;
      newTiles.set(key, {
        ...tileData,
        activeAnimations: activeAnimations.length > 0 ? activeAnimations : undefined,
      });
    }
  }

  return hasChanges ? newTiles : tiles;
}