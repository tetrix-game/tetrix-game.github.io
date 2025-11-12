import React, { useEffect, useState, useRef } from 'react';
import BlueGemIcon from '../BlueGemIcon';
import './GemParticle.css';

interface GemParticleProps {
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  onComplete: () => void;
  delay?: number; // Stagger animation start
}

const GemParticle: React.FC<GemParticleProps> = ({
  startPosition,
  velocity,
  onComplete,
  delay = 0
}) => {
  const [currentPosition, setCurrentPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(0); // Start transparent for smooth fade-in
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Store initial props in refs to prevent re-renders from affecting animation
  const initialPropsRef = useRef({
    startPosition,
    velocity,
    onComplete,
    delay
  });

  // Animation constants
  const ANIMATION_DURATION = 1500; // 1.5 seconds
  const GRAVITY = 450; // pixels per second squared (1.5x increased from 300)
  const FADE_IN_DURATION = 100; // Fade in over 100ms
  const FADE_OUT_START_PERCENT = 0.7; // Start fading out at 70% through animation

  useEffect(() => {
    // Use initial props from ref to prevent animation restart on re-renders
    const { startPosition: initialStart, velocity: initialVelocity, onComplete: initialOnComplete, delay: initialDelay } = initialPropsRef.current;

    // Apply the delay before starting the animation
    const startDelay = setTimeout(() => {
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        if (!startTimeRef.current) return;

        const elapsed = (currentTime - startTimeRef.current) / 1000; // Convert to seconds
        const elapsedMs = elapsed * 1000;

        // Check if animation is complete
        if (elapsedMs >= ANIMATION_DURATION) {
          initialOnComplete();
          return;
        }

        // Physics: position = initial + velocity * time + 0.5 * gravity * time^2
        const newX = initialStart.x + initialVelocity.x * elapsed;
        const newY = initialStart.y + initialVelocity.y * elapsed + 0.5 * GRAVITY * elapsed * elapsed;

        // Calculate opacity with fade in and fade out
        const progress = elapsedMs / ANIMATION_DURATION;
        let newOpacity = 1;

        if (elapsedMs < FADE_IN_DURATION) {
          // Fade in during first 100ms
          newOpacity = elapsedMs / FADE_IN_DURATION;
        } else if (progress >= FADE_OUT_START_PERCENT) {
          // Fade out after 70% complete
          const fadeProgress = (progress - FADE_OUT_START_PERCENT) / (1 - FADE_OUT_START_PERCENT);
          newOpacity = Math.max(0, 1 - fadeProgress);
        }

        setCurrentPosition({ x: newX, y: newY });
        setOpacity(newOpacity);

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }, initialDelay);

    return () => {
      clearTimeout(startDelay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Empty dependency array - animation should only run once

  return (
    <div
      className="gem-particle"
      style={{
        '--particle-x': `${currentPosition.x}px`,
        '--particle-y': `${currentPosition.y}px`,
        '--particle-opacity': opacity,
      } as React.CSSProperties}
    >
      <BlueGemIcon size={40} />
    </div>
  );
};

export default GemParticle;