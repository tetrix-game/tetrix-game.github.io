import './ShapeSelector.css';
import ShapeOption from '../ShapeOption'
import ShapeQueueIndicator from '../ShapeQueueIndicator'
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';
import { useGameSizing } from '../../hooks/useGameSizing';

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

  const { gameControlsLength } = useGameSizing();
  const isLandscape = window.innerWidth >= window.innerHeight;

  // Calculate size for each shape button
  // Need to fit 4 buttons with gaps between them, and allow for 1.05 hover scale
  const shapeGap = 12;
  const totalGaps = shapeGap * 3; // 3 gaps between 4 shapes
  const shapeOptionBaseSize = (gameControlsLength - totalGaps) / (4 * 1.05);
  const shapeOptionFullSize = shapeOptionBaseSize * 1.05; // Size with hover scale

  return (
    <div className="shape-selector">
      <div
        className={`shape-selector-container ${isLandscape ? 'shape-selector-container-landscape' : 'shape-selector-container-portrait'}`}
        style={{
          width: isLandscape ? '100%' : `${gameControlsLength}px`,
          height: isLandscape ? `${gameControlsLength}px` : '100%',
        }}
      >
        {displayedShapes.map((shape, index) => {
          return (
            <div
              key={getShapeId(shape)}
              className="shape-selector-option-wrapper"
              style={{
                width: `${shapeOptionFullSize}px`,
                height: `${shapeOptionFullSize}px`,
              }}
            >
              <ShapeOption
                shape={shape}
                shapeIndex={index}
              />
            </div>
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