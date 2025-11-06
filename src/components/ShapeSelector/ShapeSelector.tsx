import ShapeContainer from '../ShapeContainer'
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes, maxVisibleShapes } = useTetrixStateContext();

  // Create initial shapes based on maxVisibleShapes + 1 buffer
  const initialShapes = useMemo(() => {
    const shapes = [];
    for (let i = 0; i < maxVisibleShapes + 1; i++) {
      shapes.push(generateRandomShape());
    }
    return shapes;
  }, [maxVisibleShapes]);

  // Set initial shapes in context when component mounts
  useEffect(() => {
    if (nextShapes.length === 0) {
      dispatch({ type: 'SET_AVAILABLE_SHAPES', value: { shapes: initialShapes } });
    }
  }, [dispatch, initialShapes, nextShapes.length]);

  // Calculate height based on visible shapes
  const visibleShapeCount = Math.min(nextShapes.length, maxVisibleShapes);
  const containerHeight = visibleShapeCount * 120; // 102px shape + 18px gap estimate

  return (
    <div
      className="shape-selector"
      style={{
        height: `${containerHeight}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {nextShapes.slice(0, maxVisibleShapes).map((shape, index) => (
        <ShapeContainer
          key={`shape-container-${index}`}
          shape={shape}
          shapeIndex={index}
        />
      ))}
    </div>
  )
}

export default ShapeSelector;