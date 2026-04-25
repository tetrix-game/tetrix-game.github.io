/**
 * Byte Packing Utilities for Tetrix Game
 *
 * Provides compact byte representations for tiles and shapes to optimize
 * network bandwidth and storage.
 *
 * Tile Format: 100-byte Uint8Array (one byte per tile)
 * - Index 0-99 represents position (0 = R0C0, 99 = R9C9)
 * - Byte value 0-7 = color index
 * - Byte value 255 = empty tile
 *
 * Shape Format: 3 bytes total
 * - 2 bytes (Uint16): 16-bit mask where bit 1 = filled, 0 = empty
 * - 1 byte: color index (0-7)
 */

import type { Tile, Shape, ColorName, Location } from '../types';

// ============================================================================
// COLOR ENCODING
// ============================================================================

export const COLOR_INDEX_MAP: Record<ColorName, number> = {
  'white': 0,
  'grey': 1,
  'red': 2,
  'orange': 3,
  'yellow': 4,
  'green': 5,
  'blue': 6,
  'purple': 7,
};

export const INDEX_COLOR_MAP: ColorName[] = [
  'white', // 0
  'grey', // 1
  'red', // 2
  'orange', // 3
  'yellow', // 4
  'green', // 5
  'blue', // 6
  'purple', // 7
];

export const EMPTY_TILE = 255; // 0xFF - marker for unfilled tiles

// ============================================================================
// POSITION CONVERSION
// ============================================================================

/**
 * Convert position string to array index
 * @param position - Position string in format "R{row}C{col}" (0-indexed)
 * @returns Index from 0-99 (0 = R0C0, 99 = R9C9)
 * @example positionToIndex("R0C0") => 0
 * @example positionToIndex("R4C2") => 42
 * @example positionToIndex("R9C9") => 99
 */
export function positionToIndex(position: string): number {
  const match = position.match(/R(\d+)C(\d+)/);
  if (!match) {
    throw new Error(`Invalid position format: ${position}`);
  }

  const row = parseInt(match[1], 10); // 0-9
  const col = parseInt(match[2], 10); // 0-9

  if (row < 0 || row >= 10 || col < 0 || col >= 10) {
    throw new Error(`Position out of bounds: ${position}`);
  }

  return row * 10 + col; // 0-99
}

/**
 * Convert array index to position string
 * @param index - Index from 0-99
 * @returns Position string in format "R{row}C{col}" (0-indexed)
 * @example indexToPosition(0) => "R0C0"
 * @example indexToPosition(42) => "R4C2"
 * @example indexToPosition(99) => "R9C9"
 */
export function indexToPosition(index: number): string {
  if (index < 0 || index > 99) {
    throw new Error(`Index out of bounds: ${index}`);
  }

  const row = Math.floor(index / 10); // 0-9
  const col = index % 10; // 0-9

  return `R${row}C${col}`;
}

/**
 * Convert Location object to array index
 * @param location - Location with row and column (0-indexed)
 * @returns Index from 0-99
 */
export function locationToIndex(location: Location): number {
  return location.row * 10 + location.column;
}

/**
 * Convert array index to Location object
 * @param index - Index from 0-99
 * @returns Location with row and column (0-indexed)
 */
export function indexToLocation(index: number): Location {
  if (index < 0 || index > 99) {
    throw new Error(`Index out of bounds: ${index}`);
  }

  return {
    row: Math.floor(index / 10),
    column: index % 10,
  };
}

// ============================================================================
// TILE PACKING/UNPACKING
// ============================================================================

/**
 * Pack tiles from Map to compact Uint8Array format
 * @param tiles - Map of position strings to Tile objects
 * @returns Uint8Array of 100 bytes (one per grid position)
 */
export function packTiles(tiles: Map<string, Tile>): Uint8Array {
  const packed = new Uint8Array(100);
  packed.fill(EMPTY_TILE); // Default all to empty

  for (const [position, tile] of tiles.entries()) {
    try {
      const index = positionToIndex(position);

      if (tile.block.isFilled) {
        const colorIndex = COLOR_INDEX_MAP[tile.block.color];
        if (colorIndex === undefined) {
          console.warn(`Unknown color: ${tile.block.color}, defaulting to grey`);
          packed[index] = COLOR_INDEX_MAP['grey'];
        } else {
          packed[index] = colorIndex;
        }
      } else {
        packed[index] = EMPTY_TILE;
      }
    } catch (error) {
      console.error(`Error packing tile at ${position}:`, error);
    }
  }

  return packed;
}

