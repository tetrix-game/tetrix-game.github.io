// A shape is a 3X3 grid of boolean values that represent a shape
// 0,0 is the top left corner
// 0, 2 is the top right corner
// 2, 0 is the bottom left corner
// 2, 2 is the bottom right corner
export type Shape = Block[][];
export type Location = { row: number, column: number }
export type Block = {
  color: { lightest: string, light: string, main: string, dark: string, darkest: string };
  isFilled: boolean;
  customAttribute?: string;
}
export type Tile = {
  id: string;
  location: Location;
  block: Block
}

// Placement animation states
export type PlacementAnimationState = 'none' | 'placing';

// Bounds for shape options (for return animation)
export type ShapeOptionBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

// Reducer types
export type TetrixReducerState = {
  tiles: Tile[];
  nextShapes: Shape[];
  savedShape: Shape | null;
  selectedShape: Shape | null;
  selectedShapeIndex: number | null;
  mouseGridLocation: Location | null;
  mousePosition: { x: number; y: number } | null;
  gridTileSize: number | null;
  gridBounds: { top: number; left: number; width: number; height: number } | null;
  isShapeDragging: boolean;
  isValidPlacement: boolean; // Track if current hover position is valid for placement
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
  // Animation state for shape placement
  placementAnimationState: PlacementAnimationState;
  animationStartPosition: { x: number; y: number } | null;
  animationTargetPosition: { x: number; y: number } | null;
  // Bounds of each shape option for return animation
  shapeOptionBounds: (ShapeOptionBounds | null)[];
}

type SelectShapeAction = {
  type: 'SELECT_SHAPE';
  value: {
    shape: Shape;
    shapeIndex: number;
    initialPosition?: { x: number; y: number };
  };
}

type UpdateMouseLocationAction = {
  type: 'UPDATE_MOUSE_LOCATION';
  value: {
    location: Location | null;
    position?: { x: number; y: number } | null;
    tileSize?: number | null;
    gridBounds?: { top: number; left: number; width: number; height: number } | null;
    isValid?: boolean; // Whether the current placement is valid
  };
}

type PlaceShapeAction = {
  type: 'PLACE_SHAPE';
  value: {
    location: Location;
  };
}

type CompletePlacementAction = {
  type: 'COMPLETE_PLACEMENT';
}

type ClearSelectionAction = {
  type: 'CLEAR_SELECTION';
}

type SetAvailableShapesAction = {
  type: 'SET_AVAILABLE_SHAPES';
  value: { shapes: Shape[] };
}

type SetShapeOptionBoundsAction = {
  type: 'SET_SHAPE_OPTION_BOUNDS';
  value: { index: number; bounds: ShapeOptionBounds };
}

type ReturnShapeToSelectorAction = {
  type: 'RETURN_SHAPE_TO_SELECTOR';
}

export type TetrixAction =
  | SelectShapeAction
  | UpdateMouseLocationAction
  | PlaceShapeAction
  | CompletePlacementAction
  | ClearSelectionAction
  | SetAvailableShapesAction
  | SetShapeOptionBoundsAction
  | ReturnShapeToSelectorAction;

export type TetrixDispatch = React.Dispatch<TetrixAction>;