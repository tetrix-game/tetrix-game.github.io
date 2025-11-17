/**
 * Drag and drop types - Drag state and phase management
 */

import type { Shape, Location, Block } from './core';

// Drag phase-based animation system
export type DragPhase = 'none' | 'picking-up' | 'dragging' | 'placing' | 'returning';

export type DragState = {
  phase: DragPhase;
  selectedShape: Shape | null;
  selectedShapeIndex: number | null;
  isValidPlacement: boolean;
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
  invalidBlockPositions: Array<{ shapeRow: number; shapeCol: number }>; // Blocks that don't fit
  sourcePosition: { x: number; y: number; width: number; height: number } | null; // ShapeOption bounds
  targetPosition: { x: number; y: number } | null; // Grid cell position for placement
  placementLocation: Location | null; // Locked-in grid location at release time
  startTime: number | null;
};
