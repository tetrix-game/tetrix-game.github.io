import './ShapeOption.css';
import type { Block } from '../../utils/types';

const shapeContainerCss = {

};

type ShapeOptionProps = {
  shape: Block[][];
};

const ShapeOption = ({ shape }: ShapeOptionProps) => {
  // Who's responsible for maintaining the state for the location of the shape that may or may not be dragged at any given time?
  // position: { x: number, y: number }
  // whether the shape fits in the grid location it's hovering over
  // isBeingDragged: boolean
  // isOverGrid: boolean
  // isOverSavedShape: boolean
  // I need a center point from which the shape gets built
  // The center point needs to be calculated based on the size of the shape
  // Taller shapes will have a higher center point
  // Shapes of an odd width will have a center point that is not in the middle of the shape
  // Shapes of an even width will have a center point that is in the middle of the shape
  // The center point will be the point that matters when determining if the shape is inside the saveShape

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