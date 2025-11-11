import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ShapeSelector from '../components/ShapeSelector';
import TetrixProvider from '../components/Tetrix/TetrixProvider';

// Mock the persistence utilities to avoid IndexedDB issues in tests
vi.mock('../utils/persistenceUtils', () => ({
  loadCompleteGameState: vi.fn().mockResolvedValue({
    score: 0,
    tiles: [],
    shapes: [],
    gameState: {
      currentLevel: 1,
      queueSize: -1,
      shapesUsed: 0,
    }
  }),
  safeBatchSave: vi.fn().mockResolvedValue(undefined),
  loadModifiers: vi.fn().mockResolvedValue([]),
}));

describe('ShapeSelector 4-Element Limit', () => {
  test('should display at most 4 shapes by default', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Should display at most 4 shapes
    const shapeContainers = container.querySelectorAll('.shape-container');
    expect(shapeContainers.length).toBeLessThanOrEqual(4);
  });

  test('should have shapes container with proper CSS class', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Should have shapes-container div with new naming
    const shapesContainer = container.querySelector('.shape-selector-shapes-container');
    expect(shapesContainer).toBeTruthy();
  });

  test('should have shape selector with proper styling classes', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    const shapeSelector = container.querySelector('.shape-selector');
    expect(shapeSelector).toBeTruthy();
  });

  test('should display queue indicator with infinity symbol', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Should have a queue indicator
    const queueIndicator = container.querySelector('.shape-queue-indicator');
    expect(queueIndicator).toBeTruthy();

    // Should have an infinity symbol for infinite queue
    const infinitySymbol = container.querySelector('.shape-queue-indicator-count');
    expect(infinitySymbol).toBeTruthy();
    expect(infinitySymbol?.textContent).toBe('∞');
  });

  test('should position queue indicator inline with shapes', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    const shapesContainer = container.querySelector('.shape-selector-shapes-container');
    expect(shapesContainer).toBeTruthy();

    // Queue indicator should be outside the shapes container but inside the shape selector
    const shapeSelector = container.querySelector('.shape-selector');
    const queueIndicator = shapeSelector?.querySelector('.shape-queue-indicator');
    expect(queueIndicator).toBeTruthy();

    // Should be a sibling of shapes-container, not inside it
    const queueIndicatorInShapesContainer = shapesContainer?.querySelector('.shape-queue-indicator');
    expect(queueIndicatorInShapesContainer).toBeFalsy();

    // Both shapes-container and queue indicator should be direct children of shape-selector
    const allChildren = shapeSelector?.children;
    expect(allChildren).toBeTruthy();

    // Should contain both shapes-container and queue indicator as direct children
    const hasShapesContainer = Array.from(allChildren || []).some(child =>
      child.classList.contains('shape-selector-shapes-container')
    );
    const hasQueueIndicator = Array.from(allChildren || []).some(child =>
      child.classList.contains('shape-queue-indicator')
    );

    expect(hasShapesContainer).toBe(true);
    expect(hasQueueIndicator).toBe(true);
  });
});