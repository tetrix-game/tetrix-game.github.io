import { Block } from "../../utils/types";

type BlockVisualProps = {
  block: Block;
  isHovered?: boolean;
  isSettling?: boolean;
};

export default function BlockVisual({ block, isHovered = false, isSettling = false }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled to avoid black flash
  if (!block.isFilled) {
    return <></>;
  }

  // During settling animation, transition from 50% to 100%
  const isSmall = isHovered && !isSettling;

  return (
    <div
      style={{
        position: 'relative',
        top: isSmall ? '25%' : '-1px',
        left: isSmall ? '25%' : '-1px',
        transition: 'opacity 0.5s ease-in-out, width 0.2s ease-out, height 0.2s ease-out, top 0.2s ease-out, left 0.2s ease-out',
        zIndex: 2,
        backgroundColor: block.color.main,
        opacity: 1,
        width: isSmall ? '50%' : 'calc(100% + 2px)',
        height: isSmall ? '50%' : 'calc(100% + 2px)',
        borderTop: '15px solid ' + block.color.lightest,
        borderLeft: '15px solid ' + block.color.light,
        borderBottom: '15px solid ' + block.color.darkest,
        borderRight: '15px solid ' + block.color.dark,
      }}
    >
    </div>
  )
}
