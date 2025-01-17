import type { Block } from '../../utils/shape';

type TetrixReducerState = {
  tiles: Array<Block>;
  nextShapes: Block[][][];
  savedShape: Block[][] | null,
}

const initialState: TetrixReducerState = {
  tiles: [],
  nextShapes: [],
  savedShape: null,
}

const tetrixReducer = (state: TetrixReducerState, action: { type: string, value: object }): TetrixReducerState => {
  switch (action.type) {
    case 'hoverGridTileWithShape': break;
    case 'placeShape': break;
    case 'clearRows': break;
    case 'newShape': break;
    case 'rotateShape': break;
    case 'selectShapeSlot': break;
  }

  return state;
};

export { initialState };
export default tetrixReducer;
