// A shape is a 4X4 grid of boolean values that represent a shape
// 0,0 is the top left corner
// 0, 3 is the top right corner
// 3, 0 is the bottom left corner
// 4, 4 is the bottom right corner
export type Shape = Block[][];
export type Location = { row: number, column: number }
export type ColorName = 'grey' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
export type Block = {
  color: ColorName;
  isFilled: boolean;
  customAttribute?: string;
}
export type Tile = {
  id: string;
  location: Location;
  block: Block
}

// Tile data stored in the Set with keyed access (e.g., 'R1C1', 'R2C5')
export type TileData = {
  isFilled: boolean;
  color: ColorName;
}

// Set of tile keys with their data
export type TilesSet = Map<string, TileData>;

// Drag phase-based animation system
export type DragPhase = 'none' | 'picking-up' | 'dragging' | 'placing' | 'returning';

export type DragState = {
  phase: DragPhase;
  selectedShape: Shape | null;
  selectedShapeIndex: number | null;
  isValidPlacement: boolean;
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
  invalidBlockPositions: Array<{ shapeRow: number; shapeCol: number }>; // Blocks that don't fit
  sourcePosition: { x: number; y: number; width: number; height: number } | null; // ShapeOption bounds
  targetPosition: { x: number; y: number } | null; // Grid cell position for placement
  placementLocation: Location | null; // Locked-in grid location at release time
  startTime: number | null;
};

// Legacy animation states (keep for shape removal and creation)
export type ShapeRemovalAnimationState = 'none' | 'removing';
export type ShapeCreationAnimationState = 'none' | 'animating-in';

// Bounds for shape options (for return animation)
export type ShapeOptionBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

// Scoring system types
export type ScoreData = {
  rowsCleared: number;
  columnsCleared: number;
  pointsEarned: number;
};

// Game persistence data (legacy - for backward compatibility)
export type GamePersistenceData = {
  score: number;
  tiles: Tile[]; // Keep as array for backward compatibility
  nextShapes: Shape[];
  savedShape: Shape | null;
};

// Granular persistence types
export type ScorePersistenceData = {
  score: number;
  lastUpdated: number;
};

export type TilesPersistenceData = {
  tiles: Array<{ key: string; data: TileData }>; // Serialized from Map
  lastUpdated: number;
};

export type ShapesPersistenceData = {
  nextShapes: Shape[];
  savedShape: Shape | null;
  lastUpdated: number;
};

export type MusicPersistenceData = {
  isMuted: boolean;
  lastUpdated: number;
};

export type SoundEffectsPersistenceData = {
  isMuted: boolean;
  lastUpdated: number;
};

export type GameSettingsPersistenceData = {
  music: MusicPersistenceData;
  soundEffects: SoundEffectsPersistenceData;
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};

// Game state types - simplified for level-based play
export type GameState = 'playing' | 'map';

// Reducer types
export type TetrixReducerState = {
  // Game state management - simplified
  gameState: GameState;
  currentLevel: number; // Current level being played
  isMapUnlocked: boolean; // Whether map has been unlocked

  tiles: TilesSet; // Keyed tile storage for O(1) lookup
  nextShapes: Shape[];
  savedShape: Shape | null;
  mouseGridLocation: Location | null;
  mousePosition: { x: number; y: number }; // Never null - always has a position
  gemIconPosition: { x: number; y: number }; // Position of the score display gem icon
  gridTileSize: number | null;
  gridBounds: { top: number; left: number; width: number; height: number } | null;
  // Unified drag animation state with all drag-related properties
  dragState: DragState;
  // Shape removal animation
  removingShapeIndex: number | null;
  shapeRemovalAnimationState: ShapeRemovalAnimationState;
  // Shape creation animation
  newShapeAnimationStates: ShapeCreationAnimationState[]; // Track animation state for each shape
  // Bounds of each shape option for return animation
  shapeOptionBounds: (ShapeOptionBounds | null)[];
  // Scoring system
  score: number;
  totalLinesCleared: number; // Track total lines cleared for objectives
  // Coin display visibility control
  showCoinDisplay: boolean;
  // Shape queue configuration
  queueSize: number; // Total shapes available (-1 = infinite)
  shapesUsed: number; // Track how many shapes have been used (for finite mode)

  // Rotation menu visibility per shape
  openRotationMenus: boolean[]; // Track which shape rotation menus are open
  // Background music trigger
  hasPlacedFirstShape: boolean; // Track if first shape has been placed to trigger background music
  // Turning mode state (subset of 'playing' state)
  isTurningModeActive: boolean; // Whether turning mode is currently active
  turningDirection: 'cw' | 'ccw' | null; // Which direction turning is active for
  isDoubleTurnModeActive: boolean; // Whether double turn mode is currently active
  // Modifier system
  unlockedModifiers: Set<number>; // Set of prime IDs that have been unlocked
}

