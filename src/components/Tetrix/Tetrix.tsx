import './Tetrix.css';
import Grid from '../Grid';
import ShapeSelector from '../ShapeSelector';

const Tetrix = () => {
  return (
    <div className="tetrix">
      <Grid />
      <ShapeSelector />
    </div>
  )
}

export default Tetrix;