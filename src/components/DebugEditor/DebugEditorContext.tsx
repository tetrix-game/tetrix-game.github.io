import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { ColorName } from '../../utils/types';

export type DebugTool = 'add-block' | 'fill-row' | 'fill-column' | 'remove' | 'none';
export type ShapeType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type SectionType = 'tools' | 'color' | 'shapes' | null;

type DebugEditorState = {
  isEditorOpen: boolean;
  currentTool: DebugTool;
  selectedColor: ColorName;
  selectedShape: ShapeType;
  showInstructions: boolean;
  hasShownInstructions: boolean;
  showGridDots: boolean;
  lastActiveSection: SectionType;
};

type DebugEditorContextValue = {
  state: DebugEditorState;
  openEditor: () => void;
  closeEditor: () => void;
  setTool: (tool: DebugTool) => void;
  setColor: (color: ColorName) => void;
  setShape: (shape: ShapeType) => void;
  setLastActiveSection: (section: SectionType) => void;
  cycleTool: (direction: 'forward' | 'backward') => void;
  cycleColor: (direction: 'forward' | 'backward') => void;
  cycleShape: (direction: 'forward' | 'backward') => void;
  cycleActiveSection: (direction: 'forward' | 'backward') => void;
  hideInstructions: () => void;
  toggleGridDots: () => void;
};

const DebugEditorContext = createContext<DebugEditorContextValue | null>(null);

const TOOL_ORDER: DebugTool[] = ['add-block', 'fill-row', 'fill-column', 'remove'];
const COLOR_ORDER: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const SHAPE_ORDER: ShapeType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function DebugEditorProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<DebugEditorState>({
    isEditorOpen: false,
    currentTool: 'none',
    selectedColor: 'blue',
    selectedShape: 'I',
    showInstructions: true,
    hasShownInstructions: false,
    showGridDots: true,
    lastActiveSection: 'tools',
  });

  const openEditor = () => {
    setState(prev => ({
      ...prev,
      isEditorOpen: true,
      currentTool: prev.currentTool === 'none' ? 'add-block' : prev.currentTool,
      showInstructions: !prev.hasShownInstructions,
      hasShownInstructions: true,
    }));
  };

  const closeEditor = () => {
    setState(prev => ({
      ...prev,
      isEditorOpen: false,
      currentTool: 'none',
    }));
  };

  const hideInstructions = () => {
    setState(prev => ({
      ...prev,
      showInstructions: false,
    }));
  };

  const toggleGridDots = () => {
    setState(prev => ({
      ...prev,
      showGridDots: !prev.showGridDots,
    }));
  };

  const setTool = (tool: DebugTool) => {
    setState(prev => ({ ...prev, currentTool: tool }));
  };

  const setColor = (color: ColorName) => {
    setState(prev => ({ ...prev, selectedColor: color }));
  };

  const setShape = (shape: ShapeType) => {
    setState(prev => ({ ...prev, selectedShape: shape }));
  };

  const setLastActiveSection = (section: SectionType) => {
    setState(prev => ({ ...prev, lastActiveSection: section }));
  };

  const cycleTool = (direction: 'forward' | 'backward') => {
    setState(prev => {
      const currentIndex = TOOL_ORDER.indexOf(prev.currentTool);
      let newIndex: number;

      if (direction === 'forward') {
        newIndex = (currentIndex + 1) % TOOL_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + TOOL_ORDER.length) % TOOL_ORDER.length;
      }

      return { ...prev, currentTool: TOOL_ORDER[newIndex] };
    });
  };

  const cycleColor = (direction: 'forward' | 'backward') => {
    setState(prev => {
      const currentIndex = COLOR_ORDER.indexOf(prev.selectedColor);
      let newIndex: number;

      if (direction === 'forward') {
        newIndex = (currentIndex + 1) % COLOR_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + COLOR_ORDER.length) % COLOR_ORDER.length;
      }

      return { ...prev, selectedColor: COLOR_ORDER[newIndex] };
    });
  };

  const cycleShape = (direction: 'forward' | 'backward') => {
    setState(prev => {
      const currentIndex = SHAPE_ORDER.indexOf(prev.selectedShape);
      let newIndex: number;

      if (direction === 'forward') {
        newIndex = (currentIndex + 1) % SHAPE_ORDER.length;
      } else {
        newIndex = (currentIndex - 1 + SHAPE_ORDER.length) % SHAPE_ORDER.length;
      }

      return { ...prev, selectedShape: SHAPE_ORDER[newIndex] };
    });
  };

  const cycleActiveSection = (direction: 'forward' | 'backward') => {
    setState(prev => {
      switch (prev.lastActiveSection) {
        case 'tools':
          return {
            ...prev, currentTool: TOOL_ORDER[
              (TOOL_ORDER.indexOf(prev.currentTool) + (direction === 'forward' ? 1 : -1) + TOOL_ORDER.length) % TOOL_ORDER.length
            ]
          };
        case 'color':
          return {
            ...prev, selectedColor: COLOR_ORDER[
              (COLOR_ORDER.indexOf(prev.selectedColor) + (direction === 'forward' ? 1 : -1) + COLOR_ORDER.length) % COLOR_ORDER.length
            ]
          };
        case 'shapes':
          return {
            ...prev, selectedShape: SHAPE_ORDER[
              (SHAPE_ORDER.indexOf(prev.selectedShape) + (direction === 'forward' ? 1 : -1) + SHAPE_ORDER.length) % SHAPE_ORDER.length
            ]
          };
        default:
          return prev;
      }
    });
  };

  const value: DebugEditorContextValue = useMemo(() => ({
    state,
    openEditor,
    closeEditor,
    setTool,
    setColor,
    setShape,
    setLastActiveSection,
    cycleTool,
    cycleColor,
    cycleShape,
    cycleActiveSection,
    hideInstructions,
    toggleGridDots,
  }), [state]);

  return (
    <DebugEditorContext.Provider value={value}>
      {children}
    </DebugEditorContext.Provider>
  );
}

export function useDebugEditor() {
  const context = useContext(DebugEditorContext);
  if (!context) {
    throw new Error('useDebugEditor must be used within a DebugEditorProvider');
  }
  return context;
}
