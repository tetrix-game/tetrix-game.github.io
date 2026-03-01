import React from 'react';

interface BoardClearIconProps {
  size?: number;
  className?: string;
}

export const BoardClearIcon: React.FC<BoardClearIconProps> = ({ size, className = '' }) => {
  // If size is provided, use it. Otherwise, let CSS control dimensions
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      {...sizeProps}
      viewBox="0 0 24 24"
      className={`board-clear-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient definitions for gold sparkle effect */}
      <defs>
        <radialGradient id="goldSparkleGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="30%" stopColor="#FFD700" />
          <stop offset="70%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </radialGradient>
        <radialGradient id="goldCenterGradient" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#FFFACD" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFA500" stopOpacity="0.4" />
        </radialGradient>
        <filter id="sparkleGlow">
          <feGaussianBlur stdDeviation="0.6" />
          <feColorMatrix type="matrix" values="1 0 0 0 0 0 0.84 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        </filter>
      </defs>

      {/* Main starburst rays */}
      <g fill="url(#goldSparkleGradient)" stroke="#DAA520" strokeWidth="0.3">
        {/* Primary 4-point star */}
        <path d="M12 2 L13 10 L12 11 L11 10 Z" />
        <path d="M12 22 L13 14 L12 13 L11 14 Z" />
        <path d="M2 12 L10 13 L11 12 L10 11 Z" />
        <path d="M22 12 L14 13 L13 12 L14 11 Z" />

        {/* Secondary diagonal rays */}
        <path d="M5 5 L10 10 L11 11 L10.5 9.5 L9.5 10.5 Z" />
        <path d="M19 19 L14 14 L13 13 L13.5 14.5 L14.5 13.5 Z" />
        <path d="M19 5 L14 10 L13 11 L13.5 9.5 L14.5 10.5 Z" />
        <path d="M5 19 L10 14 L11 13 L10.5 14.5 L9.5 13.5 Z" />
      </g>

      {/* Central circle/core */}
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="url(#goldCenterGradient)"
        stroke="#DAA520"
        strokeWidth="0.5"
      />

      {/* Inner highlight for depth */}
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="#FFFACD"
        opacity="0.7"
      />

      {/* Glow effect around entire icon */}
      <g filter="url(#sparkleGlow)" opacity="0.5">
        <path d="M12 2 L13 10 L12 11 L11 10 Z" fill="#FFD700" />
        <path d="M12 22 L13 14 L12 13 L11 14 Z" fill="#FFD700" />
        <path d="M2 12 L10 13 L11 12 L10 11 Z" fill="#FFD700" />
        <path d="M22 12 L14 13 L13 12 L14 11 Z" fill="#FFD700" />
      </g>
    </svg>
  );
};
