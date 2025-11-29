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

// Self-contained tile entity with position, background, block state, and methods
export class TileEntity {
  // Position string in format "R1C1", "R2C5", etc.
  private _position: string;
  // Background color of the tile itself (independent of block)
  private _backgroundColor: ColorName;
  // Block data (what's placed on this tile)
  private _block: Block;
  // Active animations running on this tile
  private _activeAnimations: TileAnimation[];

  constructor(
    position: string,
    backgroundColor: ColorName = 'grey',
    block: Block = { isFilled: false, color: 'grey' },
    activeAnimations: TileAnimation[] = []
  ) {
    this._position = position;
    this._backgroundColor = backgroundColor;
    this._block = block;
    this._activeAnimations = activeAnimations;
  }

  // Position getters
  get position(): string {
    return this._position;
  }

  get location(): Location {
    // Parse position string "R1C1" to {row: 1, column: 1}
    const match = this._position.match(/R(\d+)C(\d+)/);
    if (!match) throw new Error(`Invalid position format: ${this._position}`);
    return { row: parseInt(match[1]), column: parseInt(match[2]) };
  }

  // Background color getters/setters
  get backgroundColor(): ColorName {
    return this._backgroundColor;
  }

  set backgroundColor(color: ColorName) {
    this._backgroundColor = color;
  }

  // Block getters/setters
  get block(): Block {
    return this._block;
  }

  set block(block: Block) {
    this._block = block;
  }

  get isFilled(): boolean {
    return this._block.isFilled;
  }

  set isFilled(value: boolean) {
    this._block.isFilled = value;
  }

  get blockColor(): ColorName {
    return this._block.color;
  }

  set blockColor(color: ColorName) {
    this._block.color = color;
  }

  // Animation getters/setters
  get activeAnimations(): TileAnimation[] {
    return this._activeAnimations;
  }

  set activeAnimations(animations: TileAnimation[]) {
    this._activeAnimations = animations;
  }

  addAnimation(animation: TileAnimation): void {
    this._activeAnimations.push(animation);
  }

  removeAnimation(animationId: string): void {
    this._activeAnimations = this._activeAnimations.filter(a => a.id !== animationId);
  }

  clearAnimations(): void {
    this._activeAnimations = [];
  }

  // Serialization for persistence
  toJSON(): TileData {
    return {
      position: this._position,
      backgroundColor: this._backgroundColor,
      isFilled: this._block.isFilled,
      color: this._block.color,
      activeAnimations: this._activeAnimations,
    };
  }

  // Create from serialized data
  static fromJSON(data: TileData): TileEntity {
    return new TileEntity(
      data.position,
      data.backgroundColor || 'grey',
      { isFilled: data.isFilled, color: data.color },
      data.activeAnimations || []
    );
  }

  // Clone method
  clone(): TileEntity {
    return new TileEntity(
      this._position,
      this._backgroundColor,
      { ...this._block },
      [...this._activeAnimations]
    );
  }
}

// Legacy Tile type for backward compatibility with components
export type Tile = {
  id: string;
  location: Location;
  block: Block;
  tileBackgroundColor?: ColorName; // Optional background color independent of block
};

// Serialized tile data for persistence and state storage
export type TileData = {
  position: string; // Position string like "R1C1"
  backgroundColor?: ColorName; // Background color of the tile itself
  isFilled: boolean; // Whether a block is placed on this tile
  color: ColorName; // Color of the block
  activeAnimations?: TileAnimation[]; // Animations currently running on this tile
};

// Set of tile keys with their data (sparse representation)
export type TilesSet = Map<string, TileEntity>;

// Helper to convert TilesSet to array for serialization
export function tilesToArray(tiles: TilesSet): TileData[] {
  return Array.from(tiles.values()).map(tile => tile.toJSON());
}

// Helper to convert array to TilesSet for deserialization
export function tilesFromArray(tilesArray: TileData[]): TilesSet {
  const map = new Map<string, TileEntity>();
  for (const data of tilesArray) {
    const tile = TileEntity.fromJSON(data);
    map.set(tile.position, tile);
  }
  return map;
}
