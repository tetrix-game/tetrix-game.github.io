import React, { useEffect, useState, useRef } from 'react';

import './Particle.css';

interface ParticleProps {
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  onComplete: () => void;
  onArrive?: () => void; // Callback when particle reaches its destination (before complete)
  delay?: number;
  size?: number;
  attractTo?: { x: number; y: number };
  icon: React.ReactNode; // The icon to display (gem, sparkle, etc.)
  glowColor?: string; // Color for drop-shadow glow effect
  trailColor?: string; // Color for particle trail
}

export const Particle: React.FC<ParticleProps> = ({
  startPosition,
  velocity,
  onComplete,
  onArrive,
  delay = 0,
  size = 40,
  attractTo,
  icon,
  glowColor = 'rgba(65, 105, 225, 0.8)', // Default blue for gems
  trailColor = 'rgba(65, 105, 225, 0.6)',
}) => {
  const [currentPosition, setCurrentPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(0);
  const [trailPositions, setTrailPositions] = useState<
    Array<{ x: number; y: number; opacity: number }>
  >([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const initialPropsRef = useRef({
    startPosition,
    velocity,
    onComplete,
    onArrive,
    delay,
    attractTo,
  });

  const isAttractionMode = !!attractTo;
  const ANIMATION_DURATION = isAttractionMode ? 2000 : 1500;
  const GRAVITY = isAttractionMode ? 0 : 450;
  const ATTRACTION_STRENGTH = 800;
  const FADE_IN_DURATION = 100;
  const FADE_OUT_START_PERCENT = 0.7;
  const SNAP_DISTANCE = 5;
  const TRAIL_LENGTH = 3; // Number of trail particles
  const TRAIL_SPACING = 50; // Milliseconds between trail particles

  useEffect(() => {
    const {
      startPosition: initialStart,
      velocity: initialVelocity,
      onComplete: initialOnComplete,
      onArrive: initialOnArrive,
      delay: initialDelay,
      attractTo: target,
    } = initialPropsRef.current;

    const currentVelocity = { x: initialVelocity.x, y: initialVelocity.y };
    const positionHistory: Array<{ x: number; y: number; time: number }> = [];

    const startDelay = setTimeout(() => {
      startTimeRef.current = performance.now();
      let lastFrameTime = performance.now();
      const currentPos = { ...initialStart };

      const animate = (currentTime: number): void => {
        if (!startTimeRef.current) return;

        const elapsed = (currentTime - startTimeRef.current) / 1000;
        const elapsedMs = elapsed * 1000;
        const deltaTime = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;

        if (elapsedMs >= ANIMATION_DURATION) {
          initialOnComplete();
          return;
        }

        if (target) {
          const dx = target.x - currentPos.x;
          const dy = target.y - currentPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= SNAP_DISTANCE) {
            setCurrentPosition(target);
            setOpacity(1);
            // Call onArrive callback for effects (pulse, sound, etc.)
            if (initialOnArrive) {
              initialOnArrive();
            }
            setTimeout((): void => initialOnComplete(), 50);
            return;
          }

          const dirX = dx / distance;
          const dirY = dy / distance;
          const attractionForce = ATTRACTION_STRENGTH * deltaTime;

          currentVelocity.x += dirX * attractionForce;
          currentVelocity.y += dirY * attractionForce;

          currentPos.x += currentVelocity.x * deltaTime;
          currentPos.y += currentVelocity.y * deltaTime;
        } else {
          currentPos.x = initialStart.x + currentVelocity.x * elapsed;
          currentPos.y = initialStart.y
            + currentVelocity.y * elapsed
            + 0.5 * GRAVITY * elapsed * elapsed;
        }

        // Update position history for trail
        positionHistory.push({ x: currentPos.x, y: currentPos.y, time: currentTime });

        // Create trail particles from history
        const trails: Array<{ x: number; y: number; opacity: number }> = [];
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          const trailTime = currentTime - (i + 1) * TRAIL_SPACING;
          // Find closest position in history
          const historyEntry = positionHistory.find((h): boolean => h.time <= trailTime);
          if (historyEntry) {
            const trailOpacity = (1 - i / TRAIL_LENGTH) * 0.6; // Fade out trail
            trails.push({ x: historyEntry.x, y: historyEntry.y, opacity: trailOpacity });
          }
        }
        setTrailPositions(trails);

        // Limit history size for performance
        if (positionHistory.length > 100) {
          positionHistory.shift();
        }

        const progress = elapsedMs / ANIMATION_DURATION;
        let newOpacity = 1;

        if (elapsedMs < FADE_IN_DURATION) {
          newOpacity = elapsedMs / FADE_IN_DURATION;
        } else if (!target && progress >= FADE_OUT_START_PERCENT) {
          const fadeProgress = (progress - FADE_OUT_START_PERCENT) / (1 - FADE_OUT_START_PERCENT);
          newOpacity = Math.max(0, 1 - fadeProgress);
        }

        setCurrentPosition({ x: currentPos.x, y: currentPos.y });
        setOpacity(newOpacity);

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }, initialDelay);

    return (): void => {
      clearTimeout(startDelay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Trail particles */}
      {trailPositions.map((trailPos, index) => (
        <div
          key={`trail-${index}`}
          className="particle particle-trail"
          style={{
            '--particle-x': `${trailPos.x}px`,
            '--particle-y': `${trailPos.y}px`,
            '--particle-opacity': trailPos.opacity,
            '--particle-size': `${size * 0.7}px`,
            '--particle-glow': trailColor,
          } as React.CSSProperties}
        >
          {icon}
        </div>
      ))}

      {/* Main particle */}
      <div
        className="particle"
        style={{
          '--particle-x': `${currentPosition.x}px`,
          '--particle-y': `${currentPosition.y}px`,
          '--particle-opacity': opacity,
          '--particle-size': `${size}px`,
          '--particle-glow': glowColor,
        } as React.CSSProperties}
      >
        {icon}
      </div>
    </>
  );
};
