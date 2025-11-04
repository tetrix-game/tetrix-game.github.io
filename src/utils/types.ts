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
export type PlacementAnimationState = 'none' | 'animating' | 'settling';

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
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
  // Animation state for shape placement
  placementAnimationState: PlacementAnimationState;
  animationStartPosition: { x: number; y: number } | null;
  animationTargetPosition: { x: number; y: number } | null;
}

type SelectShapeAction = {
  type: 'SELECT_SHAPE';
  value: { shape: Shape; shapeIndex: number };
}

type UpdateMouseLocationAction = {
  type: 'UPDATE_MOUSE_LOCATION';
  value: {
    location: Location | null;
    position?: { x: number; y: number } | null;
    tileSize?: number | null;
    gridBounds?: { top: number; left: number; width: number; height: number } | null;
  };
}

type PlaceShapeAction = {
  type: 'PLACE_SHAPE';
}

type ClearSelectionAction = {
  type: 'CLEAR_SELECTION';
}

type SetAvailableShapesAction = {
  type: 'SET_AVAILABLE_SHAPES';
  value: { shapes: Shape[] };
}

type StartPlacementAnimationAction = {
  type: 'START_PLACEMENT_ANIMATION';
}

type CompletePlacementAnimationAction = {
  type: 'COMPLETE_PLACEMENT_ANIMATION';
}

type FinishSettlingAnimationAction = {
  type: 'FINISH_SETTLING_ANIMATION';
}

export type TetrixAction =
  | SelectShapeAction
  | UpdateMouseLocationAction
  | PlaceShapeAction
  | ClearSelectionAction
  | SetAvailableShapesAction
  | StartPlacementAnimationAction
  | CompletePlacementAnimationAction
  | FinishSettlingAnimationAction;

export type TetrixDispatch = React.Dispatch<TetrixAction>;