import ShapeOption from '../ShapeOption'
import SavedShape from '../SavedShape'

const ShapeSelector = (): JSX.Element => {

  return (
    <div className="shape-selector">
      <ShapeOption />
      <ShapeOption />
      <ShapeOption />
      <SavedShape />
    </div>
  )
}

export default ShapeSelector;