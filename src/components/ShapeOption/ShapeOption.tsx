import './ShapeOption.css';

const ShapeOption = ({ shape, onTouchStart }) => {
  return (
    <div
      className={`shape-option`}
      onTouchStart={onTouchStart}
    >
    </div>
  )
}

export default ShapeOption;