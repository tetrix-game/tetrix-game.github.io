import React, { useEffect, useState, useRef } from 'react';
import type { CurrencyDenomination } from '../../utils/currencyUtils';
import './CoinParticle.css';

interface CoinParticleProps {
  denomination: CurrencyDenomination;
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  onComplete: () => void;
  delay?: number; // Stagger animation start
}

const CoinParticle: React.FC<CoinParticleProps> = ({
  denomination,
  startPosition,
  velocity,
  onComplete,
  delay = 0
}) => {
  const [currentPosition, setCurrentPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Store initial props in refs to prevent re-renders from affecting animation
  const initialPropsRef = useRef({
    startPosition,
    velocity,
    onComplete,
    delay,
    denomination
  });

  // Animation constants
  const ANIMATION_DURATION = 1500; // 1.5 seconds
  const GRAVITY = 300; // pixels per second squared (reduced from 900)
  const FADE_START_PERCENT = 0.7; // Start fading at 70% through animation

  useEffect(() => {
    // Use initial props from ref to prevent animation restart on re-renders
    const { startPosition: initialStart, velocity: initialVelocity, onComplete: initialOnComplete, delay: initialDelay } = initialPropsRef.current;

    // Apply the delay before starting the animation
    const startDelay = setTimeout(() => {
      setIsVisible(true);
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        if (!startTimeRef.current) return;

        const elapsed = (currentTime - startTimeRef.current) / 1000; // Convert to seconds

        // Check if animation is complete
        if (elapsed * 1000 >= ANIMATION_DURATION) {
          initialOnComplete();
          return;
        }

        // Physics: position = initial + velocity * time + 0.5 * gravity * time^2
        const newX = initialStart.x + initialVelocity.x * elapsed;
        const newY = initialStart.y + initialVelocity.y * elapsed + 0.5 * GRAVITY * elapsed * elapsed - (window.innerHeight * 0.1);

        // Calculate opacity fade
        const progress = elapsed * 1000 / ANIMATION_DURATION;
        let newOpacity = 1;

        if (progress >= FADE_START_PERCENT) {
          const fadeProgress = (progress - FADE_START_PERCENT) / (1 - FADE_START_PERCENT);
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

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`coin-particle ${denomination.name.toLowerCase()}`}
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0) translate(-50%, -50%)`,
        opacity,
        color: denomination.color,
        willChange: 'transform, opacity',
      }}
    >
      {denomination.symbol}
    </div>
  );
};

export default CoinParticle;