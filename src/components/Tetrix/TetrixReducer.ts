import type { Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';

const makeTiles = () => {
  console.log('making tiles')
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        location: { row, column },
        block: { isFilled: false, color: '' }
      })
    }
  }
  return tiles;
}

const initialState: TetrixReducerState = {
  tiles: makeTiles(),
  nextShapes: [[], [], []],
  savedShape: null,
}

const tetrixReducer = (state: TetrixReducerState, action: { type: string, value: object }): TetrixReducerState => {
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
};

export { initialState };
export default tetrixReducer;
