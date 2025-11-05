import { Block } from "../../utils/types";

type BlockVisualProps = {
  readonly block: Block;
};

export default function BlockVisual({ block }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled
  if (!block.isFilled) {
    return <></>;
  }

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
        borderTop: '15px solid ' + block.color.lightest,
        borderLeft: '15px solid ' + block.color.light,
        borderBottom: '15px solid ' + block.color.darkest,
        borderRight: '15px solid ' + block.color.dark,
      }}
    />
  )
}