type SelectShapeAction = {
  type: 'SELECT_SHAPE';
  value: {
    shapeIndex: number;
  };
}

type UpdateMouseLocationAction = {
  type: 'UPDATE_MOUSE_LOCATION';
  value: {
    location: Location | null;
    position?: { x: number; y: number } | null;
    tileSize?: number | null;
    gridBounds?: { top: number; left: number; width: number; height: number } | null;
    isValid?: boolean; // Whether the current placement is valid
    invalidBlocks?: Array<{ shapeRow: number; shapeCol: number }>; // Blocks that don't fit
  };
}

type PlaceShapeAction = {
  type: 'PLACE_SHAPE';
  value: {
    location: Location;
    mousePosition?: { x: number; y: number };
  };
}

type CompletePlacementAction = {
  type: 'COMPLETE_PLACEMENT';
}

type StartShapeRemovalAction = {
  type: 'START_SHAPE_REMOVAL';
  value: { shapeIndex: number };
}

type CompleteShapeRemovalAction = {
  type: 'COMPLETE_SHAPE_REMOVAL';
}
type ClearSelectionAction = {
  type: 'CLEAR_SELECTION';
}

type SetAvailableShapesAction = {
  type: 'SET_AVAILABLE_SHAPES';
  value: { shapes: Shape[] };
}

type SetShapeOptionBoundsAction = {
  type: 'SET_SHAPE_OPTION_BOUNDS';
  value: { index: number; bounds: ShapeOptionBounds };
}

type ReturnShapeToSelectorAction = {
  type: 'RETURN_SHAPE_TO_SELECTOR';
}

type CompleteReturnAction = {
  type: 'COMPLETE_RETURN';
}

type AddScoreAction = {
  type: 'ADD_SCORE';
  value: {
    scoreData: ScoreData;
    mousePosition?: { x: number; y: number };
  };
}

type LoadGameStateAction = {
  type: 'LOAD_GAME_STATE';
  value: { gameData: GamePersistenceData };
}

type ResetGameAction = {
  type: 'RESET_GAME';
}

type ShowCoinDisplayAction = {
  type: 'SHOW_COIN_DISPLAY';
}

type HideCoinDisplayAction = {
  type: 'HIDE_COIN_DISPLAY';
}

type RotateShapeAction = {
  type: 'ROTATE_SHAPE';
  value: { shapeIndex: number; clockwise: boolean };
}

type SpendCoinAction = {
  type: 'SPEND_COIN';
  value: {
    shapeIndex: number;
    mousePosition?: { x: number; y: number };
  };
}

type AddShapeOptionAction = {
  type: 'ADD_SHAPE_OPTION';
}

type RemoveShapeOptionAction = {
  type: 'REMOVE_SHAPE_OPTION';
}

type SetLevelAction = {
  type: 'SET_LEVEL';
  value: { levelIndex: number };
}

type OpenMapAction = {
  type: 'OPEN_MAP';
}

type CloseMapAction = {
  type: 'CLOSE_MAP';
}

