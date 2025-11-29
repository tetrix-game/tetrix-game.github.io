import React from 'react';
import { createPortal } from 'react-dom';
import type { Shape } from '../../types';
import BlockVisual from '../BlockVisual';
import './QueueOverlay.css';

interface QueueOverlayProps {
  hiddenShapes: Shape[]; // Array of shapes not currently visible
  onClose: () => void; // Called when overlay is closed
}

/**
 * QueueOverlay - Displays hidden shapes in finite queue mode
 * 
 * Shows a modal overlay listing all shapes that are queued but not visible
 * in the main drag-and-drop interface
 */
const QueueOverlay: React.FC<QueueOverlayProps> = ({
  hiddenShapes,
  onClose,
}) => {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle clicking outside the content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="queue-overlay-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-overlay-title"
    >
      <div className="queue-overlay-content">
        <div className="queue-overlay-header">
          <h2 id="queue-overlay-title">Shape Queue</h2>
          <button
            className="queue-overlay-close"
            onClick={onClose}
            aria-label="Close queue overlay"
          >
            ✕
          </button>
        </div>

        <div className="queue-overlay-body">
          {hiddenShapes.length === 0 ? (
            <p className="queue-overlay-empty">No hidden shapes in queue</p>
          ) : (
            <div className="queue-overlay-shapes">
              {hiddenShapes.map((shape, index) => (
                <div key={`hidden-shape-${index}`} className="queue-overlay-shape">
                  <div className="queue-overlay-shape-label">#{index + 4}</div>
                  <div className="queue-overlay-shape-grid">
                    {shape.flatMap((row, rowIndex) =>
                      row.map((block, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="queue-overlay-shape-cell"
                        >
                          {block.isFilled && <BlockVisual block={block} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QueueOverlay;
