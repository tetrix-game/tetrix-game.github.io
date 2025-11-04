import ShapeOption from '../ShapeOption'
import SavedShape from '../SavedShape'
import type { Shape } from '../../utils/types';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';

// Sample shapes (tetromino-like pieces)
const makeColor = () => {
  const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
  const randomColorIndex = Math.floor(Math.random() * colors.length);
  const randomColor = colors[randomColorIndex];

  switch (randomColor) {
    case 'blue':
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };
    case 'red':
      return {
        lightest: '#ff6b6b',
        light: '#ee5a52',
        main: '#d63031',
        dark: '#b71c1c',
        darkest: '#7f0000'
      };
    case 'green':
      return {
        lightest: '#51cf66',
        light: '#40c057',
        main: '#2f9e44',
        dark: '#2b8a3e',
        darkest: '#1b5e20'
      };
    case 'yellow':
      return {
        lightest: '#ffd43b',
        light: '#fcc419',
        main: '#fab005',
        dark: '#f59f00',
        darkest: '#e67700'
      };
    case 'purple':
      return {
        lightest: '#b197fc',
        light: '#9775fa',
        main: '#7950f2',
        dark: '#6741d9',
        darkest: '#4c2a85'
      };
    case 'orange':
      return {
        lightest: '#ffa94d',
        light: '#ff922b',
        main: '#fd7e14',
        dark: '#f76707',
        darkest: '#d9480f'
      };
    default:
      return {
        lightest: '#0274e6',
        light: '#0059b2',
        main: '#023f80',
        dark: '#023468',
        darkest: '#011e3f'
      };
  }
};

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes } = useTetrixStateContext();

  // Create initial shapes with colors once on mount
  const initialShapes = useMemo(() => {
    const emptyBlock = { color: makeColor(), isFilled: false };
    const filledBlock1 = { color: makeColor(), isFilled: true };
    const filledBlock2 = { color: makeColor(), isFilled: true };
    const filledBlock3 = { color: makeColor(), isFilled: true };

    // L-shape
    const lShape: Shape = [
      [filledBlock1, emptyBlock, emptyBlock],
      [filledBlock1, emptyBlock, emptyBlock],
      [filledBlock1, { ...filledBlock1 }, emptyBlock],
    ];

    // T-shape
    const tShape: Shape = [
      [emptyBlock, filledBlock2, emptyBlock],
      [filledBlock2, { ...filledBlock2 }, { ...filledBlock2 }],
      [emptyBlock, emptyBlock, emptyBlock],
    ];

    // Square
    const squareShape: Shape = [
      [filledBlock3, { ...filledBlock3 }, emptyBlock],
      [{ ...filledBlock3 }, { ...filledBlock3 }, emptyBlock],
      [emptyBlock, emptyBlock, emptyBlock],
    ];

    return [lShape, tShape, squareShape];
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
      <SavedShape shape={null} />
    </div>
  )
}

export default ShapeSelector;