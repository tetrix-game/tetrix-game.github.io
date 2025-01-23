import { Shape } from "../../utils/types";

type SavedShapeProps = {
  shape: Shape | null;
}

const SavedShape = ({ shape }: SavedShapeProps) => {
  if (shape) {
    return 'shape placeholder';
  }

  return <div>shape placeholder</div>
}

export default SavedShape;