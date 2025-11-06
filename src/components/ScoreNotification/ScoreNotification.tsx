import React, { useState, useEffect, useRef } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import './ScoreNotification.css';

interface NotificationData {
  id: string;
  message: string;
  startTime: number;
  startPos: { x: number; y: number };
  velocity: { x: number; y: number };
  currentPos: { x: number; y: number };
  opacity: number;
}

const ScoreNotification: React.FC = () => {
  const { score } = useTetrixStateContext();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const animationRef = useRef<number>();
  const lastScoreRef = useRef(score);

  // Animation constants
  const ANIMATION_DURATION = 2000; // 2 seconds in milliseconds
  const GRAVITY = 800; // pixels per second squared

  // Animation loop
  useEffect(() => {
    if (notifications.length === 0) return;

    const processNotifications = (currentTime: number, prevNotifications: NotificationData[]) => {
      const updatedNotifications: NotificationData[] = [];

      for (const notification of prevNotifications) {
        const elapsed = (currentTime - notification.startTime) / 1000;

        // Skip if animation is complete
        if ((currentTime - notification.startTime) >= ANIMATION_DURATION) {
          continue;
        }

        // Physics: position = initial + velocity * time + 0.5 * gravity * time^2
        const newX = notification.startPos.x + notification.velocity.x * elapsed;
        const newY = notification.startPos.y + notification.velocity.y * elapsed + 0.5 * GRAVITY * elapsed * elapsed;

        // Fade out over the animation duration - stay at 100% for first half, then fade
        const progress = (currentTime - notification.startTime) / ANIMATION_DURATION;
        let opacity: number;

        if (progress <= 0.5) {
          // First half: stay at 100% opacity
          opacity = 1;
        } else {
          // Second half: fade from 100% to 0%
          const fadeProgress = (progress - 0.5) / 0.5; // Normalize 0.5-1.0 to 0-1
          opacity = Math.max(0, 1 - fadeProgress);
        }

        updatedNotifications.push({
          ...notification,
          currentPos: { x: newX, y: newY },
          opacity
        });
      }

      return updatedNotifications;
    };

    const animate = (currentTime: number) => {
      setNotifications(prevNotifications => processNotifications(currentTime, prevNotifications));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [notifications.length]);

  // Score change detection
  useEffect(() => {
    if (score > lastScoreRef.current) {
      const pointsEarned = score - lastScoreRef.current;
      const message = `+${pointsEarned} points!`;

      console.log('🎉 ScoreNotification: Creating notification for', pointsEarned, 'points');

      // Calculate random trajectory within 15 degrees of vertical (75° to 105°)
      const angle = (75 + Math.random() * 30) * (Math.PI / 180);
      const initialSpeed = 300 + Math.random() * 200; // 300-500 pixels per second

      // Convert angle to velocity components
      const velocityX = initialSpeed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1); // Random left/right
      const velocityY = -initialSpeed * Math.sin(angle); // Negative because up is negative in screen coords

      const newNotification: NotificationData = {
        id: `${Date.now()}-${Math.random()}`, // Unique ID
        message,
        startTime: performance.now(),
        startPos: { x: 0, y: 0 }, // Start at CSS center (0,0 relative to transform)
        velocity: { x: velocityX, y: velocityY },
        currentPos: { x: 0, y: 0 }, // Start at CSS center
        opacity: 1
      };

      console.log('🎉 ScoreNotification: Created notification:', newNotification);

      setNotifications(prev => [...prev, newNotification]);
    }
    lastScoreRef.current = score;
  }, [score]);

  // Test button for debugging (remove in production)
  const testNotification = () => {
    const newNotification: NotificationData = {
      id: `test-${Date.now()}`,
      message: '+10 TEST points!',
      startTime: performance.now(),
      startPos: { x: 0, y: 0 },
      velocity: { x: 0, y: -200 },
      currentPos: { x: 0, y: 0 },
      opacity: 1
    };
    console.log('🎯 TEST: Creating test notification:', newNotification);
    setNotifications(prev => [...prev, newNotification]);
  };

  return (
    <>
      {/* Temporary test button - remove in production */}
      <button
        onClick={testNotification}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 20000,
          padding: '10px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        TEST NOTIFICATION
      </button>

      {notifications.map(notification => (
        <div
          key={notification.id}
          className="score-notification"
          style={{
            transform: `translate(${notification.currentPos.x}px, ${notification.currentPos.y}px)`,
            opacity: notification.opacity,
          }}
        >
          {notification.message}
        </div>
      ))}
    </>
  );
};

export default ScoreNotification;