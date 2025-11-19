import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { ColorName } from '../../utils/types';

export type DebugTool = 'add-block' | 'fill-row' | 'fill-column' | 'remove' | 'clear-all' | 'none';

type DebugEditorState = {
  isEditorOpen: boolean;
  currentTool: DebugTool;
  selectedColor: ColorName;
  showInstructions: boolean;
  hasShownInstructions: boolean;
  showGridDots: boolean;
};

type DebugEditorContextValue = {
  state: DebugEditorState;
  openEditor: () => void;
  closeEditor: () => void;
  setTool: (tool: DebugTool) => void;
  setColor: (color: ColorName) => void;
  cycleTool: (direction: 'forward' | 'backward') => void;
  hideInstructions: () => void;
  toggleGridDots: () => void;
};

const DebugEditorContext = createContext<DebugEditorContextValue | null>(null);

const TOOL_ORDER: DebugTool[] = ['add-block', 'fill-row', 'fill-column', 'remove', 'clear-all'];

export function DebugEditorProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<DebugEditorState>({
    isEditorOpen: false,
    currentTool: 'none',
    selectedColor: 'blue',
    showInstructions: true,
    hasShownInstructions: false,
    showGridDots: true,
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

  const value: DebugEditorContextValue = useMemo(() => ({
    state,
    openEditor,
    closeEditor,
    setTool,
    setColor,
    cycleTool,
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
