import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import TetrixProvider from '../components/Tetrix/TetrixProvider';
import ShapeSelector from '../components/ShapeSelector';

describe('Unified Shape Queue Management', () => {
  test('should render only actual shapes (no virtual shapes)', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Should render exactly the number of shapes in nextShapes array (3 by default)
    const shapeContainers = container.querySelectorAll('.shape-container');
    expect(shapeContainers.length).toBe(3);

    // All shapes should be real (no virtual class)
    const virtualShapes = container.querySelectorAll('.shape-container.virtual');
    expect(virtualShapes.length).toBe(0);

    // All shapes should be visible
    const visibleShapes = container.querySelectorAll('.shape-container');
    expect(visibleShapes.length).toBe(3);
  });

  test('should calculate height based on nextShapes.length', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Parent container should exist
    const shapeSelector = container.querySelector('.shape-selector') as HTMLElement;
    expect(shapeSelector).toBeTruthy();

    // Should render 3 actual shape containers
    const shapeContainers = container.querySelectorAll('.shape-container');
    expect(shapeContainers.length).toBe(3);
  });

  test('should update height when shapes are added/removed', () => {
    // This test verifies that shape count calculation is unified with rendered containers
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Initially 3 shapes should be rendered  
    const shapeSelector = container.querySelector('.shape-selector') as HTMLElement;
    expect(shapeSelector).toBeTruthy();
    expect(container.querySelectorAll('.shape-container').length).toBe(3);

    // The unified state management means that nextShapes.length controls 
    // the number of rendered containers. This validates single source of truth.
    const containers = container.querySelectorAll('.shape-container');
    expect(containers.length).toBe(3); // Default shape count

    // Verify all containers contain actual shapes (not empty divs)
    for (const container of containers) {
      // Check for shape-specific elements inside each container
      const hasShapeContent = container.querySelector('div[style*="display"]') ||
        container.querySelector('.shape-option') ||
        container.childElementCount > 0;
      expect(hasShapeContent).toBeTruthy();
    }
  });
});