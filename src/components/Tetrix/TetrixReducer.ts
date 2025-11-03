import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions } from '../../utils/shapeUtils';

const makeColor = () => {
  const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
  const randomColorIndex = Math.floor(Math.random() * colors.length);
  const randomColor = colors[randomColorIndex];
  switch (randomColor) {
    case 'blue':
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      }
    case 'red':
      return {
        lightest: '#ff6b6b',
        light: '#ee5a52',
        main: '#d63031',
        dark: '#b71c1c',
        darkest: '#7f0000'
      }
    case 'green':
      return {
        lightest: '#51cf66',
        light: '#40c057',
        main: '#2f9e44',
        dark: '#2b8a3e',
        darkest: '#1b5e20'
      }
    case 'yellow':
      return {
        lightest: '#ffd43b',
        light: '#fcc419',
        main: '#fab005',
        dark: '#f59f00',
        darkest: '#e67700'
      }
    case 'purple':
      return {
        lightest: '#b197fc',
        light: '#9775fa',
        main: '#7950f2',
        dark: '#6741d9',
        darkest: '#4c2a85'
      }
    case 'orange':
      return {
        lightest: '#ffa94d',
        light: '#ff922b',
        main: '#fd7e14',
        dark: '#f76707',
        darkest: '#d9480f'
      }
    default:
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      }
  }
}

const makeTiles = () => {
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: row === 6 && column === 6 ? true : false, color: makeColor() }
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
  mouseGridLocation: null,
  isShapeDragging: false,
}

export function tetrixReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
    case "TOGGLE_BLOCK": {
      const { index, isFilled } = action.value as { index: number, isFilled: boolean };
      const newTiles = state.tiles.map((tile, idx) =>
        idx === index ? { ...tile, block: { ...tile.block, isFilled: !isFilled } } : tile
      );
      return { ...state, tiles: newTiles };
    }

    case "SELECT_SHAPE": {
      const { shape } = action.value;
      return {
        ...state,
        selectedShape: shape,
        isShapeDragging: true,
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location } = action.value;
      return {
        ...state,
        mouseGridLocation: location,
      };
    }

    case "PLACE_SHAPE": {
      if (!state.selectedShape || !state.mouseGridLocation) {
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

      // Update tiles
      const newTiles = state.tiles.map(tile => {
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

      // Auto-select the first available shape after placing
      const nextSelectedShape = state.nextShapes.length > 0 ? state.nextShapes[0] : null;

      return {
        ...state,
        tiles: newTiles,
        selectedShape: nextSelectedShape,
        mouseGridLocation: null,
        isShapeDragging: nextSelectedShape !== null,
      };
    }

    case "CLEAR_SELECTION": {
      return {
        ...state,
        selectedShape: null,
        mouseGridLocation: null,
        isShapeDragging: false,
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
