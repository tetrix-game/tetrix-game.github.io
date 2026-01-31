/**
 * types - All type definitions for the Tetrix game
 *
 * This module consolidates all type definitions to comply with architecture rules.
 * Sections: core, gameState, animation, drag, theme, persistence, scoring, shapeQueue, stats
 */

// ============================================================================
// CORE TYPES - Basic building blocks (Block, Tile, Shape, Location)
// ============================================================================

// A shape is a 4X4 grid of blocks
// 0,0 is the top left corner
// 0, 3 is the top right corner
// 3, 0 is the bottom left corner
// 3, 3 is the bottom right corner
export type Shape = Block[][];

// A queued shape wraps a Shape with a unique ID for React key stability
// This enables proper queue animations where shapes slide in sequence
export type QueuedShape = {
  id: number; // Unique monotonically increasing ID for React key
  shape: Shape;
  type: 'shape';
};

// A purchasable slot that takes up space in the queue until purchased
export type PurchasableSlot = {
  id: number; // Unique monotonically increasing ID for React key
  type: 'purchasable-slot';
  cost: number; // Points required to purchase this slot
  slotNumber: number; // Which slot this is (2, 3, or 4)
};

// Union type for items in the queue - can be either a shape or a purchasable slot
export type QueueItem = QueuedShape | PurchasableSlot;

export type Location = { row: number; column: number };

export type ColorName = 'grey' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type Block = {
  color: ColorName;
  isFilled: boolean;
  customAttribute?: string;
};

// Animation instance running on a tile
export type TileAnimation = {
  id: string; // Unique ID for this animation instance
  type: 'row-cw' | 'row-double' | 'row-triple' | 'row-quad' | 'column-ccw' | 'column-double' | 'column-triple' | 'column-quad' | 'full-board-columns' | 'full-board-rows';
  startTime: number; // Performance.now() timestamp when animation should start
  duration: number; // Animation duration in milliseconds
  // Optional config for beating heart animations (quad)
  beatCount?: number; // Number of heartbeats
  finishDuration?: number; // Duration of the shrink/fade out phase
  color?: string; // Optional color override for the animation border
};

// Self-contained tile data structure
export type Tile = {
  position: string; // Position string in format "R1C1"
  backgroundColor: ColorName; // Background color of the tile itself
  block: Block; // Block data (what's placed on this tile)
  activeAnimations: TileAnimation[]; // Active animations running on this tile
};

// Serialized tile data for persistence (same as Tile for now, but keeping separate for clarity if needed)
export type TileData = {
  position: string;
  backgroundColor?: ColorName;
  isFilled: boolean;
  color: ColorName;
  activeAnimations?: TileAnimation[];
};

// Set of tile keys with their data
export type TilesSet = Map<string, Tile>;

