
import type { Block } from "../../utils/types";

type BlockVisualProps = { block: Block }

const BlockVisual = ({ block }: BlockVisualProps): JSX.Element => {
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

export default BlockVisual;