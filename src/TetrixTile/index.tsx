import React, { useMemo, useCallback } from 'react';

import { BlockVisual } from '../BlockVisual';
import { useTetrixDispatchContext } from '../TetrixProvider';
import { Tile } from '../Tile';
import type { ColorName, TileAnimation, BlockTheme } from '../types';
import './TetrixTile.css';

type TetrixTileProps = {
  row: number;
  col: number;
  backgroundColor: string;
  blockIsFilled: boolean;
  blockColor: ColorName;
  isHovered: boolean;
  showShadow: boolean;
  shadowOpacity: number;
  activeAnimations: readonly TileAnimation[];
  theme: BlockTheme;
  showIcon: boolean;
  size?: number;
};

const TetrixTileComponent = ({
  row,
  col,
  backgroundColor,
  blockIsFilled,
  blockColor,
  isHovered: _isHovered,
  showShadow,
  shadowOpacity,
  activeAnimations,
  theme,
  showIcon,
  size,
}: TetrixTileProps): JSX.Element => {
  const dispatch = useTetrixDispatchContext();

  // Calculate current playing animations at mount time
  const currentTime = performance.now();
  const playingAnimations = useMemo(
    () => activeAnimations.filter(
      (anim) => currentTime >= anim.startTime && currentTime < anim.startTime + anim.duration,
    ),
    [activeAnimations, currentTime],
  );

  // Handle animation end to trigger cleanup
  const handleAnimationEnd = useCallback((animationId: string) => {
    dispatch({
      type: 'CLEANUP_TILE_ANIMATION',
      payload: { row, col, animationId },
    });
  }, [dispatch, row, col]);

  return (
    <Tile
      row={row}
      col={col}
      backgroundColor={backgroundColor as ColorName}
      className="tetrix-tile"
      isFilled={blockIsFilled}
    >
      <BlockVisual
        isFilled={blockIsFilled}
        color={blockColor}
        size={size}
        theme={theme}
        showIcon={showIcon}
      />

      {showShadow && (
        <div
          className="tetrix-tile-shadow"
          style={{
            '--shadow-opacity': shadowOpacity,
          } as React.CSSProperties}
        />
      )}

      {playingAnimations.map((anim) => {
        // Calculate delay: if startTime is in the future, we need to delay
        const delay = Math.max(0, anim.startTime - currentTime);

        // For quad animations, divide duration by beat count to get per-beat duration
        // and set the iteration count
        const style: React.CSSProperties & Record<string, string | number> = {
          '--animation-duration': `${anim.duration}ms`,
          '--animation-delay': `${delay}ms`,
        };

        if (anim.color) {
          style['--animation-color'] = anim.color;
        }

        if (anim.type === 'row-quad' || anim.type === 'column-quad') {
          const beatCount = anim.beatCount ?? 3;
          const finishDuration = anim.finishDuration ?? 0;
          const beatDuration = (anim.duration - finishDuration) / beatCount;

          style['--beat-count'] = beatCount;
          style['--animation-duration'] = `${beatDuration}ms`;
          style['--finish-duration'] = `${finishDuration}ms`;
        }

        return (
          <div
            key={anim.id}
            className={`tetrix-tile-clearing ${anim.type}`}
            style={style as React.CSSProperties}
            onAnimationEnd={() => handleAnimationEnd(anim.id)}
          />
        );
      })}
    </Tile>
  );
};

export const TetrixTile = React.memo(TetrixTileComponent);
