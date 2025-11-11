import { Block } from "../../utils/types";
import './BlockVisual.css';

type BlockVisualProps = {
  readonly block: Block;
};

export default function BlockVisual({ block }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled
  if (!block.isFilled) {
    return <></>;
  }

  return (
    <div className={`block-visual block-color-${block.color}`} />
  )
}
