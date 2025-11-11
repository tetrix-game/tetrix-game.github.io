import { Block } from "../../utils/types";
import './BlockVisual.css';

type BlockVisualProps = {
  readonly block: Block;
  readonly borderWidth?: number;
};

export default function BlockVisual({ block, borderWidth = 12.5 }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled
  if (!block.isFilled) {
    return <></>;
  }

  const borderWidthPx = `${borderWidth}px`;

  return (
    <div
      className="block-visual"
      style={{
        backgroundColor: block.color.main,
        borderTop: `${borderWidthPx} solid ${block.color.lightest}`,
        borderLeft: `${borderWidthPx} solid ${block.color.light}`,
        borderBottom: `${borderWidthPx} solid ${block.color.darkest}`,
        borderRight: `${borderWidthPx} solid ${block.color.dark}`,
      }}
    />
  )
}
