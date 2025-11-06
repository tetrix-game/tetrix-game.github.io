import ShapeContainer from '../ShapeContainer'
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes, maxVisibleShapes, shapesSliding } = useTetrixStateContext();

  // Create initial shapes - only add virtual buffer for gameplay, not tests
  const initialShapes = useMemo(() => {
    const shapes = [];
    // Add one extra shape for virtual container in normal gameplay
    const shapeCount = maxVisibleShapes + 1;
    for (let i = 0; i < shapeCount; i++) {
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

  // Calculate height based on visible shapes - add extra height during sliding animation
  const visibleShapeCount = Math.min(nextShapes.length, maxVisibleShapes);
  const baseHeight = visibleShapeCount * 120; // 102px shape + 18px gap estimate
  // During sliding animation, temporarily increase height to accommodate the sliding effect
  const containerHeight = shapesSliding ? baseHeight + 120 : baseHeight;

  return (
    <div
      className="shape-selector"
      style={{
        height: `${containerHeight}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'height 0.4s ease-out', // Smooth height transition
      }}
    >
      {nextShapes.map((shape, index) => {
        // Virtual containers: only the last container (beyond maxVisibleShapes) is virtual
        const isVirtual = index >= maxVisibleShapes;

        return (
          <ShapeContainer
            key={`shape-container-${index}`}
            shape={shape}
            shapeIndex={index}
            isVirtual={isVirtual}
          />
        );
      })}
    </div>
  )
}

export default ShapeSelector;