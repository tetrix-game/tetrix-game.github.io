import { createSubscriptionStore } from '../../utils/subscriptionStore';
import type { ColorName } from '../../utils/types';

export type DebugTool = 'add-block' | 'fill-row' | 'fill-column' | 'remove' | 'clear-all' | 'none';
export type ShapeType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type SectionType = 'tools' | 'color' | 'shapes' | null;

export type DebugEditorState = {
  isEditorOpen: boolean;
  currentTool: DebugTool;
  selectedColor: ColorName;
  selectedShape: ShapeType;
  showInstructions: boolean;
  hasShownInstructions: boolean;
  showGridDots: boolean;
  lastActiveSection: SectionType;
};

export type DebugEditorAction =
  | { type: 'OPEN_EDITOR' }
  | { type: 'CLOSE_EDITOR' }
  | { type: 'HIDE_INSTRUCTIONS' }
  | { type: 'TOGGLE_GRID_DOTS' }
  | { type: 'SET_TOOL'; tool: DebugTool }
  | { type: 'SET_COLOR'; color: ColorName }
  | { type: 'SET_SHAPE'; shape: ShapeType }
  | { type: 'SET_LAST_ACTIVE_SECTION'; section: SectionType }
  | { type: 'CYCLE_TOOL'; direction: 'forward' | 'backward' }
  | { type: 'CYCLE_COLOR'; direction: 'forward' | 'backward' }
  | { type: 'CYCLE_SHAPE'; direction: 'forward' | 'backward' }
  | { type: 'CYCLE_ACTIVE_SECTION'; direction: 'forward' | 'backward' };

const TOOL_ORDER: DebugTool[] = ['add-block', 'fill-row', 'fill-column', 'remove', 'clear-all'];
const COLOR_ORDER: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const SHAPE_ORDER: ShapeType[] = ['I', 'O', 'T', 'S', 'Z', 'J' | 'L'];

const initialState: DebugEditorState = {
  isEditorOpen: false,
  currentTool: 'none',
  selectedColor: 'blue',
  selectedShape: 'I',
  showInstructions: true,
  hasShownInstructions: false,
  showGridDots: true,
  lastActiveSection: 'tools',
};

const reducer = (state: DebugEditorState, action: DebugEditorAction): DebugEditorState => {
  switch (action.type) {
    case 'OPEN_EDITOR':
      return {
        ...state,
        isEditorOpen: true,
        currentTool: state.currentTool === 'none' ? 'add-block' : state.currentTool,
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
      return { ...state, selectedColor: action.color };
    case 'SET_SHAPE':
      return { ...state, selectedShape: action.shape };
    case 'SET_LAST_ACTIVE_SECTION':
      return { ...state, lastActiveSection: action.section };
    case 'CYCLE_TOOL': {
      const currentIndex = TOOL_ORDER.indexOf(state.currentTool);
      let newIndex: number;
      if (action.direction === 'forward') {
        newIndex = (currentIndex + 1) % TOOL_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + TOOL_ORDER.length) % TOOL_ORDER.length;
      }
      return { ...state, currentTool: TOOL_ORDER[newIndex] };
    }
    case 'CYCLE_COLOR': {
      const currentIndex = COLOR_ORDER.indexOf(state.selectedColor);
      let newIndex: number;
      if (action.direction === 'forward') {
        newIndex = (currentIndex + 1) % COLOR_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + COLOR_ORDER.length) % COLOR_ORDER.length;
      }
      return { ...state, selectedColor: COLOR_ORDER[newIndex] };
    }
    case 'CYCLE_SHAPE': {
      const currentIndex = SHAPE_ORDER.indexOf(state.selectedShape);
      let newIndex: number;
      if (action.direction === 'forward') {
        newIndex = (currentIndex + 1) % SHAPE_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + SHAPE_ORDER.length) % SHAPE_ORDER.length;
      }
      return { ...state, selectedShape: SHAPE_ORDER[newIndex] };
    }
    case 'CYCLE_ACTIVE_SECTION': {
      switch (state.lastActiveSection) {
        case 'tools':
          return { ...state, currentTool: TOOL_ORDER[
            (TOOL_ORDER.indexOf(state.currentTool) + (action.direction === 'forward' ? 1 : -1) + TOOL_ORDER.length) % TOOL_ORDER.length
          ] };
        case 'color':
          return { ...state, selectedColor: COLOR_ORDER[
            (COLOR_ORDER.indexOf(state.selectedColor) + (action.direction === 'forward' ? 1 : -1) + COLOR_ORDER.length) % COLOR_ORDER.length
          ] };
        case 'shapes':
          return { ...state, selectedShape: SHAPE_ORDER[
            (SHAPE_ORDER.indexOf(state.selectedShape) + (action.direction === 'forward' ? 1 : -1) + SHAPE_ORDER.length) % SHAPE_ORDER.length
          ] };
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

export const {
  Provider: DebugEditorProvider,
  useStore: useDebugEditorStore,
  useDispatch: useDebugEditorDispatch,
  StoreContext: DebugEditorContext
} = createSubscriptionStore(reducer, initialState, 'DebugEditor');

export function useDebugEditor<Selected>(selector: (state: DebugEditorState) => Selected) {
  const selected = useDebugEditorStore(selector);
  const dispatch = useDebugEditorDispatch();

  return {
    state: selected, // This is weird, usually selected IS the state slice. But existing code expects { state: ... }
    // Wait, existing code expects { state: DebugEditorState, openEditor: ... }
    // If I return { state: selected }, then selected must be the whole state or a slice.
    // If the user passes `state => state`, then `selected` is the whole state.
    // If the user passes `state => state.isEditorOpen`, then `selected` is boolean.
    
    // I should probably return `...selected` if selected is an object, but I can't know.
    // The existing API returns `state` property.
    
    // Let's assume the user will select what they need.
    // But I need to provide the helper functions.
    
    openEditor: () => dispatch({ type: 'OPEN_EDITOR' }),
    closeEditor: () => dispatch({ type: 'CLOSE_EDITOR' }),
    setTool: (tool: DebugTool) => dispatch({ type: 'SET_TOOL', tool }),
    setColor: (color: ColorName) => dispatch({ type: 'SET_COLOR', color }),
    setShape: (shape: ShapeType) => dispatch({ type: 'SET_SHAPE', shape }),
    setLastActiveSection: (section: SectionType) => dispatch({ type: 'SET_LAST_ACTIVE_SECTION', section }),
    cycleTool: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_TOOL', direction }),
    cycleColor: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_COLOR', direction }),
    cycleShape: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_SHAPE', direction }),
    cycleActiveSection: (direction: 'forward' | 'backward') => dispatch({ type: 'CYCLE_ACTIVE_SECTION', direction }),
    hideInstructions: () => dispatch({ type: 'HIDE_INSTRUCTIONS' }),
    toggleGridDots: () => dispatch({ type: 'TOGGLE_GRID_DOTS' }),
  };
}

