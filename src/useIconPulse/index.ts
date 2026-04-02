import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage icon pulse animation and trigger counter
 */
export function useIconPulse(): {
  isPulsing: boolean;
  triggerPulse: () => void;
} {
  const [pulseCount, setPulseCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  const triggerPulse = useCallback((): void => {
    setPulseCount((prev) => prev + 1);
    setIsPulsing(true);
  }, []);

  useEffect((): (() => void) | void => {
    if (isPulsing) {
      const timeout = setTimeout(() => {
        setIsPulsing(false);
      }, 300); // Pulse duration

      return (): void => clearTimeout(timeout);
    }
  }, [pulseCount, isPulsing]);

  return {
    isPulsing,
    triggerPulse,
  };
}
