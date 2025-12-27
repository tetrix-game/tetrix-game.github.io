import { useCallback } from 'react';
import { useDebugEditor } from '../components/DebugEditor';
import { useTetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import type { Location } from '../utils/types';

/**
 * Custom hook for handling debug grid interactions
 * Returns a click handler that can be attached to grid tiles
 */
export function useDebugGridInteractions() {
  const { state: editorState } = useDebugEditor();
  const dispatch = useTetrixDispatchContext();

  const handleDebugClick = useCallback((location: Location) => {
    if (!editorState.isEditorOpen) return;

    switch (editorState.currentTool) {
      case 'add-block':
        dispatch({
          type: 'DEBUG_ADD_BLOCK',
          value: {
            location,
            color: editorState.selectedColor,
          },
        });
        break;

      case 'fill-row':
        dispatch({
          type: 'DEBUG_FILL_ROW',
          value: {
            row: location.row,
            excludeColumn: location.column,
            color: editorState.selectedColor,
          },
        });
        break;

      case 'fill-column':
        dispatch({
          type: 'DEBUG_FILL_COLUMN',
          value: {
            column: location.column,
            excludeRow: location.row,
            color: editorState.selectedColor,
          },
        });
        break;

      case 'remove':
        dispatch({
          type: 'DEBUG_REMOVE_BLOCK',
          value: { location },
        });
        break;

      default:
        break;
    }
  }, [editorState.isEditorOpen, editorState.currentTool, editorState.selectedColor, dispatch]);

  return {
    isDebugMode: editorState.isEditorOpen,
    handleDebugClick,
  };
}
