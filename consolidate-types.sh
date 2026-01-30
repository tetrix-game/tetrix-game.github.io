#!/bin/bash
set -e

echo "=== Consolidating types into single file ==="

cd src/main/App/Shared/Shared_types

# Create consolidated index.ts
cat > index.ts << 'EOFMAIN'
/**
 * Shared_types - All type definitions for the Tetrix game
 *
 * This module consolidates all type definitions to comply with architecture rules.
 * Sections: core, gameState, animation, drag, theme, persistence, scoring, shapeQueue, stats
 */

// ============================================================================
// CORE TYPES - Basic building blocks (Block, Tile, Shape, Location)
// ============================================================================

// A shape is a 4X4 grid of blocks
// 0,0 is the top left corner
// 0, 3 is the top right corner
// 3, 0 is the bottom left corner
// 3, 3 is the bottom right corner
export type Shape = Block[][];

// A queued shape wraps a Shape with a unique ID for React key stability
// This enables proper queue animations where shapes slide in sequence
export type QueuedShape = {
  id: number; // Unique monotonically increasing ID for React key
  shape: Shape;
  type: 'shape';
};

// A purchasable slot that takes up space in the queue until purchased
export type PurchasableSlot = {
  id: number; // Unique monotonically increasing ID for React key
  type: 'purchasable-slot';
  cost: number; // Points required to purchase this slot
  slotNumber: number; // Which slot this is (2, 3, or 4)
};

// Union type for items in the queue - can be either a shape or a purchasable slot
export type QueueItem = QueuedShape | PurchasableSlot;

export type Location = { row: number; column: number };

export type ColorName = 'grey' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type Block = {
  color: ColorName;
  isFilled: boolean;
  customAttribute?: string;
};

// Animation instance running on a tile
export type TileAnimation = {
  id: string; // Unique ID for this animation instance
  type: 'row-cw' | 'row-double' | 'row-triple' | 'row-quad' | 'column-ccw' | 'column-double' | 'column-triple' | 'column-quad' | 'full-board-columns' | 'full-board-rows';
  startTime: number; // Performance.now() timestamp when animation should start
  duration: number; // Animation duration in milliseconds
  // Optional config for beating heart animations (quad)
  beatCount?: number; // Number of heartbeats
  finishDuration?: number; // Duration of the shrink/fade out phase
  color?: string; // Optional color override for the animation border
};

// Self-contained tile data structure
export type Tile = {
  position: string; // Position string in format "R1C1"
  backgroundColor: ColorName; // Background color of the tile itself
  block: Block; // Block data (what's placed on this tile)
  activeAnimations: TileAnimation[]; // Active animations running on this tile
};

// Serialized tile data for persistence (same as Tile for now, but keeping separate for clarity if needed)
export type TileData = {
  position: string;
  backgroundColor?: ColorName;
  isFilled: boolean;
  color: ColorName;
  activeAnimations?: TileAnimation[];
};

// Set of tile keys with their data
export type TilesSet = Map<string, Tile>;

// Helper to convert TilesSet to array for serialization
function tilesToArray(tiles: TilesSet): TileData[] {
  return Array.from(tiles.values()).map((tile) => ({
    position: tile.position,
    backgroundColor: tile.backgroundColor,
    isFilled: tile.block.isFilled,
    color: tile.block.color,
    activeAnimations: tile.activeAnimations,
  }));
}

EOFMAIN

# Append other type files
for subdir in animation drag gameState persistence scoring shapeQueue stats theme; do
  if [ -f "$subdir/index.ts" ]; then
    echo "" >> index.ts
    echo "// ============================================================================" >> index.ts
    echo "// $(echo $subdir | tr '[:lower:]' '[:upper:]') TYPES" >> index.ts
    echo "// ============================================================================" >> index.ts
    echo "" >> index.ts
    # Extract exports only (skip imports and comments at the top)
    tail -n +5 "$subdir/index.ts" | grep -v "^import " >> index.ts
  fi
done

# Add facade export at the end
cat >> index.ts << 'EOFFACADE'

// Facade export to match folder name
export const Shared_types = {
  tilesToArray,
};
EOFFACADE

# Remove subdirectories
echo "Removing subdirectories..."
for subdir in animation core drag gameState persistence scoring shapeQueue stats theme; do
  if [ -d "$subdir" ]; then
    rm -rf "$subdir"
  fi
done

# Update imports to use Shared_types directly instead of subdirectories
echo "Updating imports..."
cd ../..
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_types/[^']*'|from '../Shared/Shared_types'|g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_types/[^']*'|from '../Shared/Shared_types'|g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from './Shared/Shared_types/[^']*'|from './Shared/Shared_types'|g" {} \;

echo "Types consolidated!"
