import './ShapeSelector.css';
import ShapeOption from '../ShapeOption'
import ShapeQueueIndicator from '../ShapeQueueIndicator'
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo, useState } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';

// Use WeakMap to assign stable IDs to shapes
const shapeIds = new WeakMap<object, string>();
let idCounter = 0;

const getShapeId = (shape: object): string => {
  if (!shapeIds.has(shape)) {
    shapeIds.set(shape, `shape-${++idCounter}`);
  }
  return shapeIds.get(shape)!;
};

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes } = useTetrixStateContext();

  // Track screen orientation for queue indicator direction
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create initial shapes - start with 3 shapes (can be changed via debug menu)
  const initialShapes = useMemo(() => {
    const shapes = [];
    const initialShapeCount = 3; // Default starting number of shapes
    for (let i = 0; i < initialShapeCount; i++) {
      shapes.push(generateRandomShape());
    }
    return shapes;
  }, []);

  // Set initial shapes in context when component mounts
  useEffect(() => {
    if (nextShapes.length === 0) {
      dispatch({ type: 'SET_AVAILABLE_SHAPES', value: { shapes: initialShapes } });
    }
  }, [dispatch, initialShapes, nextShapes.length]);

  // Limit to maximum of 4 shapes to prevent wrapping
  const displayedShapes = nextShapes.slice(0, 4);

  return (
    <div className="shape-selector">
      <div className="shapes-container">
        {displayedShapes.map((shape, index) => {
          return (
            <ShapeOption
              key={getShapeId(shape)}
              shape={shape}
              shapeIndex={index}
            />
          );
        })}
      </div>
      <ShapeQueueIndicator
        direction={isLandscape ? 'horizontal' : 'vertical'}
      />
    </div>
  )
}

export default ShapeSelector;