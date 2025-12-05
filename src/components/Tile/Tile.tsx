import React, { ReactNode } from 'react';
import type { ColorName } from '../../utils/types';
import ShapeIcon from '../ShapeIcon';
import { TileSvg } from './TileSvg';
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
  const hasCustomBackground = backgroundColor && backgroundColor !== 'grey';

  return (
    <div
      className={`tile-base ${className}`}
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
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <TileSvg color={backgroundColor} />
      </div>

      {hasCustomBackground && backgroundColor && (
        <div className="tile-icon-background">
          <ShapeIcon color={backgroundColor} size={20} opacity={0.3} useBorderLeftColor={true} />
        </div>
      )}
      {children}
    </div>
  );
};

export default React.memo(Tile);
