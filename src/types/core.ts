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
};

// Set of tile keys with their data
export type TilesSet = Map<string, TileData>;