// Helper to convert TilesSet to array for serialization
function tilesToArray(tiles: TilesSet): TileData[] {
  return Array.from(tiles.values()).map((tile) => ({
    position: tile.position,
    backgroundColor: tile.backgroundColor,
    isFilled: tile.block.isFilled,
    color: tile.block.color,
    activeAnimations: tile.activeAnimations,
  }));
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

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

// ============================================================================
// DRAG TYPES
// ============================================================================

// Drag phase-based animation system
export type DragPhase = 'none' | 'picking-up' | 'dragging' | 'placing' | 'returning';

// Pre-calculated offsets for drag operations - calculated once when shape is selected
export type DragOffsets = {
  visualOffsetX: number; // X offset from 4x4 center to filled blocks center
  visualOffsetY: number; // Y offset from 4x4 center to filled blocks center
  gridOffsetX: number; // X offset from mouse to 4x4 grid top-left corner
  gridOffsetY: number; // Y offset from mouse to 4x4 grid top-left corner
  touchOffset: number; // Y offset for mobile touch (shape above finger)
  tileSize: number; // Grid tile size at time of selection
  gridGap: number; // Gap between tiles at time of selection
};

export type DragState = {
  phase: DragPhase;
  selectedShape: Shape | null;
  selectedShapeIndex: number | null; // Deprecated: use sourceId instead
  sourceId: string | null; // Unique ID of the component that initiated the drag
  isValidPlacement: boolean;
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
  invalidBlockPositions: Array<{ shapeRow: number; shapeCol: number }>; // Blocks that don't fit
  sourcePosition: { x: number; y: number; width: number; height: number } | null; // ShapeOption bounds
  targetPosition: { x: number; y: number } | null; // Grid cell position for placement
  placementLocation: Location | null; // Locked-in grid location at release time
  placementStartPosition: { x: number; y: number } | null; // Where the shape was visually when placement started
  startTime: number | null;
  dragOffsets: DragOffsets | null; // Pre-calculated offsets for this drag operation
};

// ============================================================================
// GAMESTATE TYPES
// ============================================================================

// Game state types - simplified for level-based play
export type GameState = 'playing' | 'gameover';

// Game mode types - different play modes
export type GameMode = 'hub' | 'infinite' | 'daily' | 'tutorial';

// Reducer types
export type TetrixReducerState = {
  // Game state management - simplified
  gameState: GameState;
  gameMode: GameMode; // Current game mode (hub menu, infinite play, daily challenge, tutorial)
  currentLevel: number; // Current level being played
  isMapUnlocked: boolean; // Whether map has been unlocked

  // Map completion tracking
  mapCompletionResult: {
    stars: number;
    matchedTiles: number;
    totalTiles: number;
    missedTiles: number;
  } | null; // Set when level is completed, null otherwise
  targetTiles: Set<string> | null; // Tiles that should be filled for completion (from challenge data)

  tiles: TilesSet; // Keyed tile storage for O(1) lookup
  nextShapes: QueueItem[]; // Visible items in queue (shapes + purchasable slots), with unique IDs for React keys
  nextShapeIdCounter: number; // Monotonically increasing counter for unique shape IDs
  savedShape: Shape | null;

  // Shape slot progression
  unlockedSlots: Set<number>; // Set of unlocked shape slot numbers (1-4)
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
  stats: StatsPersistenceData; // Comprehensive statistics tracking
  // Coin display visibility control
  showCoinDisplay: boolean;
  // Shape queue configuration
  queueMode: QueueMode; // 'infinite' or 'finite'
  queueColorProbabilities: ColorProbability[]; // Color weights for shape generation
  queueHiddenShapes: Shape[]; // Shapes in queue but not visible (finite mode only)
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
  // Initialization tracking
  hasLoadedPersistedState: boolean; // Whether we've loaded persisted data (prevents gem shower on load)
  // Tile clearing animation - no longer needed in state, animations live in tiles

  // UI State
  isStatsOpen: boolean; // Whether the stats overlay is currently open
  isQueueOverlayOpen: boolean; // Whether the queue overlay is currently open
  insufficientFundsError: number | null; // Timestamp of last insufficient funds error
  buttonSizeMultiplier: number; // UI scaling: 0.5 to 1.5, default 1.0

  // Theme
  currentTheme: ThemeName; // Current theme selection
  blockTheme: BlockTheme; // Current block theme selection
  showBlockIcons: boolean; // Whether to show icons on blocks

  // Daily Challenge State
  initialDailyState: {
    tiles: TilesSet;
    shapes: Shape[];
  } | null;

  // Grandpa Mode - reduces Z and S shape frequency to 1/4
  grandpaMode: boolean;
};

type SelectShapeAction = {
  type: 'SELECT_SHAPE';
  value: {
    shapeIndex: number;
  };
};

type StartDragAction = {
  type: 'START_DRAG';
  value: {
    shape: Shape;
    sourceId: string;
    sourceBounds: { top: number; left: number; width: number; height: number };
    shapeIndex?: number; // Optional, for backward compatibility with ShapeSelector logic
  };
};

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
};

