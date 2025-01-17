
import type { Block } from "../../utils/shape";

type BlockVisualProps = { block: Block }

const BlockVisual = ({ block }: BlockVisualProps): JSX.Element => {
  return (
    <div style={{ backgroundColor: block.color, width: '100%', height: '100%', borderRadius: '5px' }}></div>
  )
}

export default BlockVisual;