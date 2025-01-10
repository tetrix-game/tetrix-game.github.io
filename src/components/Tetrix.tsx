import { useReducer } from 'react';
import './Tetrix.css';
import Grid from './Grid';
import reducer, { initialState } from './TetrixReducer'

const Tetrix = () => {
  const [{ gridBlocks }] = useReducer(reducer, initialState);
  console.log('gridBlocks', gridBlocks)

  return (
    <div className="tetrix">
      <Grid gridBlocks={gridBlocks} />
      <div className="shapes" />
    </div>
  )
}

export default Tetrix;