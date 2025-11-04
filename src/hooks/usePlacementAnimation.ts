import { useEffect, useRef } from 'react';
import { useTetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import type { PlacementAnimationState } from '../utils/types';

/**
 * Hook to manage the shape placement animation lifecycle
 * Handles only the 300ms movement animation - DraggingShape unmounts after completion
 */
export function usePlacementAnimation(
  placementAnimationState: PlacementAnimationState,
  animationStartPosition: { x: number; y: number } | null,
  animationTargetPosition: { x: number; y: number } | null
) {
  const dispatch = useTetrixDispatchContext();
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (placementAnimationState === 'animating' && animationStartPosition && animationTargetPosition) {
      console.log('[Animation] Starting 300ms movement phase');
      const ANIMATION_DURATION = 300;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        if (progress >= 1) {
          console.log('[Animation] Movement complete → settling');
          dispatch({ type: 'COMPLETE_PLACEMENT_ANIMATION' });
          animationRef.current = null;
        } else {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [placementAnimationState, animationStartPosition, animationTargetPosition, dispatch]);

  return {
    isAnimating: placementAnimationState === 'animating',
  };
}
