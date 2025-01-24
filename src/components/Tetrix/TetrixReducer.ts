import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';

const makeColor = () => {
  const colors = ['blue'];
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
  nextShapes: [[], [], []],
  savedShape: null,
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
  }

  return state;
}
