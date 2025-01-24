import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';

const makeTiles = () => {
  console.log('making tiles')
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: false, color: 'blue' }
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
      console.log('reducers isFilled:', isFilled)
      return { ...state, tiles: newTiles };
    }
  }

  return state;
}
