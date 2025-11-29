import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { ScrollableMenu, type MenuSectionConfig } from '../ScrollableMenu';
import { useGridEditor } from './GridEditorContext';
import { NumberInputSubmenu } from './NumberInputSubmenu';
import { ColorBrushSubmenu } from './ColorBrushSubmenu';
import './GridEditor.css';

type SectionId = 'rows' | 'columns' | 'brush' | 'actions';

const GridEditor: React.FC = () => {
  const {
    state,
    closeEditor,
    setColor,
    setLastActiveSection,
    setGridHeight,
    setGridWidth,
    addTile,
    removeTile,
    clearAllTiles,
    exportGridLayout,
    hideInstructions,
    toggleGridDots,
  } = useGridEditor();

  // Navigation state
  const [focusedSection, setFocusedSection] = useState<SectionId>('brush');
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);
  const [navMode, setNavMode] = useState<'menu' | 'submenu'>('menu');

  // Toggle section on click
  const toggleSection = useCallback((section: SectionId) => {
    setFocusedSection(section);
    setExpandedSection(prev => {
      const newSection = prev === section ? null : section;
      setNavMode(newSection ? 'submenu' : 'menu');
      if (newSection && newSection !== 'actions') {
        setLastActiveSection(newSection);
      }
      return newSection;
    });
  }, [setLastActiveSection]);

  // Navigation handler
  const handleNavigation = useCallback((direction: 'forward' | 'backward') => {
    if (navMode === 'menu') {
      // Navigate between section buttons
      const sections: SectionId[] = ['rows', 'columns', 'brush', 'actions'];
      const currentIndex = sections.indexOf(focusedSection);
      const delta = direction === 'forward' ? 1 : -1;
      const nextIndex = (currentIndex + delta + sections.length) % sections.length;
      setFocusedSection(sections[nextIndex]);
      
      if (sections[nextIndex] !== 'actions') {
        setLastActiveSection(sections[nextIndex]);
      }
    }
    // In submenu mode, the context's cycleActiveSection handles the navigation
  }, [navMode, focusedSection, setLastActiveSection]);

  // Track painting state
  const [isPainting, setIsPainting] = useState(false);
  const lastPaintedTileRef = useRef<string | null>(null);

  // Helper function to get tile key from mouse event
  const getTileKeyFromMouseEvent = useCallback((e: MouseEvent): string | null => {
    const gridElement = document.querySelector('.grid');
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is within grid bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return null;
    }

    // Calculate which tile was clicked based on current grid dimensions
    const column = Math.floor((x / rect.width) * state.gridLayout.width) + 1;
    const row = Math.floor((y / rect.height) * state.gridLayout.height) + 1;

    if (row >= 1 && row <= state.gridLayout.height && column >= 1 && column <= state.gridLayout.width) {
      return `R${row}C${column}`;
    }
    
    return null;
  }, [state.gridLayout]);

  // Paint a tile
  const paintTile = useCallback((tileKey: string) => {
    if (state.currentTool === 'paint') {
      addTile(tileKey);
    } else if (state.currentTool === 'erase') {
      removeTile(tileKey);
    }
  }, [state.currentTool, addTile, removeTile]);

  // Handle mouse down - start painting
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Ignore clicks on UI elements (buttons, menus, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('.scrollable-menu-palette, .color-brush-submenu, button, .scrollable-menu-overlay')) {
      return;
    }

    const tileKey = getTileKeyFromMouseEvent(e);
    if (tileKey) {
      setIsPainting(true);
      lastPaintedTileRef.current = tileKey;
      paintTile(tileKey);
    }
  }, [getTileKeyFromMouseEvent, paintTile]);

  // Handle mouse move - continue painting while button is held
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPainting) return;
    
    const tileKey = getTileKeyFromMouseEvent(e);
    if (tileKey && tileKey !== lastPaintedTileRef.current) {
      lastPaintedTileRef.current = tileKey;
      paintTile(tileKey);
    }
  }, [isPainting, getTileKeyFromMouseEvent, paintTile]);

  // Handle mouse up - stop painting
  const handleMouseUp = useCallback(() => {
    setIsPainting(false);
    lastPaintedTileRef.current = null;
  }, []);

  // Set up mouse event listeners when brush submenu is expanded
  useEffect(() => {
    if (expandedSection !== 'brush') return;

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [expandedSection, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Handle export layout to clipboard
  const handleExportLayout = useCallback(() => {
    const layout = exportGridLayout();
    const layoutData = {
      width: layout.width,
      height: layout.height,
      tiles: Array.from(layout.tiles),
      tileBackgrounds: Array.from(layout.tileBackgrounds.entries()),
    };
    const jsonString = JSON.stringify(layoutData, null, 2);
    
    console.log('✅ Grid layout exported!');
    console.log('Layout data:', layoutData);
    console.log('JSON:', jsonString);
    
    const copyToClipboard = async () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(jsonString);
          alert('Grid layout copied to clipboard and logged to console!');
          return;
        } catch (err) {
          console.warn('Clipboard API failed, trying fallback:', err);
        }
      }
      
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
        alert('Grid layout copied to clipboard and logged to console!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Could not copy to clipboard, but data is logged to console!');
      }
    };
    
    copyToClipboard();
  }, [exportGridLayout]);

  // Get icon for current brush color
  const getBrushIcon = useCallback(() => {
    if (state.selectedColor === 'eraser') {
      return '✕';
    }
    return '🖌';
  }, [state.selectedColor]);

  // Define menu sections
  const menuSections: MenuSectionConfig<SectionId>[] = useMemo(() => [
    {
      id: 'rows' as const,
      label: `Rows - Current: ${state.gridLayout.height}`,
      icon: '↕',
      isFocused: focusedSection === 'rows',
      isExpanded: expandedSection === 'rows',
      onClick: () => toggleSection('rows'),
      renderContent: () => (
        <NumberInputSubmenu
          label="Grid Height (Rows)"
          value={state.gridLayout.height}
          min={2}
          max={20}
          onChange={setGridHeight}
          isExpanded={expandedSection === 'rows'}
        />
      ),
    },
    {
      id: 'columns' as const,
      label: `Columns - Current: ${state.gridLayout.width}`,
      icon: '↔',
      isFocused: focusedSection === 'columns',
      isExpanded: expandedSection === 'columns',
      onClick: () => toggleSection('columns'),
      renderContent: () => (
        <NumberInputSubmenu
          label="Grid Width (Columns)"
          value={state.gridLayout.width}
          min={2}
          max={20}
          onChange={setGridWidth}
          isExpanded={expandedSection === 'columns'}
        />
      ),
    },
    {
      id: 'brush' as const,
      label: `Brush - Color: ${state.selectedColor}`,
      icon: <span className={`grid-editor-button-icon ${state.selectedColor !== 'eraser' ? `color-${state.selectedColor}` : 'color-eraser'}`}>{getBrushIcon()}</span>,
      colorClass: state.selectedColor !== 'eraser' ? `color-${state.selectedColor}` : 'color-eraser',
      isFocused: focusedSection === 'brush',
      isExpanded: expandedSection === 'brush',
      onClick: () => toggleSection('brush'),
      renderContent: () => (
        <ColorBrushSubmenu
          selectedColor={state.selectedColor}
          onSelectColor={setColor}
        />
      ),
    },
    {
      id: 'actions' as const,
      label: 'Actions & View',
      icon: <span className="grid-editor-button-icon">⚙</span>,
      isFocused: focusedSection === 'actions',
      isExpanded: expandedSection === 'actions',
      onClick: () => toggleSection('actions'),
      renderContent: () => (
        <div className="grid-editor-actions-section">
          <button
            className={`grid-editor-toggle-button ${state.showGridDots ? 'active' : ''}`}
            onClick={toggleGridDots}
          >
            <span className="grid-editor-toggle-icon">⚏</span>
            <span className="grid-editor-toggle-text">Grid Dots</span>
          </button>
          <button
            className="grid-editor-action-button"
            onClick={clearAllTiles}
          >
            🗑 Clear All Tiles
          </button>
          <button 
            className="grid-editor-action-button" 
            onClick={handleExportLayout}
          >
            📋 Export Layout
          </button>
        </div>
      ),
    },
  ], [
    focusedSection,
    expandedSection,
    state.gridLayout,
    state.selectedColor,
    state.showGridDots,
    toggleSection,
    getBrushIcon,
    setGridHeight,
    setGridWidth,
    setColor,
    toggleGridDots,
    clearAllTiles,
    handleExportLayout,
  ]);

  // Instructions content
  const instructionsContent = (
    <div className="grid-editor-instructions">
      <p><strong>Grid Editor</strong> lets you design custom tile layouts.</p>
      <p><strong>Rows/Columns:</strong> Adjust grid dimensions (2-20). Scroll to increase/decrease.</p>
      <p><strong>Brush:</strong> Select a color or eraser. Click tiles on the grid to paint or erase them.</p>
      <p><strong>Navigation:</strong> Tab/Scroll to navigate menu, Space to open/close submenus.</p>
      <p><strong>Export:</strong> Copy your layout to clipboard for use in game configurations.</p>
      <p>Create sparse layouts like circles, islands, or custom shapes!</p>
    </div>
  );

  return (
    <ScrollableMenu<SectionId>
      isOpen={state.isEditorOpen}
      title="Grid"
      sections={menuSections}
      focusedSection={focusedSection}
      expandedSection={expandedSection}
      navMode={navMode}
      showInstructions={state.showInstructions}
      instructionsContent={instructionsContent}
      onClose={closeEditor}
      onHideInstructions={hideInstructions}
      onNavigate={handleNavigation}
      initialPosition={{ x: 20, y: 120 }}
    />
  );
};

export default GridEditor;
