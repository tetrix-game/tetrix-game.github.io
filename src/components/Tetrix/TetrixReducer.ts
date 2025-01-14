import { Block } from './GridBlock/GridBlock';

type TetrixReducerState = {
  gridBlocks: Array<Block>;
}

const initialState = {
  gridBlocks: Array.from({ length: 100 }).map((_, index) => ({ row: 1 + Math.floor(index / 10), column: 1 + index % 10 })),
}

const tetrixReducer = (state: TetrixReducerState, action: { type: string, value: any }) => {
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
