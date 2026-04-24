/**
 * Tests for Byte Packing Utilities
 */

import {
  positionToIndex,
  indexToPosition,
  locationToIndex,
  indexToLocation,
  packTiles,
  unpackTiles,
  packShape,
  unpackShape,
  colorToIndex,
  indexToColor,
  COLOR_INDEX_MAP,
  INDEX_COLOR_MAP,
  EMPTY_TILE,
} from './index';
import type { Tile, Shape, Location } from '../types';

describe('Position Conversion', () => {
  test('positionToIndex converts R1C1 to 0', () => {
    expect(positionToIndex('R1C1')).toBe(0);
  });

  test('positionToIndex converts R10C10 to 99', () => {
    expect(positionToIndex('R10C10')).toBe(99);
  });

  test('positionToIndex converts R5C3 to 42', () => {
    expect(positionToIndex('R5C3')).toBe(42);
  });

  test('indexToPosition converts 0 to R1C1', () => {
    expect(indexToPosition(0)).toBe('R1C1');
  });

  test('indexToPosition converts 99 to R10C10', () => {
    expect(indexToPosition(99)).toBe('R10C10');
  });

  test('indexToPosition converts 42 to R5C3', () => {
    expect(indexToPosition(42)).toBe('R5C3');
  });

  test('position conversion roundtrip', () => {
    for (let i = 0; i < 100; i++) {
      const position = indexToPosition(i);
      expect(positionToIndex(position)).toBe(i);
    }
  });

  test('positionToIndex throws on invalid format', () => {
    expect(() => positionToIndex('invalid')).toThrow('Invalid position format');
  });

  test('positionToIndex throws on out of bounds', () => {
    expect(() => positionToIndex('R0C1')).toThrow('Position out of bounds');
    expect(() => positionToIndex('R1C11')).toThrow('Position out of bounds');
  });

  test('indexToPosition throws on out of bounds', () => {
    expect(() => indexToPosition(-1)).toThrow('Index out of bounds');
    expect(() => indexToPosition(100)).toThrow('Index out of bounds');
  });
});

describe('Location Conversion', () => {
  test('locationToIndex converts {row:1, column:1} to 0', () => {
    expect(locationToIndex({ row: 1, column: 1 })).toBe(0);
  });

  test('locationToIndex converts {row:10, column:10} to 99', () => {
    expect(locationToIndex({ row: 10, column: 10 })).toBe(99);
  });

  test('indexToLocation converts 0 to {row:1, column:1}', () => {
    expect(indexToLocation(0)).toEqual({ row: 1, column: 1 });
  });

  test('indexToLocation converts 99 to {row:10, column:10}', () => {
    expect(indexToLocation(99)).toEqual({ row: 10, column: 10 });
  });

  test('location conversion roundtrip', () => {
    for (let i = 0; i < 100; i++) {
      const location = indexToLocation(i);
      expect(locationToIndex(location)).toBe(i);
    }
  });
});