/**
 * Unpack tiles from compact Uint8Array to Map format
 * @param packed - Uint8Array of 100 bytes
 * @returns Map of position strings to Tile objects
 */
export function unpackTiles(packed: Uint8Array): Map<string, Tile> {
  if (packed.length !== 100) {
    throw new Error(`Invalid packed tile array length: ${packed.length}, expected 100`);
  }

  const tiles = new Map<string, Tile>();

  for (let index = 0; index < 100; index++) {
    const colorIndex = packed[index];
    const position = indexToPosition(index);

    const isFilled = colorIndex !== EMPTY_TILE;
    const color = isFilled && colorIndex >= 0 && colorIndex <= 7
      ? INDEX_COLOR_MAP[colorIndex]
      : 'grey';

    tiles.set(position, {
      position,
      backgroundColor: 'grey', // Always default
      block: {
        isFilled,
        color,
      },
      activeAnimations: [], // Frontend-only, populated separately
    });
  }

  return tiles;
}

// ============================================================================
// SHAPE PACKING/UNPACKING
// ============================================================================

/**
 * Pack shape from 2D Block array to compact format
 * @param shape - 2D array of Blocks (typically 4x4)
 * @returns Object with blocks (Uint16Array) and color index
 */
export function packShape(shape: Shape): { blocks: Uint16Array; color: number } {
  let blockMask = 0;
  let shapeColor = COLOR_INDEX_MAP['white']; // Default to white

  // Support variable shape sizes (4x4 or 5x5)
  const rows = shape.length;
  const maxBlocks = 16; // Current implementation supports up to 16 blocks

  // Iterate through grid, building bit mask (row-major order)
  for (let row = 0; row < rows && row < 4; row++) {
    const cols = shape[row].length;
    for (let col = 0; col < cols && col < 4; col++) {
      const block = shape[row][col];
      const bitIndex = row * 4 + col; // 0-15

      if (bitIndex >= maxBlocks) {
        console.warn(`Shape too large, truncating at ${maxBlocks} blocks`);
        break;
      }

      if (block.isFilled) {
        blockMask |= (1 << bitIndex); // Set bit

        // Use the color of the first filled block
        const colorIndex = COLOR_INDEX_MAP[block.color];
        if (colorIndex !== undefined) {
          shapeColor = colorIndex;
        }
      }
    }
  }

  // Use DataView for explicit little-endian encoding
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, blockMask, true); // true = little-endian

  return {
    blocks: new Uint16Array(buffer),
    color: shapeColor,
  };
}

/**
 * Unpack shape from compact format to 2D Block array
 * @param compact - Object with blocks (Uint16Array) and color index
 * @returns 2D array of Blocks (4x4)
 */
export function unpackShape(compact: { blocks: Uint16Array; color: number }): Shape {
  // Use DataView for explicit little-endian decoding
  const buffer = compact.blocks.buffer;
  const view = new DataView(buffer);
  const blockMask = view.getUint16(0, true); // true = little-endian

  const colorIndex = compact.color;
  const color = colorIndex >= 0 && colorIndex <= 7
    ? INDEX_COLOR_MAP[colorIndex]
    : 'white';

  const shape: Shape = [];

  // Create 4x4 grid
  for (let row = 0; row < 4; row++) {
    shape[row] = [];
    for (let col = 0; col < 4; col++) {
      const bitIndex = row * 4 + col;
      const isFilled = (blockMask & (1 << bitIndex)) !== 0;

      shape[row][col] = {
        color: isFilled ? color : 'grey',
        isFilled,
      };
    }
  }

  return shape;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an object is a compact shape
 */
export function isCompactShape(obj: unknown): obj is { blocks: Uint16Array; color: number } {
  return !!obj
    && typeof obj === 'object'
    && 'blocks' in obj
    && obj.blocks instanceof Uint16Array
    && 'color' in obj
    && typeof obj.color === 'number';
}

/**
 * Check if an array is a compact tiles array
 */
export function isCompactTiles(obj: unknown): obj is Uint8Array {
  return obj instanceof Uint8Array && obj.length === 100;
}

/**
 * Convert color name to index
 */
export function colorToIndex(color: ColorName): number {
  const index = COLOR_INDEX_MAP[color];
  if (index === undefined) {
    throw new Error(`Unknown color: ${color}`);
  }
  return index;
}

/**
 * Convert color index to name
 */
export function indexToColor(index: number): ColorName {
  if (index < 0 || index >= INDEX_COLOR_MAP.length) {
    throw new Error(`Color index out of range: ${index}`);
  }
  return INDEX_COLOR_MAP[index];
}