type PlaceShapeAction = {
  type: 'PLACE_SHAPE';
  value: {
    location: Location;
    mousePosition?: { x: number; y: number };
  };
};

type CompletePlacementAction = {
  type: 'COMPLETE_PLACEMENT';
};

type StartShapeRemovalAction = {
  type: 'START_SHAPE_REMOVAL';
  value: { shapeIndex: number };
};

type CompleteShapeRemovalAction = {
  type: 'COMPLETE_SHAPE_REMOVAL';
};

type ClearSelectionAction = {
  type: 'CLEAR_SELECTION';
};

type SetAvailableShapesAction = {
  type: 'SET_AVAILABLE_SHAPES';
  value: { shapes: Shape[] };
};

type InitializeQueueAction = {
  type: 'INITIALIZE_QUEUE';
  value: { items: QueueItem[] };
};

type SetShapeOptionBoundsAction = {
  type: 'SET_SHAPE_OPTION_BOUNDS';
  value: { index: number; bounds: ShapeOptionBounds };
};

type ReturnShapeToSelectorAction = {
  type: 'RETURN_SHAPE_TO_SELECTOR';
};

type CompleteReturnAction = {
  type: 'COMPLETE_RETURN';
};

type AddScoreAction = {
  type: 'ADD_SCORE';
  value: {
    scoreData: ScoreData;
    mousePosition?: { x: number; y: number };
  };
};

type LoadGameStateAction = {
  type: 'LOAD_GAME_STATE';
  value: {
    gameData: SavedGameState;
    stats?: StatsPersistenceData; // Optional stats
  };
};

type ResetGameAction = {
  type: 'RESET_GAME';
};

type ShowCoinDisplayAction = {
  type: 'SHOW_COIN_DISPLAY';
};

type HideCoinDisplayAction = {
  type: 'HIDE_COIN_DISPLAY';
};

type RotateShapeAction = {
  type: 'ROTATE_SHAPE';
  value: { shapeIndex: number; clockwise: boolean };
};

type SpendCoinAction = {
  type: 'SPEND_COIN';
  value: {
    shapeIndex: number;
    mousePosition?: { x: number; y: number };
  };
};

type AddShapeOptionAction = {
  type: 'ADD_SHAPE_OPTION';
};

type RemoveShapeOptionAction = {
  type: 'REMOVE_SHAPE_OPTION';
};

type SetLevelAction = {
  type: 'SET_LEVEL';
  value: { levelIndex: number };
};

type SetGameModeAction = {
  type: 'SET_GAME_MODE';
  value: { mode: GameMode };
};

type UnlockMapAction = {
  type: 'UNLOCK_MAP';
};

type UnlockModifierAction = {
  type: 'UNLOCK_MODIFIER';
  value: { primeId: number };
};

type LoadModifiersAction = {
  type: 'LOAD_MODIFIERS';
  value: { unlockedModifiers: Set<number> };
};

type LoadStatsAction = {
  type: 'LOAD_STATS';
  value: { stats: StatsPersistenceData };
};

type TriggerBackgroundMusicAction = {
  type: 'TRIGGER_BACKGROUND_MUSIC';
};

type ActivateTurningModeAction = {
  type: 'ACTIVATE_TURNING_MODE';
  value: { direction: 'cw' | 'ccw' };
};

type DeactivateTurningModeAction = {
  type: 'DEACTIVATE_TURNING_MODE';
};

type ActivateDoubleTurnModeAction = {
  type: 'ACTIVATE_DOUBLE_TURN_MODE';
};

type DeactivateDoubleTurnModeAction = {
  type: 'DEACTIVATE_DOUBLE_TURN_MODE';
};

type GenerateSuperComboPatternAction = {
  type: 'GENERATE_SUPER_COMBO_PATTERN';
};

type UpdateGemIconPositionAction = {
  type: 'UPDATE_GEM_ICON_POSITION';
  value: { x: number; y: number };
};

