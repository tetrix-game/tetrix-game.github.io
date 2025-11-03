import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useCallback } from 'react';

const shapeContainerCss = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 30px)',
  gridTemplateRows: 'repeat(3, 30px)',
  gap: '2px',
  padding: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
};

const ShapeOption = ({ shape, shapeIndex }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();

  const handleClick = useCallback(() => {
    dispatch({ type: 'SELECT_SHAPE', value: { shape, shapeIndex } });
  }, [dispatch, shape, shapeIndex]);

  return (
    <div
      style={shapeContainerCss}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      {shape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              position: 'relative',
            }}
          >
            <BlockVisual block={block} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;