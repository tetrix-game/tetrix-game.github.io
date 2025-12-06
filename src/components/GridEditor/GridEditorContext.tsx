import { useContext } from 'react';
import { createSubscriptionStore } from '../../utils/subscriptionStore';
import type { ColorName } from '../../types';

export type GridEditorTool = 'paint' | 'erase' | 'none';
export type SectionType = 'rows' | 'columns' | 'brush' | null;

// Grid layout configuration
export type GridLayout = {
  width: number; // Number of columns (2-20)
  height: number; // Number of rows (2-20)
  tiles: Set<string>; // Set of tile keys that exist (e.g., 'R1C1', 'R2C5')
  tileBackgrounds: Map<string, ColorName>; // Map of tile keys to their background colors
};

export type GridEditorState = {
  isEditorOpen: boolean;
  currentTool: GridEditorTool;
  selectedColor: ColorName | 'eraser';
  gridLayout: GridLayout;
  showInstructions: boolean;
  hasShownInstructions: boolean;
  showGridDots: boolean;
  lastActiveSection: SectionType;
};

export type GridEditorAction =
  | { type: 'OPEN_EDITOR' }
  | { type: 'CLOSE_EDITOR' }
  | { type: 'HIDE_INSTRUCTIONS' }
  | { type: 'TOGGLE_GRID_DOTS' }
  | { type: 'SET_TOOL'; tool: GridEditorTool }
  | { type: 'SET_COLOR'; color: ColorName | 'eraser' }
  | { type: 'SET_LAST_ACTIVE_SECTION'; section: SectionType }
  | { type: 'CYCLE_COLOR'; direction: 'forward' | 'backward' }
  | { type: 'CYCLE_ACTIVE_SECTION'; direction: 'forward' | 'backward' }
  | { type: 'SET_GRID_WIDTH'; width: number }
  | { type: 'SET_GRID_HEIGHT'; height: number }
  | { type: 'ADJUST_GRID_WIDTH'; delta: number }
  | { type: 'ADJUST_GRID_HEIGHT'; delta: number }
  | { type: 'ADD_TILE'; key: string }
  | { type: 'REMOVE_TILE'; key: string }
  | { type: 'CLEAR_ALL_TILES' }
  | { type: 'IMPORT_GRID_LAYOUT'; layout: GridLayout };

// Default color order includes eraser at the end
const COLOR_ORDER: Array<ColorName | 'eraser'> = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'eraser'];

// Create default grid layout (10x10 with all tiles present)
function createDefaultGridLayout(): GridLayout {
  const tiles = new Set<string>();
  const tileBackgrounds = new Map<string, ColorName>();
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {
      const key = `R${row}C${col}`;
      tiles.add(key);
      // Create checkerboard pattern
      const isDark = (row + col) % 2 === 0;
      if (isDark) {
        tileBackgrounds.set(key, 'grey');
      }
    }
  }
  return {
    width: 10,
    height: 10,
    tiles,
    tileBackgrounds,
  };
}

const initialState: GridEditorState = {
  isEditorOpen: false,
  currentTool: 'none',
  selectedColor: 'blue',
  gridLayout: createDefaultGridLayout(),
  showInstructions: true,
  hasShownInstructions: false,
  showGridDots: true,
  lastActiveSection: 'brush',
};