type DebugFillRowAction = {
  type: 'DEBUG_FILL_ROW';
  value: { row: number; excludeColumn: number; color: ColorName };
};

type DebugFillColumnAction = {
  type: 'DEBUG_FILL_COLUMN';
  value: { column: number; excludeRow: number; color: ColorName };
};

type DebugRemoveBlockAction = {
  type: 'DEBUG_REMOVE_BLOCK';
  value: { location: Location };
};

type DebugAddBlockAction = {
  type: 'DEBUG_ADD_BLOCK';
  value: { location: Location; color: ColorName };
};

type DebugReplaceFirstShapeAction = {
  type: 'DEBUG_REPLACE_FIRST_SHAPE';
  value: { shape: Shape };
};

type DebugIncrementStatsAction = {
  type: 'DEBUG_INCREMENT_STATS';
};

type CleanupAnimationsAction = {
  type: 'CLEANUP_ANIMATIONS';
};

type OpenStatsAction = {
  type: 'OPEN_STATS';
};

type CloseStatsAction = {
  type: 'CLOSE_STATS';
};

type InitializationCompleteAction = {
  type: 'INITIALIZATION_COMPLETE';
};

type SetThemeAction = {
  type: 'SET_THEME';
  value: { theme: ThemeName };
};

type SetBlockThemeAction = {
  type: 'SET_BLOCK_THEME';
  value: { theme: BlockTheme };
};

type SetShowBlockIconsAction = {
  type: 'SET_SHOW_BLOCK_ICONS';
  value: { show: boolean };
};

type SetButtonSizeMultiplierAction = {
  type: 'SET_BUTTON_SIZE_MULTIPLIER';
  value: { multiplier: number };
};

type SetQueueModeAction = {
  type: 'SET_QUEUE_MODE';
  value: { mode: QueueMode };
};

type UpdateColorProbabilitiesAction = {
  type: 'UPDATE_COLOR_PROBABILITIES';
  value: { colorProbabilities: ColorProbability[] };
};

type PopulateFiniteQueueAction = {
  type: 'POPULATE_FINITE_QUEUE';
  value: { shapes: Shape[] };
};

type ToggleQueueOverlayAction = {
  type: 'TOGGLE_QUEUE_OVERLAY';
};

type StartDailyChallengeAction = {
  type: 'START_DAILY_CHALLENGE';
  value: {
    tiles: TilesSet;
    shapes: Shape[];
  };
};

type RestartDailyChallengeAction = {
  type: 'RESTART_DAILY_CHALLENGE';
};

type CheckMapCompletionAction = {
  type: 'CHECK_MAP_COMPLETION';
};

type ClearMapCompletionAction = {
  type: 'CLEAR_MAP_COMPLETION';
};

type SetGrandpaModeAction = {
  type: 'SET_GRANDPA_MODE';
  value: { enabled: boolean };
};

type PurchaseShapeSlotAction = {
  type: 'PURCHASE_SHAPE_SLOT';
  value: { slotIndex: number }; // Index of the purchasable slot item in the queue
};

type StartSlotPurchaseRemovalAction = {
  type: 'START_SLOT_PURCHASE_REMOVAL';
  value: { slotIndex: number };
};

type CompleteSlotPurchaseRemovalAction = {
  type: 'COMPLETE_SLOT_PURCHASE_REMOVAL';
};

// Tile clearing actions removed - animations now live directly in TileData

