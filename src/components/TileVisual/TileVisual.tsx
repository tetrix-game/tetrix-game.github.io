import './TileVisual.css';
import type { Tile, Block } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React, { useState, useEffect } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';

type TileVisualProps = {
  tile: Tile;
  isHovered?: boolean;
  hoveredBlock?: Block;
  onClick?: () => void;
}

const TileVisual = ({ tile, isHovered = false, hoveredBlock, onClick }: TileVisualProps) => {
  const { dragState, tiles } = useTetrixStateContext();
  const [, setTick] = useState(0);

  // Force re-render on animation frame to track animation timing
  useEffect(() => {
    const tileKey = `R${tile.location.row}C${tile.location.column}`;
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
  }, [tiles, tile.location.row, tile.location.column]);

  // Get active animations for this tile
  const tileKey = `R${tile.location.row}C${tile.location.column}`;
  const tileData = tiles.get(tileKey);
  const activeAnimations = tileData?.activeAnimations || [];

  // Filter to only currently-playing animations
  const currentTime = performance.now();
  const playingAnimations = activeAnimations.filter(
    anim => currentTime >= anim.startTime && currentTime < anim.startTime + anim.duration
  );

  // Fixed border width for consistent grid sizing
  // Always display the actual tile block
  const displayBlock = tile.block;

  // Show a shadow overlay when hovering
  const showShadow = isHovered && hoveredBlock;

  // Determine tile variant (dark vs light)
  const dark = (tile.location.row + tile.location.column) % 2 === 0;
  const tileClass = `tile-visual ${dark ? 'tile-visual-dark' : 'tile-visual-light'}`;

  // Calculate shadow opacity: 70% for valid placement, 40% for invalid
  let shadowOpacity = 0;
  if (showShadow) {
    shadowOpacity = dragState.isValidPlacement ? 0.7 : 0.4;
  }

  return (
    <div
      className={tileClass}
      style={{
        gridColumn: tile.location.column,
        gridRow: tile.location.row,
      }}
      onClick={onClick}
    >
      <BlockVisual block={displayBlock} />
      {showShadow && (
        <div
          className="tile-visual-shadow"
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

        return (
          <div
            key={anim.id}
            className={`tile-visual-clearing ${anim.type}`}
            style={{
              '--animation-progress': progress,
              '--animation-duration': `${anim.duration}ms`,
              '--animation-delay': `${delay}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  )
}

export default React.memo(TileVisual);