import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDebugEditor } from './DebugEditorContext';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import {
  generateIPiece,
  generateOPiece,
  generateTPiece,
  generateSPiece,
  generateZPiece,
  generateJPiece,
  generateLPiece
} from '../../utils/shapeUtils';
import { tilesMapToChallengeData } from '../../utils/gridConstants';
import type { ColorName } from '../../utils/types';
import './DebugEditor.css';

const COLOR_OPTIONS: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const DebugEditor: React.FC = () => {
  const { state, closeEditor, setTool, setColor, cycleTool, hideInstructions, toggleGridDots } = useDebugEditor();
  const { tiles } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  // Handle shape picker button clicks
  const handleShapePicker = useCallback((shapeType: string) => {
    const color = state.selectedColor;
    let shape;

    switch (shapeType) {
      case 'I':
        shape = generateIPiece(color);
        break;
      case 'O':
        shape = generateOPiece(color);
        break;
      case 'T':
        shape = generateTPiece(color);
        break;
      case 'S':
        shape = generateSPiece(color);
        break;
      case 'Z':
        shape = generateZPiece(color);
        break;
      case 'J':
        shape = generateJPiece(color);
        break;
      case 'L':
        shape = generateLPiece(color);
        break;
      default:
        return;
    }

    dispatch({
      type: 'DEBUG_REPLACE_FIRST_SHAPE',
      value: { shape },
    });
  }, [state.selectedColor, dispatch]);

  // Handle export board to clipboard
  const handleExportBoard = useCallback(() => {
    const challengeData = tilesMapToChallengeData(tiles);
    const jsonString = JSON.stringify(challengeData, null, 2);
    
    // Always log to console
    console.log('✅ Board data exported!');
    console.log('Board data:', challengeData);
    console.log('JSON:', jsonString);
    
    // Try to copy to clipboard with fallback
    const copyToClipboard = async () => {
      // Modern API (requires secure context)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(jsonString);
          alert('Board data copied to clipboard and logged to console!');
          return;
        } catch (err) {
          console.warn('Clipboard API failed, trying fallback:', err);
        }
      }
      
      // Fallback: Create a temporary textarea
      try {
        const textarea = document.createElement('textarea');
        textarea.value = jsonString;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Board data copied to clipboard and logged to console!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Could not copy to clipboard, but data is logged to console!');
      }
    };
    
    copyToClipboard();
  }, [tiles]);

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
                <p><strong>Shape Picker:</strong> Click a shape button to remove the first shape and add that shape type (in the selected color) to the end of the queue.</p>
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

        <div className="debug-tool-section">
          <div className="debug-tool-label">Shape Picker</div>
          <div className="shape-picker-grid">
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('I')}
              title="I-Piece (4-block line)"
            >
              I
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('O')}
              title="O-Piece (2x2 square)"
            >
              O
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('T')}
              title="T-Piece"
            >
              T
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('S')}
              title="S-Piece"
            >
              S
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('Z')}
              title="Z-Piece"
            >
              Z
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('J')}
              title="J-Piece"
            >
              J
            </button>
            <button
              className="shape-picker-button"
              onClick={() => handleShapePicker('L')}
              title="L-Piece"
            >
              L
            </button>
          </div>
        </div>

        <div className="debug-tool-section">
          <div className="debug-tool-label">View Options</div>
          <div className="debug-tools-grid">
            <button
              className={`debug-tool-button ${state.showGridDots ? 'active' : ''}`}
              onClick={toggleGridDots}
              title="Toggle Dragging Shape Grid Dots"
            >
              ⚏
            </button>
          </div>
        </div>

        <div className="debug-tool-section">
          <div className="debug-tool-label">Challenge Builder</div>
          <button className="debug-export-button" onClick={handleExportBoard}>
            📋 Export Board
          </button>
        </div>

        <div className="debug-tool-section">
          <button className="debug-close-editor-button" onClick={closeEditor}>
            Close Editor
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default DebugEditor;
