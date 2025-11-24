/**
 * Core game types - Basic building blocks (Block, Tile, Shape, Location)
 */

// A shape is a 4X4 grid of blocks
// 0,0 is the top left corner
// 0, 3 is the top right corner
// 3, 0 is the bottom left corner
// 3, 3 is the bottom right corner
export type Shape = Block[][];

export type Location = { row: number; column: number };

export type ColorName = 'grey' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type Block = {
  color: ColorName;
  isFilled: boolean;
  customAttribute?: string;
};

export type Tile = {
  id: string;
  location: Location;
  block: Block;
};

// Tile data stored in the Map with keyed access (e.g., 'R1C1', 'R2C5')
export type TileData = {
  isFilled: boolean;
  color: ColorName;
  activeAnimations?: TileAnimation[]; // Animations currently running on this tile
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

// Set of tile keys with their data
export type TilesSet = Map<string, TileData>;
