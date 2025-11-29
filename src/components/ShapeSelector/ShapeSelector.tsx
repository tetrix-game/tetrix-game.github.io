import './ShapeSelector.css';
import ShapeOption from '../ShapeOption'
import QueueIndicator from '../QueueIndicator';
import QueueOverlay from '../QueueOverlay';
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
  const { nextShapes, removingShapeIndex, shapeRemovalAnimationState, queueMode, queueHiddenShapes, isQueueOverlayOpen } = useTetrixStateContext();

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

  // ShapeSelector sizing logic:
  // - In portrait: 3 shapes wide (horizontal), no gaps between shapes
  // - In landscape: 3 shapes tall (vertical), no gaps between shapes
  // - Each shape is square
  
  const containerPadding = 12; // padding on each side
  const totalPadding = containerPadding * 2;
  
  // Calculate the size of each square shape option
  // We want exactly 3 shapes with no gaps between them
  const shapeOptionSize = (gameControlsLength - totalPadding) / 3;
  
  // The shape selector container size should be exactly 3x the shape size
  const shapeSelectorSize = gameControlsLength;

  // Handle queue indicator click
  const handleQueueIndicatorClick = () => {
    dispatch({ type: 'TOGGLE_QUEUE_OVERLAY' });
  };

  // Calculate hidden shape count for indicator
  const hiddenCount = queueHiddenShapes.length;

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
                '--shape-wrapper-size': `${shapeOptionSize}px`,
                '--is-landscape': isLandscape ? '1' : '0',
              } as React.CSSProperties}
            >
              <ShapeOption
                shape={shape}
                shapeIndex={index}
                shapeOptionFullSize={shapeOptionSize}
              />
            </div>
          );
        })}
      </div>
      
      <QueueIndicator
        mode={queueMode}
        hiddenCount={hiddenCount}
        onClick={handleQueueIndicatorClick}
      />
      
      {isQueueOverlayOpen && (
        <QueueOverlay
          hiddenShapes={queueHiddenShapes}
          onClose={handleQueueIndicatorClick}
        />
      )}
    </div>
  )
}

export default ShapeSelector;