import React, { useMemo } from 'react';
import './AttentionArrow.css';

type Point = { x: number; y: number };

type AttentionArrowProps = {
  targetPosition: Point | null;
  isVisible: boolean;
  message?: string;
  arrowLength?: number; // Length of the arrow in pixels
  offsetFromTarget?: number; // How far from the target center the arrow tip should stop
};

const AttentionArrow: React.FC<AttentionArrowProps> = ({
  targetPosition,
  isVisible,
  message,
  arrowLength = 100,
  offsetFromTarget = 60
}) => {
  const screenCenter = useMemo(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }), []);

  if (!isVisible || !targetPosition) return null;

  // Vector math to calculate position and rotation
  // Vector from Center to Target
  const vector = {
    x: targetPosition.x - screenCenter.x,
    y: targetPosition.y - screenCenter.y
  };

  // Calculate angle in radians
  const angleRad = Math.atan2(vector.y, vector.x);
  // Convert to degrees for CSS rotation
  const angleDeg = angleRad * (180 / Math.PI);

  // Normalize vector (unit vector)
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  const unitVector = {
    x: vector.x / magnitude,
    y: vector.y / magnitude
  };

  // Calculate arrow position
  // We want the tip to be at (Target - Offset)
  // And the arrow body extends backwards from there towards the center

  // Tip position (where the arrow points to)
  const tipPosition = {
    x: targetPosition.x - (unitVector.x * offsetFromTarget),
    y: targetPosition.y - (unitVector.y * offsetFromTarget)
  };

  // Tail position (where the arrow starts) - used for the "sliding" placement
  // Actually, we can just position the container at the tip position and rotate it
  // But to get the "sliding" behavior described:
  // "calculating the position of the arrow's tail relative to the Target's position (subtracting the length)"

  // Let's position the arrow container at the Tip Position
  // And rotate it so it points towards the target
  // Since the arrow character '⬆' points up, or '➔' points right, we need to adjust rotation

  // Using a standard arrow that points RIGHT (0 degrees) by default
  // We rotate it by angleDeg

  return (
    <div
      className="attention-arrow-container"
      style={{
        left: tipPosition.x,
        top: tipPosition.y,
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        '--arrow-length': `${arrowLength}px`,
      } as React.CSSProperties}
    >
      <div className="attention-arrow-body">
        <div className="attention-arrow-shaft"></div>
        <div className="attention-arrow-head"></div>
      </div>

      {message && (
        <div
          className="attention-arrow-message"
          style={{
            transform: `rotate(${-angleDeg}deg)`, // Counter-rotate text to keep it upright
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default AttentionArrow;