export type TetrixAction = | SelectShapeAction
  | StartDragAction
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
  | SetGameModeAction
  | UnlockMapAction
  | UnlockModifierAction
  | LoadModifiersAction
  | LoadStatsAction
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
  | DebugReplaceFirstShapeAction
  | DebugIncrementStatsAction
  | CleanupAnimationsAction
  | OpenStatsAction
  | CloseStatsAction
  | InitializationCompleteAction
  | SetThemeAction
  | SetBlockThemeAction
  | SetShowBlockIconsAction
  | SetButtonSizeMultiplierAction
  | SetQueueModeAction
  | UpdateColorProbabilitiesAction
  | PopulateFiniteQueueAction
  | ToggleQueueOverlayAction
  | StartDailyChallengeAction
  | RestartDailyChallengeAction
  | CheckMapCompletionAction
  | ClearMapCompletionAction
  | SetGrandpaModeAction
  | PurchaseShapeSlotAction
  | StartSlotPurchaseRemovalAction
  | CompleteSlotPurchaseRemovalAction
  | InitializeQueueAction;

export type TetrixDispatch = React.Dispatch<TetrixAction>;

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================

// Serialized queue item for persistence
export type SerializedQueueItem = | { type: 'shape'; shape: Shape }
  | { type: 'purchasable-slot'; cost: number; slotNumber: number };

// Saved game state for persistence
// NOTE: isGameOver is intentionally NOT persisted - it's a derived state
// that gets recalculated on load based on actual board state.
export type SavedGameState = {
  version: string; // App version - saves from different versions are treated as corrupted
  score: number;
  tiles: TileData[];
  nextShapes: Shape[]; // Legacy field for backwards compatibility
  nextQueue?: SerializedQueueItem[]; // New field - full queue with shapes and purchasable slots
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: StatsPersistenceData;
  queueMode?: QueueMode;
  queueColorProbabilities?: ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  unlockedSlots?: number[]; // Array of unlocked shape slot numbers (1-4) for JSON serialization
  // isGameOver is NOT persisted - see gameStateReducer.ts LOAD_GAME_STATE
  lastUpdated: number;
};

export type MusicPersistenceData = {
  isMuted: boolean;
  volume: number; // 0-100
  isEnabled: boolean; // separate from volume level
  lastUpdated: number;
};

export type SoundEffectsPersistenceData = {
  isMuted: boolean;
  volume: number; // 0-100
  isEnabled: boolean; // separate from volume level
  lastUpdated: number;
};

export type GameSettingsPersistenceData = {
  music: MusicPersistenceData;
  soundEffects: SoundEffectsPersistenceData;
  debugUnlocked?: boolean;
  theme?: string; // Theme name
  blockTheme?: string; // Block theme name
  showBlockIcons?: boolean; // Whether to show icons on blocks
  buttonSizeMultiplier?: number; // UI scaling: 0.5 to 1.5, default 1.0
  grandpaMode?: boolean; // Reduce Z and S shape frequency to 1/4 normal rate
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};

// Load result type distinguishes between empty (new user) and error states
export type LoadResult<T> = | { status: 'success'; data: T }
  | { status: 'not_found' } // Valid: New user
  | { status: 'error'; error: Error }; // Critical: Do not overwrite!

// ============================================================================
// SCORING TYPES
// ============================================================================

export type ScoreData = {
  rowsCleared: number;
  columnsCleared: number;
  pointsEarned: number;
};

// ============================================================================
// SHAPEQUEUE TYPES
// ============================================================================

/**
 * Queue mode - determines how shapes are generated and stored
 * - infinite: Shapes generated on-demand, no queue storage
 * - finite: Fixed number of shapes, stored in queue
 */
export type QueueMode = 'infinite' | 'finite';

/**
 * Color probability weight
 * Higher numbers = more likely to appear
 * Total of all weights = denominator for probability calculation
 */
export type ColorProbability = {
  color: ColorName;
  weight: number; // Any positive number (e.g., 1000, 57, 2, etc.)
};

/**
 * Shape queue configuration
 */
export type ShapeQueueConfig = {
  mode: QueueMode;
  colorProbabilities: ColorProbability[]; // Array of colors and their weights
  totalShapes?: number; // Only used in finite mode (e.g., 20 shapes total)
};

/**
 * Shape queue state
 */
