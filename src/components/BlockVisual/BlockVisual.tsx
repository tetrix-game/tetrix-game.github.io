import { Block } from "../../utils/types";

export default function BlockVisual({ block }: { block: Block }): JSX.Element {
  return (
    <div
      style={{
        transition: 'opacity 0.5s ease-in-out',
        zIndex: 2,
        backgroundColor: block.isFilled ? block.color : '',
        opacity: block.isFilled ? 1 : 0,
        width: '100%',
        height: '100%',
        borderRadius: '5px'
      }}
    ></div>
  )
}
