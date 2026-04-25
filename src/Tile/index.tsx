import React, { ReactNode } from 'react';

import { ShapeIcon } from '../ShapeIcon';
import { TileSvg } from '../TileSvg';
import type { ColorName } from '../types';
import './Tile.css';

interface TileProps {
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
  isFilled?: boolean;
}

const TileComponent: React.FC<TileProps> = ({
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
  isFilled = false,
  ...rest
}) => {
  const hasCustomBackground = backgroundColor && backgroundColor !== 'grey';

  return (
    <div
      className={`tile-base ${hasCustomBackground ? 'tile-base-custom' : ''} ${isFilled ? 'filled' : ''} ${className}`}
      data-testid={`tile-R${row}C${col}`}
      style={{
        gridColumn: col + 1,
        gridRow: row + 1,
        opacity,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      {...rest}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <TileSvg color={backgroundColor} />
      </div>

      {hasCustomBackground && backgroundColor && (
        <div className="tile-icon-background">
          <ShapeIcon
            color={backgroundColor}
            size={20}
            opacity={0.3}
            useBorderLeftColor={true}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export const Tile = React.memo(TileComponent);