export type ShapeQueueState = {
  mode: QueueMode;
  colorProbabilities: ColorProbability[];
  hiddenShapes: Shape[]; // Shapes not currently visible (only in finite mode)
  totalShapes: number; // Total shapes in finite mode, -1 for infinite
};

/**
 * Default color probabilities - equal weight for all colors
 */
export const DEFAULT_COLOR_PROBABILITIES: ColorProbability[] = [
  { color: 'red', weight: 1 },
  { color: 'orange', weight: 1 },
  { color: 'yellow', weight: 1 },
  { color: 'green', weight: 1 },
  { color: 'blue', weight: 1 },
  { color: 'purple', weight: 1 },
];

// Facade export to match folder name
export const shapeQueue = {
  DEFAULT_COLOR_PROBABILITIES,
};

// ============================================================================
// STATS TYPES
// ============================================================================

export type StatCategory = | 'shapesPlaced'
  | 'linesCleared'
  | 'coloredLinesCleared'
  | 'rowsCleared'
  | 'doubleRows'
  | 'tripleRows'
  | 'quadrupleRows'
  | 'doubleRowsWithSingleColumns'
  | 'tripleRowsWithSingleColumns'
  | 'tripleRowsWithDoubleColumns'
  | 'quadrupleRowsWithSingleColumns'
  | 'columnsCleared'
  | 'doubleColumns'
  | 'tripleColumns'
  | 'quadrupleColumns'
  | 'doubleColumnsWithSingleRows'
  | 'tripleColumnsWithDoubleRows'
  | 'tripleColumnsWithSingleRows'
  | 'quadrupleColumnsWithSingleRows'
  | 'singleColumnBySingleRow'
  | 'doubleColumnByDoubleRow'
  | 'quadrupleRowByQuadrupleColumn';

export type ColorStat = {
  [key in ColorName]?: number;
};

export type StatValue = {
  total: number;
  colors: ColorStat;
};

export type GameStats = {
  [key in StatCategory]: StatValue;
};

export type StatsPersistenceData = {
  allTime: GameStats;
  highScore: GameStats; // Stores the highest single-game record for each stat
  current: GameStats;
  lastUpdated: number;
  // No-turn streak tracking
  noTurnStreak: {
    current: number; // Current streak for ongoing game
    bestInGame: number; // Best streak in current game
    allTimeBest: number; // Best streak across all games
  };
};

const INITIAL_STAT_VALUE: StatValue = {
  total: 0,
  colors: {},
};

export const INITIAL_GAME_STATS: GameStats = {
  shapesPlaced: { ...INITIAL_STAT_VALUE },
  linesCleared: { ...INITIAL_STAT_VALUE },
  coloredLinesCleared: { ...INITIAL_STAT_VALUE },
  rowsCleared: { ...INITIAL_STAT_VALUE },
  doubleRows: { ...INITIAL_STAT_VALUE },
  tripleRows: { ...INITIAL_STAT_VALUE },
  quadrupleRows: { ...INITIAL_STAT_VALUE },
  doubleRowsWithSingleColumns: { ...INITIAL_STAT_VALUE },
  tripleRowsWithSingleColumns: { ...INITIAL_STAT_VALUE },
  tripleRowsWithDoubleColumns: { ...INITIAL_STAT_VALUE },
  quadrupleRowsWithSingleColumns: { ...INITIAL_STAT_VALUE },
  columnsCleared: { ...INITIAL_STAT_VALUE },
  doubleColumns: { ...INITIAL_STAT_VALUE },
  tripleColumns: { ...INITIAL_STAT_VALUE },
  quadrupleColumns: { ...INITIAL_STAT_VALUE },
  doubleColumnsWithSingleRows: { ...INITIAL_STAT_VALUE },
  tripleColumnsWithDoubleRows: { ...INITIAL_STAT_VALUE },
  tripleColumnsWithSingleRows: { ...INITIAL_STAT_VALUE },
  quadrupleColumnsWithSingleRows: { ...INITIAL_STAT_VALUE },
  singleColumnBySingleRow: { ...INITIAL_STAT_VALUE },
  doubleColumnByDoubleRow: { ...INITIAL_STAT_VALUE },
  quadrupleRowByQuadrupleColumn: { ...INITIAL_STAT_VALUE },
};

