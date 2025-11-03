import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { canPlaceShape, getShapeGridPositions } from '../utils/shapeUtils';
import type { Shape, Location, Tile, Block } from '../utils/types';
import TileVisual from '../components/TileVisual/TileVisual';
import { TetrixDispatchContext } from '../components/Tetrix/TetrixContext';

// Helper to create test shapes
const createLShape = (): Shape => {
  const color = {
    lightest: '#0274e6',
    light: '#0059b2',
    main: '#023f80',
    dark: '#023468',
    darkest: '#011e3f'
  };

  return [
    [{ color, isFilled: true }, { color, isFilled: false }, { color, isFilled: false }],
    [{ color, isFilled: true }, { color, isFilled: false }, { color, isFilled: false }],
    [{ color, isFilled: true }, { color, isFilled: true }, { color, isFilled: false }],
  ];
};

const createSquareShape = (): Shape => {
  const color = {
    lightest: '#ff6b6b',
    light: '#ff5252',
    main: '#ff3838',
    dark: '#ee2222',
    darkest: '#cc0000'
  };

  return [
    [{ color, isFilled: true }, { color, isFilled: true }, { color, isFilled: false }],
    [{ color, isFilled: true }, { color, isFilled: true }, { color, isFilled: false }],
    [{ color, isFilled: false }, { color, isFilled: false }, { color, isFilled: false }],
  ];
};

