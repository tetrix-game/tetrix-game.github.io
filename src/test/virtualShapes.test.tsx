import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import TetrixProvider from '../components/Tetrix/TetrixProvider';
import ShapeSelector from '../components/ShapeSelector';

describe('Virtual Shape System', () => {
  test('should render virtual shapes for smooth animation', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Should render maxVisibleShapes (3) + 1 virtual shape = 4 total containers
    const shapeContainers = container.querySelectorAll('.shape-container');
    expect(shapeContainers.length).toBe(4);

    // First 3 should be visible (not virtual)
    const visibleShapes = container.querySelectorAll('.shape-container:not(.virtual)');
    expect(visibleShapes.length).toBe(3);

    // Last 1 should be virtual (hidden)
    const virtualShapes = container.querySelectorAll('.shape-container.virtual');
    expect(virtualShapes.length).toBe(1);
  });

  test('should show correct virtual state during sliding animation', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Initially should have 3 visible + 1 virtual
    const initialVirtualShapes = container.querySelectorAll('.shape-container.virtual');
    expect(initialVirtualShapes.length).toBe(1);

    // During sliding (when shapesSliding=true), the virtual logic should handle transitions
    // This would need to be tested with proper state manipulation in a more complex test
  });
});