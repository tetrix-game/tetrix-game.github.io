import { useEffect, useRef } from 'react';
import { useTetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import type { PlacementAnimationState } from '../utils/types';

/**
 * Hook to manage the shape placement animation lifecycle
 * Coordinates the transition from DraggingShape to visible hoveredBlockPositions
 */
export function usePlacementAnimation(
  placementAnimationState: PlacementAnimationState,
  animationStartPosition: { x: number; y: number } | null,
  animationTargetPosition: { x: number; y: number } | null
) {
  const dispatch = useTetrixDispatchContext();
  const animationRef = useRef<number | null>(null);
  const settlingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (placementAnimationState === 'animating' && animationStartPosition && animationTargetPosition) {
      // Animation duration in milliseconds
      const ANIMATION_DURATION = 300;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        if (progress >= 1) {
          // Animation complete - transition to settling
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

    if (placementAnimationState === 'settling') {
      // After a brief delay for the settling animation to play, finish
      const SETTLING_DURATION = 200;
      
      settlingTimeoutRef.current = window.setTimeout(() => {
        dispatch({ type: 'FINISH_SETTLING_ANIMATION' });
      }, SETTLING_DURATION);

      return () => {
        if (settlingTimeoutRef.current !== null) {
          clearTimeout(settlingTimeoutRef.current);
        }
      };
    }
  }, [placementAnimationState, animationStartPosition, animationTargetPosition, dispatch]);

  return {
    isAnimating: placementAnimationState === 'animating',
    isSettling: placementAnimationState === 'settling',
  };
}
