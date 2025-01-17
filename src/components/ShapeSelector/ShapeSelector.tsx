import ShapeOption from '../ShapeOption'
import SavedShape from '../SavedShape'
import type { Shape } from '../../utils/shape';

type ShapeSelectorProps = {
  nextShapes: Shape[];
  savedShape: Shape | null;
}

const ShapeSelector = ({ nextShapes, savedShape }: ShapeSelectorProps): JSX.Element => {

  const [shape1, shape2, shape3] = nextShapes;
  return (
    <div className="shape-selector">
      <ShapeOption shape={shape1} />
      <ShapeOption shape={shape2} />
      <ShapeOption shape={shape3} />
      <SavedShape shape={savedShape} />
    </div>
  )
}

export default ShapeSelector;