import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions, generateRandomShape } from '../../utils/shapeUtils';
import { clearFullLines } from '../../utils/lineUtils';
import { calculateScore } from '../../utils/scoringUtils';
import { safeBatchSave } from '../../utils/persistenceUtils';

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
  mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, // Default to center instead of null
  showerLocation: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, // Default coin shower location
  gridTileSize: null,
  gridBounds: null,
  isShapeDragging: false,
  isValidPlacement: false,
  hoveredBlockPositions: [],
  placementAnimationState: 'none',
  animationStartPosition: null,
  animationTargetPosition: null,
  shapeOptionBounds: [null, null, null],
  score: 0,
}

export function tetrixReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {

  switch (action.type) {
    case "SELECT_SHAPE": {
      const { shape, shapeIndex, initialPosition } = action.value;

      return {
        ...state,
        selectedShape: shape,
        selectedShapeIndex: shapeIndex,
        isShapeDragging: true,
        mousePosition: initialPosition || state.mousePosition,
        hoveredBlockPositions: [],
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location, position, tileSize, gridBounds, isValid } = action.value;

      // Calculate hovered block positions based on selected shape and mouse location
      const hoveredBlockPositions = state.selectedShape && location
        ? getShapeGridPositions(state.selectedShape, location)
        : [];

      return {
        ...state,
        mouseGridLocation: location,
        mousePosition: position ?? state.mousePosition ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        gridTileSize: tileSize ?? state.gridTileSize ?? null,
        gridBounds: gridBounds ?? state.gridBounds ?? null,
        isValidPlacement: isValid ?? false,
        hoveredBlockPositions,
      };
    }

    case "PLACE_SHAPE": {
      const { location, mousePosition: clickPosition } = action.value;

      if (!state.selectedShape || state.selectedShapeIndex === null) {
        return state;
      }

      // Start placement animation
      if (!state.gridTileSize || !state.gridBounds) {
        return state;
      }

      // Use the click position if provided, otherwise fall back to current mouse position
      const useMousePosition = clickPosition || state.mousePosition;
      if (!useMousePosition) {
        return state;
      }

      // Calculate the target position
      const tileWithGap = state.gridTileSize + 2;
      const targetCellLeft = state.gridBounds.left + (location.column - 1) * tileWithGap;
      const targetCellTop = state.gridBounds.top + (location.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + state.gridTileSize / 2;
      const targetCellCenterY = targetCellTop + state.gridTileSize / 2;

      // Get the positions where the shape will be placed
      const shapePositions = getShapeGridPositions(state.selectedShape, location);

      console.log('🎯 PLACE_SHAPE: Setting showerLocation to:', useMousePosition);

      return {
        ...state,
        placementAnimationState: 'placing',
        animationStartPosition: { ...useMousePosition },
        animationTargetPosition: { x: targetCellCenterX, y: targetCellCenterY },
        mouseGridLocation: location,
        mousePosition: useMousePosition, // Update current mouse position with click position
        showerLocation: useMousePosition, // Set dedicated shower location for coin emission
        hoveredBlockPositions: shapePositions,
        isShapeDragging: false,
      };
    }

    case "COMPLETE_PLACEMENT": {
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
      const { tiles: newTiles, clearedRows, clearedColumns } = clearFullLines(tilesWithShape);

      // Calculate score for lines cleared
      const scoreData = calculateScore(clearedRows.length, clearedColumns.length);
      const newScore = state.score + scoreData.pointsEarned;

      // Remove the placed shape from nextShapes
      const remainingShapes = state.nextShapes.filter((_, index) => index !== state.selectedShapeIndex);

      // Generate a new random shape to replace the placed one
      const newRandomShape = generateRandomShape();

      // Add the new shape to the end of nextShapes
      const updatedNextShapes = [...remainingShapes, newRandomShape];

      const newState = {
        ...state,
        tiles: newTiles,
        nextShapes: updatedNextShapes,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position instead of clearing
        isShapeDragging: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none' as const,
        animationStartPosition: null,
        animationTargetPosition: null,
        score: newScore,
      };

      console.log('🎯 COMPLETE_PLACEMENT: showerLocation preserved as:', newState.showerLocation);

      // Save game state to browser DB asynchronously (don't block UI)
      if (scoreData.pointsEarned > 0 || newTiles.some(tile => tile.block.isFilled)) {
        safeBatchSave(newScore, newTiles, updatedNextShapes, newState.savedShape)
          .catch((error: Error) => {
            console.error('Failed to save game state:', error);
          });
      }

      return newState;
    }

    case "CLEAR_SELECTION": {
      // Clear selection immediately (ESC key)
      return {
        ...state,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        isShapeDragging: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none',
        animationStartPosition: null,
        animationTargetPosition: null,
      };
    }

    case "SET_AVAILABLE_SHAPES": {
      const { shapes } = action.value;
      const newState = {
        ...state,
        nextShapes: shapes,
      };

      // Save shapes to database when they are updated
      safeBatchSave(undefined, undefined, shapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "SET_SHAPE_OPTION_BOUNDS": {
      const { index, bounds } = action.value;
      const newBounds = [...state.shapeOptionBounds];
      newBounds[index] = bounds;
      return {
        ...state,
        shapeOptionBounds: newBounds,
      };
    }

    case "RETURN_SHAPE_TO_SELECTOR": {
      // Return shape to selector (invalid placement or drag outside grid)
      return {
        ...state,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        isShapeDragging: false,
        isValidPlacement: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none' as const,
        animationStartPosition: null,
        animationTargetPosition: null,
      };
    }

    case "ADD_SCORE": {
      const { scoreData, mousePosition: clickPosition } = action.value;
      const newScore = state.score + scoreData.pointsEarned;

      // Save updated score
      safeBatchSave(newScore)
        .catch((error: Error) => {
          console.error('Failed to save score:', error);
        });

      return {
        ...state,
        score: newScore,
        mousePosition: clickPosition || state.mousePosition, // Update mouse position if provided
        showerLocation: clickPosition || state.showerLocation, // Update shower location if provided (for debug injection)
      };
    }

    case "LOAD_GAME_STATE": {
      const { gameData } = action.value;
      return {
        ...state,
        score: gameData.score,
        tiles: gameData.tiles,
        nextShapes: gameData.nextShapes || state.nextShapes,
        savedShape: gameData.savedShape || state.savedShape,
      };
    }

    case "RESET_GAME": {
      return {
        ...initialState,
      };
    }
  }

  return state;
}