const reducer = (state: GridEditorState, action: GridEditorAction): GridEditorState => {
  switch (action.type) {
    case 'OPEN_EDITOR':
      return {
        ...state,
        isEditorOpen: true,
        currentTool: 'paint',
        showInstructions: !state.hasShownInstructions,
        hasShownInstructions: true,
      };
    case 'CLOSE_EDITOR':
      return {
        ...state,
        isEditorOpen: false,
        currentTool: 'none',
      };
    case 'HIDE_INSTRUCTIONS':
      return {
        ...state,
        showInstructions: false,
      };
    case 'TOGGLE_GRID_DOTS':
      return {
        ...state,
        showGridDots: !state.showGridDots,
      };
    case 'SET_TOOL':
      return { ...state, currentTool: action.tool };
    case 'SET_COLOR':
      return { 
        ...state, 
        selectedColor: action.color,
        currentTool: action.color === 'eraser' ? 'erase' : 'paint'
      };
    case 'SET_LAST_ACTIVE_SECTION':
      return { ...state, lastActiveSection: action.section };
    case 'CYCLE_COLOR': {
      const currentIndex = COLOR_ORDER.indexOf(state.selectedColor);
      let newIndex: number;
      if (action.direction === 'forward') {
        newIndex = (currentIndex + 1) % COLOR_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + COLOR_ORDER.length) % COLOR_ORDER.length;
      }
      const newColor = COLOR_ORDER[newIndex];
      return { 
        ...state, 
        selectedColor: newColor,
        currentTool: newColor === 'eraser' ? 'erase' : 'paint'
      };
    }
    case 'SET_GRID_WIDTH': {
      const clampedWidth = Math.max(2, Math.min(20, action.width));
      const newTiles = new Set<string>();
      const newTileBackgrounds = new Map<string, ColorName>();
      state.gridLayout.tiles.forEach(key => {
        const match = key.match(/R(\d+)C(\d+)/);
        if (match) {
          const col = parseInt(match[2], 10);
          if (col <= clampedWidth) {
            newTiles.add(key);
            const bg = state.gridLayout.tileBackgrounds.get(key);
            if (bg) {
              newTileBackgrounds.set(key, bg);
            }
          }
        }
      });
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          width: clampedWidth,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'SET_GRID_HEIGHT': {
      const clampedHeight = Math.max(2, Math.min(20, action.height));
      const newTiles = new Set<string>();
      const newTileBackgrounds = new Map<string, ColorName>();
      state.gridLayout.tiles.forEach(key => {
        const match = key.match(/R(\d+)C(\d+)/);
        if (match) {
          const row = parseInt(match[1], 10);
          if (row <= clampedHeight) {
            newTiles.add(key);
            const bg = state.gridLayout.tileBackgrounds.get(key);
            if (bg) {
              newTileBackgrounds.set(key, bg);
            }
          }
        }
      });
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          height: clampedHeight,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'ADJUST_GRID_WIDTH': {
      const newWidth = Math.max(2, Math.min(20, state.gridLayout.width + action.delta));
      if (newWidth === state.gridLayout.width) return state;
      
      const newTiles = new Set<string>();
      const newTileBackgrounds = new Map<string, ColorName>();
      state.gridLayout.tiles.forEach(key => {
        const match = key.match(/R(\d+)C(\d+)/);
        if (match) {
          const col = parseInt(match[2], 10);
          if (col <= newWidth) {
            newTiles.add(key);
            const bg = state.gridLayout.tileBackgrounds.get(key);
            if (bg) {
              newTileBackgrounds.set(key, bg);
            }
          }
        }
      });
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          width: newWidth,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'ADJUST_GRID_HEIGHT': {
      const newHeight = Math.max(2, Math.min(20, state.gridLayout.height + action.delta));
      if (newHeight === state.gridLayout.height) return state;
      
      const newTiles = new Set<string>();
      const newTileBackgrounds = new Map<string, ColorName>();
      state.gridLayout.tiles.forEach(key => {
        const match = key.match(/R(\d+)C(\d+)/);
        if (match) {
          const row = parseInt(match[1], 10);
          if (row <= newHeight) {
            newTiles.add(key);
            const bg = state.gridLayout.tileBackgrounds.get(key);
            if (bg) {
              newTileBackgrounds.set(key, bg);
            }
          }
        }
      });
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          height: newHeight,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'ADD_TILE': {
      const newTiles = new Set(state.gridLayout.tiles);
      newTiles.add(action.key);
      const newTileBackgrounds = new Map(state.gridLayout.tileBackgrounds);
      if (state.selectedColor !== 'eraser') {
        newTileBackgrounds.set(action.key, state.selectedColor);
      }
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'REMOVE_TILE': {
      const newTiles = new Set(state.gridLayout.tiles);
      newTiles.delete(action.key);
      const newTileBackgrounds = new Map(state.gridLayout.tileBackgrounds);
      newTileBackgrounds.delete(action.key);
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          tiles: newTiles,
          tileBackgrounds: newTileBackgrounds,
        }
      };
    }
    case 'CLEAR_ALL_TILES':
      return {
        ...state,
        gridLayout: {
          ...state.gridLayout,
          tiles: new Set(),
          tileBackgrounds: new Map(),
        }
      };
    case 'IMPORT_GRID_LAYOUT':
      return {
        ...state,
        gridLayout: {
          width: Math.max(2, Math.min(20, action.layout.width)),
          height: Math.max(2, Math.min(20, action.layout.height)),
          tiles: new Set(action.layout.tiles),
          tileBackgrounds: new Map(action.layout.tileBackgrounds),
        }
      };
    case 'CYCLE_ACTIVE_SECTION': {
      const delta = action.direction === 'forward' ? 1 : -1;
      switch (state.lastActiveSection) {
        case 'rows': {
          // Reuse logic from ADJUST_GRID_HEIGHT
          const newHeight = Math.max(2, Math.min(20, state.gridLayout.height + delta));
          if (newHeight === state.gridLayout.height) return state;
          
          const newTiles = new Set<string>();
          const newTileBackgrounds = new Map<string, ColorName>();
          state.gridLayout.tiles.forEach(key => {
            const match = key.match(/R(\d+)C(\d+)/);
            if (match) {
              const row = parseInt(match[1], 10);
              if (row <= newHeight) {
                newTiles.add(key);
                const bg = state.gridLayout.tileBackgrounds.get(key);
                if (bg) {
                  newTileBackgrounds.set(key, bg);
                }
              }
            }
          });
          return {
            ...state,
            gridLayout: {
              ...state.gridLayout,
              height: newHeight,
              tiles: newTiles,
              tileBackgrounds: newTileBackgrounds,
            }
          };
        }
        case 'columns': {
          // Reuse logic from ADJUST_GRID_WIDTH
          const newWidth = Math.max(2, Math.min(20, state.gridLayout.width + delta));
          if (newWidth === state.gridLayout.width) return state;
          
          const newTiles = new Set<string>();
          const newTileBackgrounds = new Map<string, ColorName>();
          state.gridLayout.tiles.forEach(key => {
            const match = key.match(/R(\d+)C(\d+)/);
            if (match) {
              const col = parseInt(match[2], 10);
              if (col <= newWidth) {
                newTiles.add(key);
                const bg = state.gridLayout.tileBackgrounds.get(key);
                if (bg) {
                  newTileBackgrounds.set(key, bg);
                }
              }
            }
          });
          return {
            ...state,
            gridLayout: {
              ...state.gridLayout,
              width: newWidth,
              tiles: newTiles,
              tileBackgrounds: newTileBackgrounds,
            }
          };
        }
        case 'brush': {
          // Reuse logic from CYCLE_COLOR
          const newColorIndex = (COLOR_ORDER.indexOf(state.selectedColor) + delta + COLOR_ORDER.length) % COLOR_ORDER.length;
          const newColor = COLOR_ORDER[newColorIndex];
          return { 
            ...state, 
            selectedColor: newColor,
            currentTool: newColor === 'eraser' ? 'erase' : 'paint'
          };
        }
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

export const {
  Provider: GridEditorProvider,
  useStore: useGridEditorStore,
  useDispatch: useGridEditorDispatch,
  StoreContext: GridEditorContext
} = createSubscriptionStore(reducer, initialState, 'GridEditor');

export function useGridEditor<Selected>(selector: (state: GridEditorState) => Selected) {
  const selected = useGridEditorStore(selector);
  const dispatch = useGridEditorDispatch();
  const store = useContext(GridEditorContext);

  if (!store) {
    throw new Error('useGridEditor must be used within a GridEditorProvider');
  }

  const exportGridLayout = () => {
    const state = store.getState();
    return {
      width: state.gridLayout.width,
      height: state.gridLayout.height,
      tiles: new Set(state.gridLayout.tiles),
      tileBackgrounds: new Map(state.gridLayout.tileBackgrounds),
    };
  };

  return {
    state: selected,
    openEditor: () => dispatch({ type: 'OPEN_EDITOR' }),
    closeEditor: () => dispatch({ type: 'CLOSE_EDITOR' }),
    setTool: (tool: GridEditorTool) => dispatch({ type: 'SET_TOOL', tool }),
    setColor: (color: ColorName | 'eraser') => dispatch({ type: 'SET_COLOR', color }),
    setLastActiveSection: (section: SectionType) => dispatch({ type: 'SET_LAST_ACTIVE_SECTION', section }),
    cycleColor: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_COLOR', direction }),
    cycleActiveSection: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_ACTIVE_SECTION', direction }),
    setGridWidth: (width: number) => dispatch({ type: 'SET_GRID_WIDTH', width }),
    setGridHeight: (height: number) => dispatch({ type: 'SET_GRID_HEIGHT', height }),
    adjustGridWidth: (delta: number) => dispatch({ type: 'ADJUST_GRID_WIDTH', delta }),
    adjustGridHeight: (delta: number) => dispatch({ type: 'ADJUST_GRID_HEIGHT', delta }),
    addTile: (key: string) => dispatch({ type: 'ADD_TILE', key }),
    removeTile: (key: string) => dispatch({ type: 'REMOVE_TILE', key }),
    clearAllTiles: () => dispatch({ type: 'CLEAR_ALL_TILES' }),
    exportGridLayout,
    importGridLayout: (layout: GridLayout) => dispatch({ type: 'IMPORT_GRID_LAYOUT', layout }),
    hideInstructions: () => dispatch({ type: 'HIDE_INSTRUCTIONS' }),
    toggleGridDots: () => dispatch({ type: 'TOGGLE_GRID_DOTS' }),
  };
}

