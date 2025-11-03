import { Block } from "../../utils/types";

export default function BlockVisual({ block }: { block: Block }): JSX.Element {
  // Don't render anything if the block is not filled to avoid black flash
  if (!block.isFilled) {
    return <></>;
  }

  return (
    <div
      style={{
        position: 'relative',
        top: -1,
        left: -1,
        transition: 'opacity 0.5s ease-in-out',
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
    >
    </div>
  )
}
