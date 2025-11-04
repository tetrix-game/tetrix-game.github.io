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

  // During settling animation, blocks grow from 50% to 100%
  const isSmall = isHovered && !isSettling;
  const shouldAnimateGrow = isHovered && isSettling;

  return (
    <div
      style={{
        position: 'relative',
        top: isSmall ? '25%' : '-1px',
        left: isSmall ? '25%' : '-1px',
        zIndex: 2,
        backgroundColor: block.color.main,
        opacity: 1,
        width: isSmall ? '50%' : 'calc(100% + 2px)',
        height: isSmall ? '50%' : 'calc(100% + 2px)',
        borderTop: '15px solid ' + block.color.lightest,
        borderLeft: '15px solid ' + block.color.light,
        borderBottom: '15px solid ' + block.color.darkest,
        borderRight: '15px solid ' + block.color.dark,
        animation: shouldAnimateGrow ? 'growBlock 0.2s ease-out' : 'none',
      }}
    >
      <style>{`
        @keyframes growBlock {
          from {
            width: 50%;
            height: 50%;
            top: 25%;
            left: 25%;
          }
          to {
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            top: -1px;
            left: -1px;
          }
        }
      `}</style>
    </div>
  )
}
