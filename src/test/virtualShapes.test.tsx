import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import TetrixProvider from '../components/Tetrix/TetrixProvider';
import ShapeSelector from '../components/ShapeSelector';

describe('Virtual Shape System', () => {
  test('should render virtual shapes with full opacity (clipped by parent)', () => {
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

    // Last 1 should be virtual (but with full opacity, clipped by parent)
    const virtualShapes = container.querySelectorAll('.shape-container.virtual');
    expect(virtualShapes.length).toBe(1);

    // Virtual shape should be present in DOM (unlike opacity-based hiding)
    const virtualShape = virtualShapes[0] as HTMLElement;
    expect(virtualShape).toBeTruthy();
    expect(virtualShape.classList.contains('virtual')).toBe(true);
  });

  test('should use parent clipping to hide virtual shapes', () => {
    const { container } = render(
      <TetrixProvider>
        <ShapeSelector />
      </TetrixProvider>
    );

    // Parent container should have overflow:hidden to clip virtual shapes
    const shapeSelector = container.querySelector('.shape-selector') as HTMLElement;
    expect(shapeSelector).toBeTruthy();

    const selectorStyle = globalThis.getComputedStyle(shapeSelector);
    expect(selectorStyle.overflow).toBe('hidden');

    // Height should be calculated for visible shapes only (3 * 120px = 360px)
    expect(selectorStyle.height).toBe('360px');
  });
});