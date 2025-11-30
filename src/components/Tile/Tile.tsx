import React, { ReactNode } from 'react';
import type { ColorName } from '../../utils/types';
import './Tile.css';

export interface TileProps {
  row: number;
  col: number;
  backgroundColor?: ColorName;
  opacity?: number;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Tile: React.FC<TileProps> = ({
  row,
  col,
  backgroundColor,
  opacity = 1,
  onClick,
  onMouseEnter,
  onMouseDown,
  children,
  className = '',
  style = {},
}) => {
  // Determine tile variant (dark vs light) - only if no custom background color
  const dark = (row + col) % 2 === 0;
  const hasCustomBackground = backgroundColor && backgroundColor !== 'grey';

  const tileClass = `tile-base ${hasCustomBackground
      ? `tile-base-custom color-bg-${backgroundColor}`
      : (dark ? 'tile-base-dark' : 'tile-base-light')
    } ${className}`;

  return (
    <div
      className={tileClass}
      style={{
        gridColumn: col,
        gridRow: row,
        opacity,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
};

export default React.memo(Tile);
