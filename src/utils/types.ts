// A shape is a 3X3 grid of boolean values that represent a shape
// 0,0 is the top left corner
// 0, 2 is the top right corner
// 2, 0 is the bottom left corner
// 2, 2 is the bottom right corner
export type Shape = Block[][];
export type Location = { row: number, column: number }
export type Block = {
  color: string | undefined;
  isFilled: boolean;
  customAttribute?: string;
}
export type Tile = {
  location: Location;
  block: Block
}
export type TetrixReducerState = {
  tiles: Tile[];
  nextShapes: Shape[];
  savedShape: Shape | null,
}