type UnlockMapAction = {
  type: 'UNLOCK_MAP';
}

type UnlockModifierAction = {
  type: 'UNLOCK_MODIFIER';
  value: { primeId: number };
}

type LoadModifiersAction = {
  type: 'LOAD_MODIFIERS';
  value: { unlockedModifiers: Set<number> };
}

type TriggerBackgroundMusicAction = {
  type: 'TRIGGER_BACKGROUND_MUSIC';
}

type ActivateTurningModeAction = {
  type: 'ACTIVATE_TURNING_MODE';
  value: { direction: 'cw' | 'ccw' };
}

type DeactivateTurningModeAction = {
  type: 'DEACTIVATE_TURNING_MODE';
}

type ActivateDoubleTurnModeAction = {
  type: 'ACTIVATE_DOUBLE_TURN_MODE';
}

type DeactivateDoubleTurnModeAction = {
  type: 'DEACTIVATE_DOUBLE_TURN_MODE';
}

type GenerateSuperComboPatternAction = {
  type: 'GENERATE_SUPER_COMBO_PATTERN';
}

type UpdateGemIconPositionAction = {
  type: 'UPDATE_GEM_ICON_POSITION';
  value: { x: number; y: number };
}

type DebugFillRowAction = {
  type: 'DEBUG_FILL_ROW';
  value: { row: number; excludeColumn: number; color: ColorName };
}

type DebugFillColumnAction = {
  type: 'DEBUG_FILL_COLUMN';
  value: { column: number; excludeRow: number; color: ColorName };
}

type DebugRemoveBlockAction = {
  type: 'DEBUG_REMOVE_BLOCK';
  value: { location: Location };
}

type DebugAddBlockAction = {
  type: 'DEBUG_ADD_BLOCK';
  value: { location: Location; color: ColorName };
}

type DebugClearAllAction = {
  type: 'DEBUG_CLEAR_ALL';
}

type DebugReplaceFirstShapeAction = {
  type: 'DEBUG_REPLACE_FIRST_SHAPE';
  value: { shape: Shape };
}

export type TetrixAction =
  | SelectShapeAction
  | UpdateMouseLocationAction
  | PlaceShapeAction
  | CompletePlacementAction
  | StartShapeRemovalAction
  | CompleteShapeRemovalAction
  | ClearSelectionAction
  | SetAvailableShapesAction
  | SetShapeOptionBoundsAction
  | ReturnShapeToSelectorAction
  | CompleteReturnAction
  | AddScoreAction
  | LoadGameStateAction
  | ResetGameAction
  | ShowCoinDisplayAction
  | HideCoinDisplayAction
  | RotateShapeAction
  | SpendCoinAction
  | AddShapeOptionAction
  | RemoveShapeOptionAction
  | SetLevelAction
  | OpenMapAction
  | CloseMapAction
  | UnlockMapAction
  | UnlockModifierAction
  | LoadModifiersAction
  | TriggerBackgroundMusicAction
  | ActivateTurningModeAction
  | DeactivateTurningModeAction
  | ActivateDoubleTurnModeAction
  | DeactivateDoubleTurnModeAction
  | GenerateSuperComboPatternAction
  | UpdateGemIconPositionAction
  | DebugFillRowAction
  | DebugFillColumnAction
  | DebugRemoveBlockAction
  | DebugAddBlockAction
  | DebugClearAllAction
  | DebugReplaceFirstShapeAction;

export type TetrixDispatch = React.Dispatch<TetrixAction>;

// Modifier system types
export type GameModifier = {
  id: number; // Prime number ID
  name: string;
  description: string;
  primeId: number; // The prime number that serves as the identifier
  unlocked: boolean; // Whether the player has unlocked this modifier
  active: boolean; // Whether the modifier is currently active
};

export type ModifierUnlockState = {
  unlockedModifiers: Set<number>; // Set of prime IDs that have been unlocked
};