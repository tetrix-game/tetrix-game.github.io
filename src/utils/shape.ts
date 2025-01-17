// A shape is a 3X3 grid of boolean values that represent a shape
export type Shape = Array<Array<Block>>;
export type Location = { row: number, column: number }
export type Block = {
  color: string | undefined;
  isFilled: boolean;
  customAttribute?: string;
}
export type Tile = {
  block: Block
}

