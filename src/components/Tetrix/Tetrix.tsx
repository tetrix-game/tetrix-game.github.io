import './Tetrix.css';
import Grid from '../Grid';
import ShapeSelector from '../ShapeSelector';
import DraggingShape from '../DraggingShape';

const Tetrix = () => {
  return (
    <div className="tetrix">
      <Grid />
      <ShapeSelector />
      <DraggingShape />
    </div>
  )
}

export default Tetrix;