export const INITIAL_STATS_PERSISTENCE: StatsPersistenceData = {
  allTime: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
  highScore: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
  current: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
  lastUpdated: Date.now(),
  noTurnStreak: {
    current: 0,
    bestInGame: 0,
    allTimeBest: 0,
  },
};

// Facade export to match folder name
export const stats = {
  INITIAL_GAME_STATS,
  INITIAL_STATS_PERSISTENCE,
};

// ============================================================================
// THEME TYPES
// ============================================================================

export type ThemeName = 'dark' | 'light' | 'block-blast';

export type BlockTheme = 'gem' | 'simple' | 'pixel';

export const BLOCK_THEMES: Record<BlockTheme, string> = {
  gem: 'Gem',
  simple: 'Simple',
  pixel: 'Pixel',
};

export type Theme = {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    gameBackground: string;
    gridBackground: string;
    text: string;
    textSecondary: string;
    border: string;
    buttonBg: string;
    buttonText: string;
    buttonHover: string;
    overlayBg: string;
    overlayText: string;
    tileEmpty: string;
    tileBorder: string;
  };
};

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    displayName: 'Dark Mode',
    colors: {
      background: 'rgb(25, 25, 25)',
      gameBackground: 'rgb(25, 25, 25)',
      gridBackground: 'rgb(40, 40, 40)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(200, 200, 200)',
      border: 'rgb(60, 60, 60)',
      buttonBg: 'rgb(50, 50, 50)',
      buttonText: 'rgb(255, 255, 255)',
      buttonHover: 'rgb(70, 70, 70)',
      overlayBg: 'rgba(0, 0, 0, 0.85)',
      overlayText: 'rgb(255, 255, 255)',
      tileEmpty: 'rgb(30, 30, 30)',
      tileBorder: 'rgb(50, 50, 50)',
    },
  },
  light: {
    name: 'light',
    displayName: 'Light Mode',
    colors: {
      background: 'rgb(245, 245, 245)',
      gameBackground: 'rgb(255, 255, 255)',
      gridBackground: 'rgb(250, 250, 250)',
      text: 'rgb(20, 20, 20)',
      textSecondary: 'rgb(80, 80, 80)',
      border: 'rgb(200, 200, 200)',
      buttonBg: 'rgb(230, 230, 230)',
      buttonText: 'rgb(20, 20, 20)',
      buttonHover: 'rgb(210, 210, 210)',
      overlayBg: 'rgba(255, 255, 255, 0.95)',
      overlayText: 'rgb(20, 20, 20)',
      tileEmpty: 'rgb(255, 255, 255)',
      tileBorder: 'rgb(220, 220, 220)',
    },
  },
  'block-blast': {
    name: 'block-blast',
    displayName: 'Having A Blast',
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gameBackground: 'rgba(255, 255, 255, 0.1)',
      gridBackground: 'rgba(255, 255, 255, 0.15)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(255, 255, 255, 0.3)',
      buttonBg: 'rgba(255, 255, 255, 0.2)',
      buttonText: 'rgb(255, 255, 255)',
      buttonHover: 'rgba(255, 255, 255, 0.3)',
      overlayBg: 'rgba(102, 126, 234, 0.95)',
      overlayText: 'rgb(255, 255, 255)',
      tileEmpty: 'rgba(255, 255, 255, 0.05)',
      tileBorder: 'rgba(255, 255, 255, 0.2)',
    },
  },
};

// Facade export to match folder name
export const theme = {
  BLOCK_THEMES,
  THEMES,
};

// Facade export to match folder name
export const types = {
  tilesToArray,
};
