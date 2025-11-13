import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDebugEditor } from './DebugEditorContext';
import type { ColorName } from '../../utils/types';
import './DebugEditor.css';

const COLOR_OPTIONS: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const DebugEditor: React.FC = () => {
  const { state, closeEditor, setTool, setColor, cycleTool, hideInstructions } = useDebugEditor();

  // Handle mouse wheel for tool cycling
  useEffect(() => {
    if (!state.isEditorOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 'forward' : 'backward';
      cycleTool(direction);
    };

    globalThis.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      globalThis.removeEventListener('wheel', handleWheel);
    };
  }, [state.isEditorOpen, cycleTool]);

  // Handle escape key
  useEffect(() => {
    if (!state.isEditorOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeEditor();
      }
    };

    globalThis.addEventListener('keydown', handleEscape);
    return () => {
      globalThis.removeEventListener('keydown', handleEscape);
    };
  }, [state.isEditorOpen, closeEditor]);

  if (!state.isEditorOpen) return null;

  return createPortal(
    <>
      {/* Main overlay with instructions - only show if showInstructions is true */}
      {state.showInstructions && (
        <div className="debug-editor-overlay">
          <div className="debug-editor-container">
            <div className="debug-editor-header">
              <h2 className="debug-editor-title">Debug Editor</h2>
              <button className="debug-close-button" onClick={closeEditor}>
                Close
              </button>
            </div>
            <div className="debug-editor-content">
              <div className="debug-instructions">
                <p><strong>Add Block Tool:</strong> Click any tile to add a block with the selected color.</p>
                <p><strong>Fill Row Tool:</strong> Click any tile to fill all tiles in that row (except the clicked tile) with the selected color.</p>
                <p><strong>Fill Column Tool:</strong> Click any tile to fill all tiles in that column (except the clicked tile) with the selected color.</p>
                <p><strong>Remove Tool:</strong> Click any tile to remove its block.</p>
                <p><strong>Clear All Tool:</strong> Click any tile to remove all blocks from the entire grid.</p>
                <p><strong>Mouse Wheel:</strong> Scroll to cycle between tools.</p>
                <p><strong>Color Picker:</strong> Select the color for blocks placed by add and fill tools.</p>
              </div>
              <div className="debug-instructions-actions">
                <button className="debug-continue-button" onClick={hideInstructions}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool palette - always visible on top */}
      <div className="debug-tool-palette">
        <div className="debug-tool-section">
          <div className="debug-tool-label">Tools</div>
          <div className="debug-tools-grid">
            <button
              className={`debug-tool-button ${state.currentTool === 'add-block' ? 'active' : ''}`}
              onClick={() => setTool('add-block')}
              title="Add Block"
            >
              ✚
            </button>
            <button
              className={`debug-tool-button ${state.currentTool === 'fill-row' ? 'active' : ''}`}
              onClick={() => setTool('fill-row')}
              title="Fill Row (except clicked tile)"
            >
              ━
            </button>
            <button
              className={`debug-tool-button ${state.currentTool === 'fill-column' ? 'active' : ''}`}
              onClick={() => setTool('fill-column')}
              title="Fill Column (except clicked tile)"
            >
              ┃
            </button>
            <button
              className={`debug-tool-button ${state.currentTool === 'remove' ? 'active' : ''}`}
              onClick={() => setTool('remove')}
              title="Remove Block"
            >
              ✕
            </button>
            <button
              className={`debug-tool-button ${state.currentTool === 'clear-all' ? 'active' : ''}`}
              onClick={() => setTool('clear-all')}
              title="Clear All Blocks"
            >
              🗑
            </button>
          </div>
        </div>

        <div className="debug-tool-section">
          <div className="debug-tool-label">Color</div>
          <div className="color-picker-grid">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                className={`color-picker-button color-${color} ${state.selectedColor === color ? 'active' : ''}`}
                onClick={() => setColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default DebugEditor;
