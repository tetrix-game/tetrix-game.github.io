import React, { useState, useEffect } from 'react';
import Tile from '../Tile/Tile';
import BlockVisual from '../BlockVisual';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import type { Tile as TileType, Block, Location } from '../../utils/types';
import './TetrixTile.css';

type TetrixTileProps = {
  tile: TileType;
  location: Location;
  isHovered?: boolean;
  hoveredBlock?: Block;
  onClick?: () => void;
  size?: number;
}

const TetrixTile = ({ tile, location, isHovered = false, hoveredBlock, onClick, size }: TetrixTileProps) => {
  const { dragState, tiles, blockTheme, showBlockIcons, gameMode } = useTetrixStateContext();
  const [, setTick] = useState(0);

  // Force re-render on animation frame to track animation timing
  useEffect(() => {
    const tileKey = tile.position;
    const tileData = tiles.get(tileKey);

    if (!tileData?.activeAnimations || tileData.activeAnimations.length === 0) {
      return;
    }

    let rafId: number;
    const animate = () => {
      setTick(t => t + 1);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [tiles, tile.position]);

  // Get active animations for this tile
  const tileKey = tile.position;
  const tileData = tiles.get(tileKey);
  const activeAnimations = tileData?.activeAnimations || [];

  // Filter to only currently-playing animations
  const currentTime = performance.now();
  const playingAnimations = activeAnimations.filter(
    anim => currentTime >= anim.startTime && currentTime < anim.startTime + anim.duration
  );

  // Show a shadow overlay when hovering
  const showShadow = isHovered && hoveredBlock;

  // Calculate shadow opacity: 70% for valid placement, 40% for invalid
  let shadowOpacity = 0;
  if (showShadow) {
    shadowOpacity = dragState.isValidPlacement ? 0.7 : 0.4;
  }

  return (
    <Tile
      row={location.row}
      col={location.column}
      backgroundColor={tile.backgroundColor}
      onClick={onClick}
      className="tetrix-tile"
    >
      <BlockVisual 
        block={tile.block} 
        size={size} 
        theme={blockTheme} 
        showIcon={gameMode === 'daily' || showBlockIcons}
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

export default React.memo(TetrixTile);
