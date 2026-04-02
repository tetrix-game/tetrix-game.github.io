import { useState, useEffect, useRef, useCallback, useMemo, RefObject } from 'react';

interface ParticleData {
  id: string;
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  delay: number;
  size?: number;
  attractTo?: { x: number; y: number };
}

interface UseParticleShowerOptions {
  triggerValue: number; // Value to watch for changes (score, board clears, etc.)
  targetIconRef: RefObject<HTMLElement>; // Ref to the icon element for attraction
  particleSize?: number;
  particlesPerUnit?: number; // How many particles per unit change
  maxParticles?: number; // Maximum particles to spawn
  useExplosion?: boolean; // true = 360° explosion, false = falling particles
  particleDelay?: number; // Delay between each particle spawn (ms)
}

export function useParticleShower({
  triggerValue,
  targetIconRef,
  particleSize = 40,
  particlesPerUnit = 1,
  maxParticles = 100,
  useExplosion = true,
  particleDelay = 10,
}: UseParticleShowerOptions): {
  particles: ParticleData[];
  handleParticleComplete: (particleId: string) => void;
} {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const lastValueRef = useRef<number | null>(null);

  const centerScreenPosition = useMemo(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }), []);

  const getTargetPosition = useCallback((): { x: number; y: number } => {
    if (targetIconRef.current) {
      const rect = targetIconRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    return { x: 100, y: 50 }; // Fallback position
  }, [targetIconRef]);

  const generateParticles = useCallback((
    particleCount: number,
    origin: { x: number; y: number },
    isGaining: boolean,
  ): ParticleData[] => {
    const newParticles: ParticleData[] = [];
    let currentDelay = 0;

    for (let i = 0; i < particleCount; i++) {
      let velocityX: number;
      let velocityY: number;

      if (isGaining && useExplosion) {
        // 360-degree explosion with random velocities
        const angle = Math.random() * 2 * Math.PI;
        const baseSpeed = 150 + Math.random() * 250;

        velocityX = baseSpeed * Math.cos(angle);
        velocityY = baseSpeed * Math.sin(angle);
      } else {
        // Falling particles with slight horizontal drift
        velocityX = (Math.random() * 3 - 1.5) * 60;
        velocityY = 0; // Gravity will pull them down
      }

      newParticles.push({
        id: `particle-${i}-${Date.now()}-${Math.random()}`,
        startPosition: { ...origin },
        velocity: { x: velocityX, y: velocityY },
        delay: currentDelay,
        size: particleSize,
        attractTo: isGaining ? getTargetPosition() : undefined,
      });

      currentDelay += particleDelay;
    }

    return newParticles;
  }, [particleSize, useExplosion, particleDelay, getTargetPosition]);

  // Watch for changes in trigger value
  useEffect(() => {
    // Skip on initial mount
    if (lastValueRef.current === null) {
      lastValueRef.current = triggerValue;
      return;
    }

    // Only proceed if value actually changed
    if (triggerValue === lastValueRef.current) {
      return;
    }

    const valueChange = triggerValue - lastValueRef.current;
    const unitsForEffect = Math.abs(valueChange);
    const isGaining = valueChange > 0;

    if (unitsForEffect === 0) {
      lastValueRef.current = triggerValue;
      return;
    }

    // Determine particle count based on change
    const particleCount = Math.min(
      Math.floor(unitsForEffect * particlesPerUnit),
      maxParticles,
    );

    // Emit from center when gaining, from target when losing
    const emissionOrigin = isGaining ? centerScreenPosition : getTargetPosition();

    const newParticles = generateParticles(particleCount, emissionOrigin, isGaining);
    setParticles((prev) => [...prev, ...newParticles]);

    lastValueRef.current = triggerValue;
  }, [
    triggerValue,
    centerScreenPosition,
    generateParticles,
    particlesPerUnit,
    maxParticles,
    getTargetPosition,
  ]);

  const handleParticleComplete = useCallback((particleId: string): void => {
    setParticles((prev) => prev.filter((p) => p.id !== particleId));
  }, []);

  return {
    particles,
    handleParticleComplete,
  };
}
