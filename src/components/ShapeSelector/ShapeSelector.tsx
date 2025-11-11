import './ShapeSelector.css';
import ShapeOption from '../ShapeOption'
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
  const { nextShapes, removingShapeIndex, shapeRemovalAnimationState } = useTetrixStateContext();

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

  // Display all shapes (including 4th during slide-in animation)
  // The container will clip overflow, and the 4th shape slides in when another is removed
  const displayedShapes = nextShapes;

  const { gameControlsLength } = useGameSizing();
  const isLandscape = window.innerWidth >= window.innerHeight;

  // Calculate size for each shape button
  // Need to fit 3 buttons with gaps between them, and allow for 1.05 hover scale
  const shapeGap = 12;
  const containerPadding = 12; // padding on each side
  const totalGaps = shapeGap * 2; // 2 gaps between 3 shapes
  const totalPadding = containerPadding * 2; // padding on both sides
  const availableSpace = gameControlsLength - totalGaps - totalPadding;
  const shapeOptionBaseSize = availableSpace / (3 * 1.05);
  const shapeOptionFullSize = shapeOptionBaseSize * 1.05; // Size with hover scale

  // Fixed container size based on 4 shapes (always, regardless of actual count)
  // This prevents the container from growing/shrinking and allows clipping
  const shapeSelectorSize = gameControlsLength;

  return (
    <div
      className="shape-selector"
      style={{
        '--shape-selector-width': isLandscape ? 'auto' : `${shapeSelectorSize}px`,
        '--shape-selector-height': isLandscape ? `${shapeSelectorSize}px` : 'auto',
      } as React.CSSProperties}
    >
      <div
        className={`shape-selector-shapes-container ${isLandscape ? 'shape-selector-shapes-container-landscape' : 'shape-selector-shapes-container-portrait'}`}
      >
        {displayedShapes.map((shape, index) => {
          const isRemoving = removingShapeIndex === index && shapeRemovalAnimationState === 'removing';
          return (
            <div
              key={getShapeId(shape)}
              className={`shape-selector-shape-wrapper${isRemoving ? ' removing' : ''}`}
              data-landscape={isLandscape ? '1' : '0'}
              style={{
                '--shape-wrapper-size': `${shapeOptionFullSize}px`,
                '--is-landscape': isLandscape ? '1' : '0',
              } as React.CSSProperties}
            >
              <ShapeOption
                shape={shape}
                shapeIndex={index}
                shapeOptionFullSize={shapeOptionFullSize}
              />
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default ShapeSelector;