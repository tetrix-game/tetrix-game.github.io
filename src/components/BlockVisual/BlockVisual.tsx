import { Block } from "../../utils/types";

export default function BlockVisual({ block }: { block: Block }): JSX.Element {
  return (
    <div
      style={{
        transition: 'opacity 0.5s ease-in-out',
        zIndex: 2,
        backgroundColor: block.color.main,
        opacity: block.isFilled ? 1 : 0,
        width: '100%',
        height: '100%',
        borderTop: '15px solid ' + block.color.lightest,
        borderLeft: '15px solid ' + block.color.light,
        borderBottom: '15px solid ' + block.color.darkest,
        borderRight: '15px solid ' + block.color.dark,
      }}
    >
    </div>
  )
}
