import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDebugEditor } from './DebugEditorContext';
import type { ShapeType } from './DebugEditorContext';
import { DebugMenuSection } from './DebugMenuSection';
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
import type { ColorName, Location } from '../../utils/types';
import './DebugEditor.css';

const COLOR_OPTIONS: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const DebugEditor: React.FC = () => {
  const {
    state,
    closeEditor,
    setTool,
    setColor,
    setShape,
    setLastActiveSection,
    cycleActiveSection,
    hideInstructions,
    toggleGridDots
  } = useDebugEditor();
  const { tiles } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  // Dragging state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const paletteRef = useRef<HTMLDivElement>(null);

  // Focused section (which section button is highlighted)
  const [focusedSection, setFocusedSection] = useState<'tools' | 'color' | 'shapes' | 'view'>('tools');

  // Navigation mode: 'menu' = navigating between sections, 'submenu' = changing options within section
  const [navMode, setNavMode] = useState<'menu' | 'submenu'>('menu');

  // Expanded section state (visual expansion of bubble)
  const [expandedSection, setExpandedSection] = useState<'tools' | 'color' | 'shapes' | 'view' | null>(null);

  // Toggle section on click
  const toggleSection = useCallback((section: 'tools' | 'color' | 'shapes' | 'view') => {
    setFocusedSection(section);
    setExpandedSection(prev => {
      const newSection = prev === section ? null : section;
      // When opening, switch to submenu mode; when closing, switch to menu mode
      setNavMode(newSection ? 'submenu' : 'menu');
      // Track which section is active (skip 'view' as it's not cycleable)
      if (newSection && newSection !== 'view') {
        setLastActiveSection(newSection);
      }
      return newSection;
    });
  }, [setLastActiveSection]);

  // Mouse down - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!paletteRef.current) return;

    const rect = paletteRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, []);

  // Mouse move - drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Helper functions to get icons for selected options
  const getToolIcon = useCallback(() => {
    switch (state.currentTool) {
      case 'add-block': return '✚';
      case 'fill-row': return '━';
      case 'fill-column': return '┃';
      case 'remove': return '✕';
      default: return '🛠';
    }
  }, [state.currentTool]);

  const getColorIcon = useCallback(() => {
    // Return a colored circle representing the selected color
    return '●';
  }, []);

  const getShapeIcon = useCallback(() => {
    return state.selectedShape;
  }, [state.selectedShape]);

  // Helper to get grid location from click event
  const getGridLocationFromClick = useCallback((e: MouseEvent): Location | null => {
    const gridElement = document.querySelector('.grid');
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const column = Math.floor((x / rect.width) * 10) + 1;
    const row = Math.floor((y / rect.height) * 10) + 1;

    if (row >= 1 && row <= 10 && column >= 1 && column <= 10) {
      return { row, column };
    }
    return null;
  }, []);

  // Handle tool action on grid click
  const handleToolAction = useCallback((location: Location) => {
    switch (state.currentTool) {
      case 'add-block':
        dispatch({
          type: 'DEBUG_ADD_BLOCK',
          value: { location, color: state.selectedColor },
        });
        break;
      case 'fill-row':
        dispatch({
          type: 'DEBUG_FILL_ROW',
          value: { row: location.row, excludeColumn: location.column, color: state.selectedColor },
        });
        break;
      case 'fill-column':
        dispatch({
          type: 'DEBUG_FILL_COLUMN',
          value: { column: location.column, excludeRow: location.row, color: state.selectedColor },
        });
        break;
      case 'remove':
        dispatch({
          type: 'DEBUG_REMOVE_BLOCK',
          value: { location },
        });
        break;
    }
  }, [state.currentTool, state.selectedColor, dispatch]);

  // Handle shape selection (only updates selection, doesn't add to queue)
  const handleShapeSelection = useCallback((shapeType: ShapeType) => {
    setShape(shapeType);
  }, [setShape]);

  // Handle adding the currently selected shape to the queue
  const handleAddShapeToQueue = useCallback(() => {
    const color = state.selectedColor;
    const shapeType = state.selectedShape;
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
  }, [state.selectedColor, state.selectedShape, dispatch]);

  // Stable click listener for tools/color sections (performs tool action on grid)
  const handleToolGridClick = useCallback((e: MouseEvent) => {
    const location = getGridLocationFromClick(e);
    if (location) {
      handleToolAction(location);
    }
  }, [getGridLocationFromClick, handleToolAction]);

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

  // Unified navigation handler (used by both Tab and Scroll)
  const handleNavigation = useCallback((direction: 'forward' | 'backward') => {
    if (navMode === 'menu') {
      // Navigate between section buttons
      const sections: Array<'tools' | 'color' | 'shapes' | 'view'> = ['tools', 'color', 'shapes', 'view'];
      const currentIndex = sections.indexOf(focusedSection);
      const delta = direction === 'forward' ? 1 : -1;
      const nextIndex = (currentIndex + delta + sections.length) % sections.length;
      setFocusedSection(sections[nextIndex]);

      // Track last active section
      if (sections[nextIndex] !== 'view') {
        setLastActiveSection(sections[nextIndex]);
      }
    } else {
      // Navigate within sub-menu options (cycle the actual values)
      cycleActiveSection(direction);
    }
  }, [navMode, focusedSection, setLastActiveSection, cycleActiveSection]);

  // Handle mouse wheel - same as Tab
  useEffect(() => {
    if (!state.isEditorOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 'forward' : 'backward';
      handleNavigation(direction);
    };

    globalThis.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      globalThis.removeEventListener('wheel', handleWheel);
    };
  }, [state.isEditorOpen, handleNavigation]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!state.isEditorOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Always capture Tab, Space, and Escape when debug editor is open
      if (e.key === 'Tab' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'Escape') {
        closeEditor();
      } else if (e.key === 'Tab') {
        // Tab does the same thing as scrolling
        const direction = e.shiftKey ? 'backward' : 'forward';
        handleNavigation(direction);
      } else if (e.key === ' ') {
        // Space toggles between menu and submenu modes
        if (navMode === 'menu') {
          // Open the focused section and switch to submenu mode
          setExpandedSection(focusedSection);
          setNavMode('submenu');
          if (focusedSection !== 'view') {
            setLastActiveSection(focusedSection);
          }
        } else {
          // Close the expanded section and switch to menu mode
          setExpandedSection(null);
          setNavMode('menu');
        }
      }
    };

    // Use capture phase to ensure we get Tab before other handlers
    globalThis.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [state.isEditorOpen, closeEditor, navMode, focusedSection, expandedSection, handleNavigation, setLastActiveSection]);

  // Unified click handler for submenu interactions
  // Tools and color sections register a global click listener to perform actions on the grid
  useEffect(() => {
    if (!state.isEditorOpen || navMode !== 'submenu') return;

    // Only tools and color sections have global click behavior
    if (focusedSection !== 'tools' && focusedSection !== 'color') return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Both tools and color perform tool actions on the grid
      handleToolGridClick(e);
    };

    globalThis.addEventListener('click', handleGlobalClick);
    return () => {
      globalThis.removeEventListener('click', handleGlobalClick);
    };
  }, [state.isEditorOpen, navMode, focusedSection, handleToolGridClick]);

  // Define menu sections with their specific behaviors
  // Must be before early return to maintain hook order
  const menuSections = useMemo(() => [
    // TOOLS SECTION: Adds click listener to perform tool action on grid
    {
      id: 'tools' as const,
      label: `Tools - Current: ${state.currentTool}`,
      icon: getToolIcon(),
      isFocused: focusedSection === 'tools',
      isExpanded: expandedSection === 'tools',
      onClick: () => toggleSection('tools'),
      renderContent: () => (
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
            title="Fill Row"
          >
            ━
          </button>
          <button
            className={`debug-tool-button ${state.currentTool === 'fill-column' ? 'active' : ''}`}
            onClick={() => setTool('fill-column')}
            title="Fill Column"
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
        </div>
      ),
    },
    // COLOR SECTION: Adds click listener to perform tool action with selected color
    {
      id: 'color' as const,
      label: `Color - Current: ${state.selectedColor}`,
      icon: <span className={`debug-button-icon color-${state.selectedColor}`}>{getColorIcon()}</span>,
      colorClass: `color-${state.selectedColor}`,
      isFocused: focusedSection === 'color',
      isExpanded: expandedSection === 'color',
      onClick: () => toggleSection('color'),
      renderContent: () => (
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
      ),
    },
    // SHAPES SECTION: Select shape with buttons, then click "Add Shape" button to add to queue
    {
      id: 'shapes' as const,
      label: `Shapes - Current: ${state.selectedShape}`,
      icon: getShapeIcon(),
      isFocused: focusedSection === 'shapes',
      isExpanded: expandedSection === 'shapes',
      onClick: () => toggleSection('shapes'),
      renderContent: () => (
        <div className="shape-picker-container">
          <div className="shape-picker-grid">
            <button
              className={`shape-picker-button ${state.selectedShape === 'I' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('I')}
              title="I-Piece"
            >
              I
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'O' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('O')}
              title="O-Piece"
            >
              O
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'T' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('T')}
              title="T-Piece"
            >
              T
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'S' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('S')}
              title="S-Piece"
            >
              S
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'Z' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('Z')}
              title="Z-Piece"
            >
              Z
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'J' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('J')}
              title="J-Piece"
            >
              J
            </button>
            <button
              className={`shape-picker-button ${state.selectedShape === 'L' ? 'active' : ''}`}
              onClick={() => handleShapeSelection('L')}
              title="L-Piece"
            >
              L
            </button>
          </div>
          <button
            className="shape-add-button"
            onClick={handleAddShapeToQueue}
            title="Add selected shape to queue"
          >
            Add Shape
          </button>
        </div>
      ),
    },
    // VIEW SECTION: No additional click listeners
    {
      id: 'view' as const,
      label: 'View & Export',
      icon: <span className="debug-button-icon">👁</span>,
      isFocused: focusedSection === 'view',
      isExpanded: expandedSection === 'view',
      onClick: () => toggleSection('view'),
      renderContent: () => (
        <div className="debug-view-section">
          <button
            className={`debug-toggle-button ${state.showGridDots ? 'active' : ''}`}
            onClick={toggleGridDots}
          >
            <span className="debug-toggle-icon">⚏</span>
            <span className="debug-toggle-text">Grid Dots</span>
          </button>
          <button
            className="debug-export-compact-button"
            onClick={handleExportBoard}
          >
            📋 Export Board
          </button>
        </div>
      ),
    },
  ], [
    focusedSection,
    expandedSection,
    state.currentTool,
    state.selectedColor,
    state.selectedShape,
    state.showGridDots,
    toggleSection,
    getToolIcon,
    getColorIcon,
    getShapeIcon,
    handleShapeSelection,
    handleAddShapeToQueue,
    setTool,
    setColor,
    toggleGridDots,
    handleExportBoard,
  ]);

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
                <p><strong>Shape Picker:</strong> Select a shape type, then click "Add Shape" to add that shape (in the selected color) to the queue.</p>
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

      {/* Compact draggable tool palette */}
      <div
        ref={paletteRef}
        className={`debug-compact-palette ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        {/* Drag handle */}
        <div className="debug-drag-handle" onMouseDown={handleMouseDown}>
          <span className="debug-drag-icon">⋮⋮</span>
          <span className="debug-title">Debug</span>
          <button className="debug-close-x" onClick={closeEditor}>✕</button>
        </div>

        {/* Compact buttons */}
        <div className="debug-compact-buttons">
          {menuSections.map(section => (
            <DebugMenuSection key={section.id} {...section} />
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

export default DebugEditor;
