import { Block } from "../../utils/types";
import './BlockVisual.css';

type BlockVisualProps = {
  readonly block: Block;
  readonly size?: number;
};

export default function BlockVisual({ block, size }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled
  if (!block.isFilled) {
    return <></>;
  }

  const style: React.CSSProperties & Record<string, any> = {};
  if (size !== undefined) {
    style['--block-border-width'] = `${size * 0.2}px`;
    style['--block-shadow-inset'] = `${size * 0.5}px`;
  }

  return (
    <div className={`block-visual block-color-${block.color}`} style={style} />
  )
}
