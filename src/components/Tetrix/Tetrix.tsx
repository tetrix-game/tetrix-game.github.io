import { useReducer } from 'react';
import './Tetrix.css';
import Grid from '../Grid';
import reducer, { initialState } from './TetrixReducer'
import ShapeSelector from '../ShapeSelector';

type TetrixProps = {
  setScore: (score: number) => void;
}

const Tetrix = ({ setScore }: TetrixProps) => {
  const [{ gridBlocks }] = useReducer(reducer, initialState);
  setScore(0);

  return (
    <div className="tetrix">
      <Grid gridBlocks={gridBlocks} />
      <ShapeSelector />
    </div>
  )
}

export default Tetrix;