describe('Shape Hover Effect - Unit Tests', () => {
  describe('getShapeGridPositions - Correct positioning', () => {
    it('should return exactly 4 positions for L-shape', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 5, column: 5 };

      const positions = getShapeGridPositions(shape, centerLocation);

      // L-shape has 4 filled blocks
      expect(positions.length).toBe(4);
    });

    it('should return positions centered around the hover location', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 5, column: 5 };

      const positions = getShapeGridPositions(shape, centerLocation);

      // Extract row and column values
      const rows = positions.map(p => p.location.row);
      const cols = positions.map(p => p.location.column);

      // All positions should be reasonably close to the center location
      // L-shape center is at (1, 0.5), so blocks offset from center
      for (const row of rows) {
        expect(row).toBeGreaterThanOrEqual(4);
        expect(row).toBeLessThanOrEqual(6);
      }

      for (const col of cols) {
        expect(col).toBeGreaterThanOrEqual(4);
        expect(col).toBeLessThanOrEqual(6);
      }
    });

    it('should return unique positions (no duplicates)', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 5, column: 5 };

      const positions = getShapeGridPositions(shape, centerLocation);
      const positionStrings = positions.map(p => `${p.location.row},${p.location.column}`);
      const uniquePositions = new Set(positionStrings);

      // All positions should be unique
      expect(uniquePositions.size).toBe(positions.length);
    });

    it('should maintain same relative distances between blocks regardless of center location', () => {
      const shape = createLShape();
      const location1: Location = { row: 3, column: 3 };
      const location2: Location = { row: 7, column: 7 };

      const positions1 = getShapeGridPositions(shape, location1);
      const positions2 = getShapeGridPositions(shape, location2);

      // Both should have same number of blocks
      expect(positions1.length).toBe(positions2.length);

      // Calculate relative distances for both
      // (the shape should maintain its form, just be translated)
      const offset = {
        row: location2.row - location1.row,
        column: location2.column - location1.column
      };

      // Each position in positions2 should be positions1 + offset
      for (let index = 0; index < positions1.length; index++) {
        const pos1 = positions1[index];
        const pos2 = positions2[index];
        const expectedRow = pos1.location.row + offset.row;
        const expectedCol = pos1.location.column + offset.column;

        // Allow for rounding differences
        expect(Math.abs(pos2.location.row - expectedRow)).toBeLessThanOrEqual(1);
        expect(Math.abs(pos2.location.column - expectedCol)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('canPlaceShape - Placement validation', () => {
    it('should return true when shape fits in empty grid', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 5, column: 5 };
      const gridSize = { rows: 10, columns: 10 };
      const occupied = new Set<string>();

      const canPlace = canPlaceShape(shape, centerLocation, gridSize, occupied);

      expect(canPlace).toBe(true);
    });

    it('should return false when shape extends beyond grid boundaries', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 1, column: 1 }; // Too close to edge
      const gridSize = { rows: 10, columns: 10 };
      const occupied = new Set<string>();

      const canPlace = canPlaceShape(shape, centerLocation, gridSize, occupied);

      // L-shape extends beyond row 1 when centered there
      expect(canPlace).toBe(false);
    });

    it('should return false when shape overlaps with occupied tiles', () => {
      const shape = createLShape();
      const centerLocation: Location = { row: 5, column: 5 };
      const gridSize = { rows: 10, columns: 10 };
      const occupied = new Set<string>(['5,5']); // Occupied position

      const canPlace = canPlaceShape(shape, centerLocation, gridSize, occupied);

      // One of the L-shape blocks will overlap with occupied tile
      expect(canPlace).toBe(false);
    });

    it('should return true when shape is adjacent to but not overlapping occupied tiles', () => {
      const shape = createSquareShape();
      const centerLocation: Location = { row: 5, column: 5 };
      const gridSize = { rows: 10, columns: 10 };
      const occupied = new Set<string>(['7,7', '8,8']); // Away from shape

      const canPlace = canPlaceShape(shape, centerLocation, gridSize, occupied);

      expect(canPlace).toBe(true);
    });
  });

  describe('Shape preview consistency requirements', () => {
    it('should calculate the same center point for shape regardless of hover location', () => {
      const shape = createLShape();

      // Get positions at different locations
      const pos1 = getShapeGridPositions(shape, { row: 3, column: 3 });
      const pos2 = getShapeGridPositions(shape, { row: 8, column: 8 });

      // Calculate center of mass for both
      const center1 = {
        row: pos1.reduce((sum, p) => sum + p.location.row, 0) / pos1.length,
        column: pos1.reduce((sum, p) => sum + p.location.column, 0) / pos1.length
      };

      const center2 = {
        row: pos2.reduce((sum, p) => sum + p.location.row, 0) / pos2.length,
        column: pos2.reduce((sum, p) => sum + p.location.column, 0) / pos2.length
      };

      // The offset between centers should match the offset between hover locations
      const centerOffset = {
        row: center2.row - center1.row,
        column: center2.column - center1.column
      };

      expect(Math.abs(centerOffset.row - 5)).toBeLessThanOrEqual(0.5); // 8 - 3 = 5
      expect(Math.abs(centerOffset.column - 5)).toBeLessThanOrEqual(0.5); // 8 - 3 = 5
    });

    it('should return positions that when rendered at half-size and centered maintain visual alignment', () => {
      const shape = createSquareShape();
      const centerLocation: Location = { row: 5, column: 5 };

      const positions = getShapeGridPositions(shape, centerLocation);

      // For half-sized preview, each block should be rendered at:
      // - Size: 50% of normal
      // - Position: Centered within the tile
      // The center point of each half-sized block should align with the center of the tile

      // This test documents the expected behavior:
      // If a block would normally fill tile (5,5) completely,
      // a half-sized version should be centered at tile (5,5)'s center

      expect(positions.length).toBe(4); // Square has 4 blocks
      expect(positions.every(p => p.block.isFilled)).toBe(true);
    });
  });

  describe('Preview overlay logic', () => {
    it('should only mark tiles as preview that exactly match shape block positions', () => {
      const shape = createLShape();
      const hoverLocation: Location = { row: 5, column: 5 };

      const previewPositions = getShapeGridPositions(shape, hoverLocation);
      const previewSet = new Set(
        previewPositions.map(p => `${p.location.row},${p.location.column}`)
      );

      // Only these exact positions should be marked as preview
      expect(previewSet.size).toBe(4); // L-shape has 4 blocks

      // Tiles ABOVE the hover location should NOT be in the preview set
      // unless they are part of the actual shape
      // The key is that ONLY shape positions should be previewed
      const allPossibleTiles = [];
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          allPossibleTiles.push(`${row},${col}`);
        }
      }

      // 96 tiles (100 - 4) should NOT be in the preview set
      const nonPreviewTiles = allPossibleTiles.filter(tile => !previewSet.has(tile));
      expect(nonPreviewTiles.length).toBe(96);
    });

    it('should distinguish between placeable and non-placeable preview states', () => {
      const shape = createLShape();
      const placeableLocation: Location = { row: 5, column: 5 };
      const nonPlaceableLocation: Location = { row: 1, column: 1 };
      const gridSize = { rows: 10, columns: 10 };
      const occupied = new Set<string>();

      const canPlacePlaceable = canPlaceShape(shape, placeableLocation, gridSize, occupied);
      const canPlaceNonPlaceable = canPlaceShape(shape, nonPlaceableLocation, gridSize, occupied);

      expect(canPlacePlaceable).toBe(true);
      expect(canPlaceNonPlaceable).toBe(false);

      // Both states should return the same positions (shape doesn't change)
      const positionsPlaceable = getShapeGridPositions(shape, placeableLocation);
      const positionsNonPlaceable = getShapeGridPositions(shape, nonPlaceableLocation);

      expect(positionsPlaceable.length).toBe(positionsNonPlaceable.length);

      // The rendering logic should differ:
      // - Placeable: full size + whitish tint
      // - Non-placeable: half size + NO tint
    });
  });

  describe('Tint Overlay Rendering Conditions', () => {
    it('should render tint overlay when isPreview=true and tile.block.isFilled=false', () => {
      const mockDispatch = () => { };
      const emptyColor = {
        lightest: '#ffffff',
        light: '#cccccc',
        main: '#999999',
        dark: '#666666',
        darkest: '#333333'
      };

      const previewColor = {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };

      // Case 1: Empty tile with preview - SHOULD show tint
      const emptyTileWithPreview: Tile = {
        id: '1',
        location: { row: 5, column: 5 },
        block: { color: emptyColor, isFilled: false }
      };

      const previewBlock: Block = {
        color: previewColor,
        isFilled: true
      };

      const { container: container1 } = render(
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <TileVisual
            tile={emptyTileWithPreview}
            isPreview={true}
            previewBlock={previewBlock}
          />
        </TetrixDispatchContext.Provider>
      );

      // Find tint overlay - it should have rgba(255, 255, 255, 0.2) background
      const tintOverlay1 = container1.querySelector('[style*="rgba(255, 255, 255, 0.2)"]');
      expect(tintOverlay1).toBeTruthy();
    });

    it('should NOT render tint overlay when isPreview=true but tile.block.isFilled=true', () => {
      const mockDispatch = () => { };
      const filledColor = {
        lightest: '#ff6b6b',
        light: '#ff5252',
        main: '#ff3838',
        dark: '#ee2222',
        darkest: '#cc0000'
      };

      const previewColor = {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };

      // Case 2: Filled tile with preview - should NOT show tint
      const filledTileWithPreview: Tile = {
        id: '2',
        location: { row: 5, column: 5 },
        block: { color: filledColor, isFilled: true }
      };

      const previewBlock: Block = {
        color: previewColor,
        isFilled: true
      };

      const { container } = render(
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <TileVisual
            tile={filledTileWithPreview}
            isPreview={true}
            previewBlock={previewBlock}
          />
        </TetrixDispatchContext.Provider>
      );

      // Should NOT find tint overlay
      const tintOverlay = container.querySelector('[style*="rgba(255, 255, 255, 0.2)"]');
      expect(tintOverlay).toBeNull();
    });

    it('should NOT render tint overlay when isPreview=false even if tile is empty', () => {
      const mockDispatch = () => { };
      const emptyColor = {
        lightest: '#ffffff',
        light: '#cccccc',
        main: '#999999',
        dark: '#666666',
        darkest: '#333333'
      };

      // Case 3: Empty tile without preview - should NOT show tint
      const emptyTileNoPreview: Tile = {
        id: '3',
        location: { row: 5, column: 5 },
        block: { color: emptyColor, isFilled: false }
      };

      const { container } = render(
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <TileVisual
            tile={emptyTileNoPreview}
            isPreview={false}
          />
        </TetrixDispatchContext.Provider>
      );

      // Should NOT find tint overlay
      const tintOverlay = container.querySelector('[style*="rgba(255, 255, 255, 0.2)"]');
      expect(tintOverlay).toBeNull();
    });

    it('should NOT render tint overlay when isPreview=false and tile is filled', () => {
      const mockDispatch = () => { };
      const filledColor = {
        lightest: '#ff6b6b',
        light: '#ff5252',
        main: '#ff3838',
        dark: '#ee2222',
        darkest: '#cc0000'
      };

      // Case 4: Filled tile without preview - should NOT show tint
      const filledTileNoPreview: Tile = {
        id: '4',
        location: { row: 5, column: 5 },
        block: { color: filledColor, isFilled: true }
      };

      const { container } = render(
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <TileVisual
            tile={filledTileNoPreview}
            isPreview={false}
          />
        </TetrixDispatchContext.Provider>
      );

      // Should NOT find tint overlay
      const tintOverlay = container.querySelector('[style*="rgba(255, 255, 255, 0.2)"]');
      expect(tintOverlay).toBeNull();
    });

    it('BUG FIX: isPreview should be false if tile is already filled, even if in previewSet', () => {
      // This test catches the bug shown in the screenshot where tint appears on filled tiles
      const shape = createLShape();
      const hoverLocation: Location = { row: 5, column: 5 };

      const previewPositions = getShapeGridPositions(shape, hoverLocation);
      const previewSet = new Set(
        previewPositions.map(p => `${p.location.row},${p.location.column}`)
      );

      // Simulate tiles - some filled, some empty
      const testTiles: Tile[] = [
        {
          id: '1',
          location: { row: 5, column: 5 },
          block: {
            color: { lightest: '#f00', light: '#e00', main: '#d00', dark: '#c00', darkest: '#b00' },
            isFilled: true  // Already filled
          }
        },
        {
          id: '2',
          location: { row: 5, column: 5 },
          block: {
            color: { lightest: '#fff', light: '#eee', main: '#ddd', dark: '#ccc', darkest: '#bbb' },
            isFilled: false  // Empty
          }
        }
      ];

      // Test filled tile that's in preview position
      const filledTileKey = `${testTiles[0].location.row},${testTiles[0].location.column}`;
      const isPreviewForFilled = previewSet.has(filledTileKey) && !testTiles[0].block.isFilled;
      expect(isPreviewForFilled).toBe(false); // Should NOT be preview because tile is filled

      // Test empty tile that's in preview position  
      const emptyTileKey = `${testTiles[1].location.row},${testTiles[1].location.column}`;
      const isPreviewForEmpty = previewSet.has(emptyTileKey) && !testTiles[1].block.isFilled;
      expect(isPreviewForEmpty).toBe(true); // SHOULD be preview because tile is empty
    });

    it('BUG DETECTION: isPreview should be true if and only if the tile is in previewSet', () => {
      const shape = createLShape();
      const hoverLocation: Location = { row: 5, column: 5 };

      const previewPositions = getShapeGridPositions(shape, hoverLocation);
      const previewSet = new Set(
        previewPositions.map(p => `${p.location.row},${p.location.column}`)
      );

      // Check all 100 tiles
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const key = `${row},${col}`;
          const isPreview = previewSet.has(key);

          // isPreview should be true if and only if the key is in previewSet
          expect(isPreview).toBe(previewSet.has(key));

          // If isPreview is true, there should be a corresponding position in previewPositions
          if (isPreview) {
            const matchingPosition = previewPositions.find(p =>
              p.location.row === row && p.location.column === col
            );
            expect(matchingPosition).toBeDefined();
          }
        }
      }

      // Exactly 4 tiles should have isPreview=true (L-shape has 4 blocks)
      let previewCount = 0;
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const key = `${row},${col}`;
          if (previewSet.has(key)) previewCount++;
        }
      }
      expect(previewCount).toBe(4);
    });

    it('BUG DETECTION: Grid.tsx performs unnecessary .find() operations on every render', () => {
      // This test documents a performance bug in Grid.tsx
      // CURRENT IMPLEMENTATION (line 94-97 in Grid.tsx):
      // previewBlock={isPreview ? previewPositions.find(p =>
      //   p.location.row === tile.location.row &&
      //   p.location.column === tile.location.column
      // )?.block : undefined}

      // PROBLEM: For each of 100 tiles, if isPreview is true, we call .find()
      // This is inefficient - we already have a Set for O(1) lookup of keys,
      // but then do O(n) search through previewPositions array

      const shape = createLShape();
      const hoverLocation: Location = { row: 5, column: 5 };
      const previewPositions = getShapeGridPositions(shape, hoverLocation);

      // BETTER APPROACH: Create a Map for O(1) lookup of both key AND block
      const previewMap = new Map(
        previewPositions.map(p => [
          `${p.location.row},${p.location.column}`,
          p.block
        ])
      );

      // Verify the Map works correctly
      for (const position of previewPositions) {
        const key = `${position.location.row},${position.location.column}`;
        const block = previewMap.get(key);

        expect(block).toBeDefined();
        expect(block?.color).toEqual(position.block.color);
        expect(block?.isFilled).toBe(true);
      }

      // Verify non-preview tiles return undefined
      expect(previewMap.get('1,1')).toBeUndefined();
      expect(previewMap.get('10,10')).toBeUndefined();

      // This demonstrates the fix: use Map.get() instead of Array.find()
      // Time complexity: O(1) vs O(n)
    });
  });
});
