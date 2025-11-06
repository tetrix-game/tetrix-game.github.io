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
  const [lastScore, setLastScore] = useState(score);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const animationRef = useRef<number>();

  // Animation constants
  const ANIMATION_DURATION = 1000; // 1 second in milliseconds
  const GRAVITY = 800; // pixels per second squared
  const SCREEN_CENTER_X = globalThis.window ? globalThis.window.innerWidth / 2 : 400;
  const SCREEN_CENTER_Y = globalThis.window ? globalThis.window.innerHeight / 2 : 300;

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

        // Fade out over the animation duration
        const progress = (currentTime - notification.startTime) / ANIMATION_DURATION;
        const opacity = Math.max(0, 1 - progress);

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
    if (score > lastScore) {
      const pointsEarned = score - lastScore;
      const message = `+${pointsEarned} points!`;

      // Get current screen center (recalculated each time for responsive behavior)
      const screenCenterX = globalThis.window ? globalThis.window.innerWidth / 2 : 400;
      const screenCenterY = globalThis.window ? globalThis.window.innerHeight / 2 : 300;

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
        startPos: { x: screenCenterX, y: screenCenterY },
        velocity: { x: velocityX, y: velocityY },
        currentPos: { x: screenCenterX, y: screenCenterY },
        opacity: 1
      };

      setNotifications(prev => [...prev, newNotification]);
      setLastScore(score);
    }
  }, [score, lastScore]);

  return (
    <>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="score-notification"
          style={{
            transform: `translate(${notification.currentPos.x - SCREEN_CENTER_X}px, ${notification.currentPos.y - SCREEN_CENTER_Y}px)`,
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