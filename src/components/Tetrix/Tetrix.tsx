import { useCallback, useReducer } from 'react';
import './Tetrix.css';
import Grid from '../Grid';
import reducer, { initialState } from './TetrixReducer'
import ShapeSelector from '../ShapeSelector';
import { Shape } from '../../utils/types';

type TetrixProps = {
  setScore: (score: number) => void;
}

const Tetrix = ({ setScore }: TetrixProps) => {
  const [{ tiles, nextShapes, savedShape }, dispatch] = useReducer(reducer, initialState);

  const placeShape = useCallback(({ shape, gridIndex }: { shape: Shape, gridIndex: number }) => {
    // Actually updates the state of the blocks in the Tiles of the grid
  }, [])

  const hoverShape = useCallback(({ shape, gridIndex }: { shape: Shape, gridIndex: number }) => {
    // Blocks indicate if the shape fits
    // Rows and columns indicate if they'll be cleared

    // Cleared blocks rise over the grid with a dropshadow, and rising sound
    // Blocks in the shape snick together with a slight sound

    // Animations and sounds can swap out for others in the future for different themes

    // Ran when the position of the finger that's dragging a shape changes to hover the virtual shape position over a new grid location
  }, [])

  return (
    <div className="tetrix">
      <Grid tiles={tiles} dispatch={dispatch} />
      <ShapeSelector {...{ nextShapes, savedShape, placeShape }} />
    </div>
  )
}

export default Tetrix;