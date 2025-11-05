import './Tetrix.css';
import Grid from '../Grid';
import ShapeSelector from '../ShapeSelector';
import DraggingShape from '../DraggingShape';
import { useTetrixStateContext, useTetrixDispatchContext } from './TetrixContext';
import { useEffect } from 'react';

const Tetrix = () => {
  const { selectedShape } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  // Global pointerUp handler to catch drops outside the grid
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Only handle if a shape is selected and being dragged
      if (!selectedShape) return;

      // Let Grid's pointerUp handle clicks within the grid
      // Let ShapeSelector handle clicks within the shape selector
      // This only handles pointerUp outside both areas
      const target = e.target as HTMLElement;
      const isInsideGrid = target.closest('.grid') !== null;
      const isInsideSelector = target.closest('.shape-selector') !== null;

      if (!isInsideGrid && !isInsideSelector) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [selectedShape, dispatch]);

  return (
    <div className="tetrix">
      <Grid />
      <ShapeSelector />
      <DraggingShape />
    </div>
  )
}

export default Tetrix;