import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions, generateRandomShape } from '../../utils/shapeUtils';
import { clearFullLines } from '../../utils/lineUtils';

const emptyColor = {
  lightest: '#000000',
  light: '#000000',
  main: '#000000',
  dark: '#000000',
  darkest: '#000000'
};

const makeTiles = () => {
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: false, color: emptyColor }
      })
    }
  }
  return tiles;
}

export const initialState: TetrixReducerState = {
  tiles: makeTiles(),
  nextShapes: [],
  savedShape: null,
  selectedShape: null,
  selectedShapeIndex: null,
  mouseGridLocation: null,
  isShapeDragging: false,
  hoveredBlockPositions: [],
}

export function tetrixReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
    case "SELECT_SHAPE": {
      const { shape, shapeIndex } = action.value;

      // Calculate hovered block positions if we have a mouse location
      const hoveredBlockPositions = shape && state.mouseGridLocation
        ? getShapeGridPositions(shape, state.mouseGridLocation)
        : [];

      return {
        ...state,
        selectedShape: shape,
        selectedShapeIndex: shapeIndex,
        isShapeDragging: true,
        hoveredBlockPositions,
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location } = action.value;

      // Calculate hovered block positions based on selected shape and mouse location
      const hoveredBlockPositions = state.selectedShape && location
        ? getShapeGridPositions(state.selectedShape, location)
        : [];

      return {
        ...state,
        mouseGridLocation: location,
        hoveredBlockPositions,
      };
    }

    case "PLACE_SHAPE": {
      if (!state.selectedShape || !state.mouseGridLocation || state.selectedShapeIndex === null) {
        return state;
      }

      // Get the positions where the shape would be placed
      const shapePositions = getShapeGridPositions(state.selectedShape, state.mouseGridLocation);

      // Create a map for quick lookup
      const positionMap = new Map<string, typeof shapePositions[0]>();
      for (const pos of shapePositions) {
        const key = `${pos.location.row},${pos.location.column}`;
        positionMap.set(key, pos);
      }

      // Update tiles with the placed shape
      const tilesWithShape = state.tiles.map(tile => {
        const key = `${tile.location.row},${tile.location.column}`;
        const shapePos = positionMap.get(key);

        if (shapePos?.block.isFilled) {
          return {
            ...tile,
            block: { ...shapePos.block, isFilled: true }
          };
        }
        return tile;
      });

      // Check for and clear full lines
      const { tiles: newTiles } = clearFullLines(tilesWithShape);

      // Remove the placed shape from nextShapes
      const remainingShapes = state.nextShapes.filter((_, index) => index !== state.selectedShapeIndex);

      // Generate a new random shape to replace the placed one
      const newRandomShape = generateRandomShape();

      // Add the new shape to the end of nextShapes
      const updatedNextShapes = [...remainingShapes, newRandomShape];

      // Auto-select the first remaining shape (from the original two)
      const nextSelectedShape = remainingShapes.length > 0 ? remainingShapes[0] : null;
      const nextSelectedShapeIndex = remainingShapes.length > 0 ? 0 : null;

      return {
        ...state,
        tiles: newTiles,
        nextShapes: updatedNextShapes,
        selectedShape: nextSelectedShape,
        selectedShapeIndex: nextSelectedShapeIndex,
        mouseGridLocation: null,
        isShapeDragging: nextSelectedShape !== null,
        hoveredBlockPositions: [],
      };
    }

    case "CLEAR_SELECTION": {
      return {
        ...state,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        isShapeDragging: false,
        hoveredBlockPositions: [],
      };
    }

    case "SET_AVAILABLE_SHAPES": {
      const { shapes } = action.value;
      return {
        ...state,
        nextShapes: shapes,
      };
    }
  }

  return state;
}
