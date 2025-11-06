import ShapeOption from '../ShapeOption'
import SavedShape from '../SavedShape'
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes, savedShape } = useTetrixStateContext();

  // Create 3 random shapes on mount
  const initialShapes = useMemo(() => {
    return [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];
  }, []);

  // Set initial shapes in context when component mounts
  useEffect(() => {
    if (nextShapes.length === 0) {
      dispatch({ type: 'SET_AVAILABLE_SHAPES', value: { shapes: initialShapes } });
    }
  }, [dispatch, initialShapes, nextShapes.length]);

  return (
    <div className="shape-selector">
      {nextShapes.map((shape, index) => (
        <ShapeOption key={`shape-option-${index}`} shape={shape} shapeIndex={index} />
      ))}
      <SavedShape shape={savedShape} />
    </div>
  )
}

export default ShapeSelector;