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

export type AnimationTierConfig = {
  duration: number;    // Animation duration in ms
  waveDelay: number;   // Delay between each tile in ms
  startDelay: number;  // Delay before the first animation starts in ms
};

export type AnimationConfig = {
  rows: {
    single: AnimationTierConfig;
    double: AnimationTierConfig;
    triple: AnimationTierConfig;
  };
  columns: {
    single: AnimationTierConfig;
    double: AnimationTierConfig;
    triple: AnimationTierConfig;
  };
  baseStartTime?: number; // Base timestamp (defaults to performance.now())
};

const DEFAULT_CONFIG: AnimationConfig = {
  rows: {
    single: { duration: 500, waveDelay: 30, startDelay: 0 },
    double: { duration: 500, waveDelay: 30, startDelay: 0 },
    triple: { duration: 600, waveDelay: 40, startDelay: 0 },
  },
  columns: {
    single: { duration: 500, waveDelay: 30, startDelay: 0 },
    double: { duration: 500, waveDelay: 30, startDelay: 0 },
    triple: { duration: 600, waveDelay: 40, startDelay: 0 },
  },
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
  // Deep merge config with defaults
  const finalConfig: AnimationConfig = {
    rows: {
      single: { ...DEFAULT_CONFIG.rows.single, ...config.rows?.single },
      double: { ...DEFAULT_CONFIG.rows.double, ...config.rows?.double },
      triple: { ...DEFAULT_CONFIG.rows.triple, ...config.rows?.triple },
    },
    columns: {
      single: { ...DEFAULT_CONFIG.columns.single, ...config.columns?.single },
      double: { ...DEFAULT_CONFIG.columns.double, ...config.columns?.double },
      triple: { ...DEFAULT_CONFIG.columns.triple, ...config.columns?.triple },
    },
    baseStartTime: config.baseStartTime,
  };
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
      const singleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rows.single.waveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'row-cw',
        startTime: baseStartTime + finalConfig.rows.single.startDelay + singleWaveOffset,
        duration: finalConfig.rows.single.duration,
      });

      // Double row animation (2+ rows)
      if (rowCount >= 2) {
        const doubleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rows.double.waveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'row-double',
          startTime: baseStartTime + finalConfig.rows.double.startDelay + doubleWaveOffset,
          duration: finalConfig.rows.double.duration,
        });
      }

      // Triple row animation (3+ rows)
      if (rowCount >= 3) {
        const tripleWaveOffset = calculateWaveOffset(column - 1, finalConfig.rows.triple.waveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'row-triple',
          startTime: baseStartTime + finalConfig.rows.triple.startDelay + tripleWaveOffset,
          duration: finalConfig.rows.triple.duration,
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
      const singleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columns.single.waveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'column-ccw',
        startTime: baseStartTime + finalConfig.columns.single.startDelay + singleWaveOffset,
        duration: finalConfig.columns.single.duration,
      });

      // Double column animation (always present, for backward compatibility)
      const doubleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columns.double.waveDelay);
      animations.push({
        id: generateAnimationId(),
        type: 'column-double',
        startTime: baseStartTime + finalConfig.columns.double.startDelay + doubleWaveOffset,
        duration: finalConfig.columns.double.duration,
      });

      // Triple column animation (2+ columns)
      if (columnCount >= 2) {
        const tripleWaveOffset = calculateWaveOffset(row - 1, finalConfig.columns.triple.waveDelay);
        animations.push({
          id: generateAnimationId(),
          type: 'column-triple',
          startTime: baseStartTime + finalConfig.columns.triple.startDelay + tripleWaveOffset,
          duration: finalConfig.columns.triple.duration,
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