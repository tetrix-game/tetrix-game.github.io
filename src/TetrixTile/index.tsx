import React, { useState, useEffect, useMemo } from 'react';

import { BlockVisual } from '../BlockVisual';
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
  animationsJson: string;
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
  animationsJson,
  theme,
  showIcon,
  size,
}: TetrixTileProps): JSX.Element => {
  const [, setTick] = useState(0);

  const activeAnimations = useMemo((): TileAnimation[] => {
    try {
      return JSON.parse(animationsJson) as TileAnimation[];
    } catch {
      return [];
    }
  }, [animationsJson]);

  // Force re-render on animation frame to track animation timing
  useEffect((): (() => void) | void => {
    if (!activeAnimations || activeAnimations.length === 0) {
      return;
    }

    let rafId: number;
    const animate = (): void => {
      setTick((t) => t + 1);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return (): void => cancelAnimationFrame(rafId);
  }, [activeAnimations]);

  // Filter to only currently-playing animations
  const currentTime = performance.now();
  const playingAnimations = activeAnimations.filter(
    (anim) => currentTime >= anim.startTime && currentTime < anim.startTime + anim.duration,
  );

  return (
    <Tile
      row={row}
      col={col}
      backgroundColor={backgroundColor as ColorName}
      className="tetrix-tile"
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
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);

        // Calculate delay: if startTime is in the future, we need to delay
        const delay = Math.max(0, anim.startTime - currentTime);

        // For quad animations, divide duration by beat count to get per-beat duration
        // and set the iteration count
        const style: React.CSSProperties & Record<string, string | number> = {
          '--animation-progress': progress,
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
          />
        );
      })}
    </Tile>
  );
};

export const TetrixTile = React.memo(TetrixTileComponent);