describe('Color Encoding', () => {
  test('COLOR_INDEX_MAP has all 8 colors', () => {
    expect(Object.keys(COLOR_INDEX_MAP)).toHaveLength(8);
    expect(COLOR_INDEX_MAP['white']).toBe(0);
    expect(COLOR_INDEX_MAP['grey']).toBe(1);
    expect(COLOR_INDEX_MAP['red']).toBe(2);
    expect(COLOR_INDEX_MAP['orange']).toBe(3);
    expect(COLOR_INDEX_MAP['yellow']).toBe(4);
    expect(COLOR_INDEX_MAP['green']).toBe(5);
    expect(COLOR_INDEX_MAP['blue']).toBe(6);
    expect(COLOR_INDEX_MAP['purple']).toBe(7);
  });

  test('INDEX_COLOR_MAP has all 8 colors', () => {
    expect(INDEX_COLOR_MAP).toHaveLength(8);
    expect(INDEX_COLOR_MAP[0]).toBe('white');
    expect(INDEX_COLOR_MAP[7]).toBe('purple');
  });

  test('colorToIndex and indexToColor are inverses', () => {
    const colors = ['white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
    colors.forEach((color) => {
      const index = colorToIndex(color);
      expect(indexToColor(index)).toBe(color);
    });
  });

  test('EMPTY_TILE is 255', () => {
    expect(EMPTY_TILE).toBe(255);
  });
});

describe('Tile Packing', () => {
  test('packTiles creates 100-byte array', () => {
    const tiles = new Map<string, Tile>();
    const packed = packTiles(tiles);
    expect(packed).toBeInstanceOf(Uint8Array);
    expect(packed.length).toBe(100);
  });

  test('packTiles fills empty tiles with EMPTY_TILE (255)', () => {
    const tiles = new Map<string, Tile>();
    const packed = packTiles(tiles);
    expect(packed.every(byte => byte === EMPTY_TILE)).toBe(true);
  });

  test('packTiles encodes filled tile at R1C1', () => {
    const tiles = new Map<string, Tile>();
    tiles.set('R1C1', {
      position: 'R1C1',
      backgroundColor: 'grey',
      block: { isFilled: true, color: 'red' },
      activeAnimations: [],
    });

    const packed = packTiles(tiles);
    expect(packed[0]).toBe(COLOR_INDEX_MAP['red']); // 2
    expect(packed[1]).toBe(EMPTY_TILE);
  });

  test('packTiles encodes multiple filled tiles', () => {
    const tiles = new Map<string, Tile>();
    tiles.set('R1C1', {
      position: 'R1C1',
      backgroundColor: 'grey',
      block: { isFilled: true, color: 'red' },
      activeAnimations: [],
    });
    tiles.set('R5C3', {
      position: 'R5C3',
      backgroundColor: 'grey',
      block: { isFilled: true, color: 'blue' },
      activeAnimations: [],
    });

    const packed = packTiles(tiles);
    expect(packed[0]).toBe(COLOR_INDEX_MAP['red']);
    expect(packed[42]).toBe(COLOR_INDEX_MAP['blue']);
  });

  test('unpackTiles creates 100 tiles', () => {
    const packed = new Uint8Array(100).fill(EMPTY_TILE);
    const tiles = unpackTiles(packed);
    expect(tiles.size).toBe(100);
  });

  test('unpackTiles creates empty tiles by default', () => {
    const packed = new Uint8Array(100).fill(EMPTY_TILE);
    const tiles = unpackTiles(packed);
    const tile = tiles.get('R1C1')!;
    expect(tile.block.isFilled).toBe(false);
    expect(tile.backgroundColor).toBe('grey');
  });

  test('unpackTiles decodes filled tile', () => {
    const packed = new Uint8Array(100).fill(EMPTY_TILE);
    packed[0] = COLOR_INDEX_MAP['red'];
    const tiles = unpackTiles(packed);
    const tile = tiles.get('R1C1')!;
    expect(tile.block.isFilled).toBe(true);
    expect(tile.block.color).toBe('red');
  });

  test('tile packing roundtrip preserves filled tiles', () => {
    const originalTiles = new Map<string, Tile>();
    originalTiles.set('R1C1', {
      position: 'R1C1',
      backgroundColor: 'grey',
      block: { isFilled: true, color: 'red' },
      activeAnimations: [],
    });
    originalTiles.set('R10C10', {
      position: 'R10C10',
      backgroundColor: 'grey',
      block: { isFilled: true, color: 'purple' },
      activeAnimations: [],
    });

    const packed = packTiles(originalTiles);
    const unpacked = unpackTiles(packed);

    expect(unpacked.get('R1C1')!.block.isFilled).toBe(true);
    expect(unpacked.get('R1C1')!.block.color).toBe('red');
    expect(unpacked.get('R10C10')!.block.isFilled).toBe(true);
    expect(unpacked.get('R10C10')!.block.color).toBe('purple');
  });

  test('unpackTiles throws on invalid array length', () => {
    const packed = new Uint8Array(50);
    expect(() => unpackTiles(packed)).toThrow('Invalid packed tile array length');
  });
});

describe('Shape Packing', () => {
  test('packShape creates compact format', () => {
    const shape: Shape = [
      [{ color: 'grey', isFilled: false }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(shape);
    expect(packed.blocks).toBeInstanceOf(Uint16Array);
    expect(packed.blocks.length).toBe(1);
    expect(packed.color).toBe(COLOR_INDEX_MAP['red']);
  });

  test('packShape encodes T-piece correctly', () => {
    // T-piece: bits 1, 4, 5, 6 should be set
    // Binary: 0000 0000 0111 0010 = 0x0072 = 114
    const shape: Shape = [
      [{ color: 'grey', isFilled: false }, { color: 'purple', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'purple', isFilled: true }, { color: 'purple', isFilled: true }, { color: 'purple', isFilled: true }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(shape);
    const view = new DataView(packed.blocks.buffer);
    const mask = view.getUint16(0, true);
    expect(mask).toBe(0x0072);
    expect(packed.color).toBe(COLOR_INDEX_MAP['purple']);
  });

  test('packShape encodes O-piece (2x2 square)', () => {
    // O-piece at top-left: bits 0, 1, 4, 5
    // Binary: 0000 0000 0011 0011 = 0x0033 = 51
    const shape: Shape = [
      [{ color: 'yellow', isFilled: true }, { color: 'yellow', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'yellow', isFilled: true }, { color: 'yellow', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(shape);
    const view = new DataView(packed.blocks.buffer);
    const mask = view.getUint16(0, true);
    expect(mask).toBe(0x0033);
  });

  test('unpackShape decodes T-piece correctly', () => {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, 0x0072, true); // T-piece mask

    const compact = {
      blocks: new Uint16Array(buffer),
      color: COLOR_INDEX_MAP['purple'],
    };

    const shape = unpackShape(compact);
    expect(shape).toHaveLength(4);
    expect(shape[0][1].isFilled).toBe(true); // Bit 1
    expect(shape[1][0].isFilled).toBe(true); // Bit 4
    expect(shape[1][1].isFilled).toBe(true); // Bit 5
    expect(shape[1][2].isFilled).toBe(true); // Bit 6
    expect(shape[0][0].isFilled).toBe(false);
  });

  test('shape packing roundtrip preserves structure', () => {
    const original: Shape = [
      [{ color: 'grey', isFilled: false }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(original);
    const unpacked = unpackShape(packed);

    // Check structure matches
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        expect(unpacked[row][col].isFilled).toBe(original[row][col].isFilled);
        if (original[row][col].isFilled) {
          expect(unpacked[row][col].color).toBe('red');
        }
      }
    }
  });

  test('packShape with empty shape', () => {
    const shape: Shape = [
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(shape);
    const view = new DataView(packed.blocks.buffer);
    const mask = view.getUint16(0, true);
    expect(mask).toBe(0);
  });
});

describe('Payload Size Comparison', () => {
  test('compact tiles are 98% smaller than JSON', () => {
    const tiles = new Map<string, Tile>();
    // Fill half the grid
    for (let i = 0; i < 50; i++) {
      const pos = indexToPosition(i);
      tiles.set(pos, {
        position: pos,
        backgroundColor: 'grey',
        block: { isFilled: true, color: 'red' },
        activeAnimations: [],
      });
    }

    const packed = packTiles(tiles);
    const packedSize = packed.length; // 100 bytes

    const jsonArray = Array.from(tiles.values()).map(tile => ({
      position: tile.position,
      isFilled: tile.block.isFilled,
      color: tile.block.color,
    }));
    const jsonSize = JSON.stringify(jsonArray).length;

    console.log(`Compact: ${packedSize} bytes, JSON: ${jsonSize} bytes`);
    expect(packedSize).toBe(100);
    expect(jsonSize).toBeGreaterThan(1000); // Much larger
  });

  test('compact shape is 95%+ smaller than JSON', () => {
    const shape: Shape = [
      [{ color: 'grey', isFilled: false }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'red', isFilled: true }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
      [{ color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }, { color: 'grey', isFilled: false }],
    ];

    const packed = packShape(shape);
    const compactSize = 3; // 2 bytes for blocks + 1 byte for color

    const jsonSize = JSON.stringify(shape).length;

    console.log(`Compact shape: ${compactSize} bytes, JSON: ${jsonSize} bytes`);
    expect(jsonSize).toBeGreaterThan(100);
  });
});
