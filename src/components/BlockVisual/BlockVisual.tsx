import { Block } from "../../utils/types";

type BlockVisualProps = {
  block: Block;
  isHovered?: boolean;
};

export default function BlockVisual({ block, isHovered = false }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled to avoid black flash
  if (!block.isFilled) {
    return <></>;
  }

  return (
    <div
      style={{
        position: 'relative',
        top: isHovered ? '25%' : '-1px',
        left: isHovered ? '25%' : '-1px',
        transition: 'opacity 0.5s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, top 0.3s ease-in-out, left 0.3s ease-in-out',
        zIndex: 2,
        backgroundColor: block.color.main,
        opacity: 1,
        width: isHovered ? '50%' : 'calc(100% + 2px)',
        height: isHovered ? '50%' : 'calc(100% + 2px)',
        borderTop: '15px solid ' + block.color.lightest,
        borderLeft: '15px solid ' + block.color.light,
        borderBottom: '15px solid ' + block.color.darkest,
        borderRight: '15px solid ' + block.color.dark,
      }}
    >
    </div>
  )
}
