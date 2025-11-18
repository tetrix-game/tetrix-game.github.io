/**
 * Clearing Animation Utilities
 * 
 * Manages tile-based clearing animations with configurable timing and wave effects.
 * Animations are instanced per tile and persist independently of block state.
 * 
 * Animation Types:
 * - row-cw: Clockwise rotation for row clears
 * - column-ccw: Counterclockwise base rotation for column clears
 * - column-double: Dynamic grow/rotate effect for column clears
 */

import type { TileAnimation, TilesSet } from '../types/core';

export type AnimationConfig = {
  rowDuration: number; // Duration for row animations (ms)
  columnDuration: number; // Duration for column animations (ms)
  rowWaveDelay: number; // Delay between each tile in a row (ms)
  columnWaveDelay: number; // Delay between each tile in a column (ms)
  baseStartTime?: number; // Base timestamp (defaults to performance.now())
};

const DEFAULT_CONFIG: AnimationConfig = {
  rowDuration: 500,
  columnDuration: 500,
  rowWaveDelay: 0,
  columnWaveDelay: 0,
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

  // Process cleared rows
  for (const row of clearedRows) {
    for (let column = 1; column <= 10; column++) {
      const key = makeTileKey(row, column);
      const tileData = newTiles.get(key);
      if (!tileData) continue;

      // Calculate wave delay based on column index (0-9)
      const waveOffset = calculateWaveOffset(column - 1, finalConfig.rowWaveDelay);
      const startTime = baseStartTime + waveOffset;

      const animation: TileAnimation = {
        id: generateAnimationId(),
        type: 'row-cw',
        startTime,
        duration: finalConfig.rowDuration,
      };

      newTiles.set(key, {
        ...tileData,
        activeAnimations: [...(tileData.activeAnimations || []), animation],
      });
    }
  }

  // Process cleared columns
  for (const column of clearedColumns) {
    for (let row = 1; row <= 10; row++) {
      const key = makeTileKey(row, column);
      const tileData = newTiles.get(key);
      if (!tileData) continue;

      // Calculate wave delay based on row index (0-9)
      const waveOffset = calculateWaveOffset(row - 1, finalConfig.columnWaveDelay);
      const startTime = baseStartTime + waveOffset;

      // Columns get two animations: base CCW and double-rotation overlay
      const animations: TileAnimation[] = [
        {
          id: generateAnimationId(),
          type: 'column-ccw',
          startTime,
          duration: finalConfig.columnDuration,
        },
        {
          id: generateAnimationId(),
          type: 'column-double',
          startTime,
          duration: finalConfig.columnDuration,
        },
      ];

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