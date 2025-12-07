import React from 'react';
import ShapeIcon from "../ShapeIcon";
import { BlockSvg } from "./BlockSvg";
import { BlockTheme } from "../../types";
import './BlockVisual.css';

type BlockVisualProps = {
  readonly isFilled: boolean;
  readonly color: string;
  readonly size?: number;
  readonly theme?: BlockTheme;
  readonly showIcon?: boolean;
};

function BlockVisual({ isFilled, color, size, theme = 'gem', showIcon = true }: BlockVisualProps): JSX.Element {
  // Don't render anything if the block is not filled
  if (!isFilled) {
    return <></>;
  }

  const style: React.CSSProperties & Record<string, any> = {};
  if (size !== undefined) {
    style['--block-border-width'] = `${size * 0.2}px`;
    style['--block-shadow-inset'] = `${size * 0.5}px`;
  }

  // Calculate icon size: 60% of block size, or default 24px if size not provided
  const iconSize = size !== undefined ? size * 0.6 : 24;

  return (
    <div className="block-visual" style={style}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <BlockSvg color={color} theme={theme} />
      </div>
      {showIcon && (
        <div className="block-icon-container" style={{ position: 'relative', zIndex: 1 }}>
          <ShapeIcon color={color} size={iconSize} opacity={1.0} useBorderLeftColor={true} />
        </div>
      )}
    </div>
  )
}

export default React.memo(BlockVisual);
