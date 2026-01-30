import React from 'react';

import { Shared_BlockVisual } from '../../../../Shared/BlockVisual';
import { Shared_Tile } from '../../../../Shared/Tile';
import { Shared_core } from '../../../types/core';
import './EditorGridTile.css';

type Block = Shared_core['Block'];
type ColorName = Shared_core['ColorName'];
type Location = Shared_core['Location'];

type EditorGridTileProps = {
  location: Location;
  block: Block;
  backgroundColor: ColorName;
  size?: number;
  editorColor?: ColorName;
  tileExists?: boolean;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
};

const EditorGridTileComponent: React.FC<EditorGridTileProps> = ({
  location,
  block,
  backgroundColor,
  size,
  editorColor,
  tileExists = true,
  onClick,
  onMouseEnter,
  onMouseDown,
}) => {
  // Determine tile opacity in editor mode - dim tiles that don't exist
  const tileOpacity = !tileExists ? 0.2 : 1;

  return (
    <Shared_Tile
      row={location.row}
      col={location.column}
      backgroundColor={backgroundColor}
      opacity={tileOpacity}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className="editor-grid-tile"
      style={{ cursor: 'pointer' }}
    >
      <Shared_BlockVisual isFilled={block.isFilled} color={block.color} size={size} />

      {editorColor && (
        <div className={`editor-grid-tile-overlay color-${editorColor}`} />
      )}
    </Shared_Tile>
  );
};

export const EditorGridTile = React.memo(EditorGridTileComponent);
