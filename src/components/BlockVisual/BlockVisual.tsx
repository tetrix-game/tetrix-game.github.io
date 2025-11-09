import { Block } from "../../utils/types";

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
      style={{
        position: 'relative',
        top: '-1px',
        left: '-1px',
        zIndex: 2,
        backgroundColor: block.color.main,
        opacity: 1,
        width: 'calc(100% + 2px)',
        height: 'calc(100% + 2px)',
        borderTop: `${borderWidthPx} solid ${block.color.lightest}`,
        borderLeft: `${borderWidthPx} solid ${block.color.light}`,
        borderBottom: `${borderWidthPx} solid ${block.color.darkest}`,
        borderRight: `${borderWidthPx} solid ${block.color.dark}`,
        boxSizing: 'border-box',
      }}
    />
  )
}
