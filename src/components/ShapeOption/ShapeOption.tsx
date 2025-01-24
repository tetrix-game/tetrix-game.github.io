import './ShapeOption.css';
import type { Block } from '../../utils/types';

const shapeContainerCss = {

};

type ShapeOptionProps = {
  shape: Block[][];
};

const ShapeOption = ({ shape = [] }: ShapeOptionProps) => {
  return (
    <div
      style={shapeContainerCss}
    >
      {shape.map((row, rowIndex) => (
        <div key={rowIndex}>
          {row.map((block, colIndex) => (
            <div key={colIndex} className={`block ${block.color}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default ShapeOption;