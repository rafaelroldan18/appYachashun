import React from 'react';

// SVG sprite for commonly used icons to reduce bundle size
export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', visibility: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {/* Yachashun Logo */}
        <symbol id="yachashun-logo" viewBox="0 0 32 32">
          <path
            d="M16 2L4 8v16l12 6 12-6V8L16 2z"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 8v16M8 12l8 4 8-4M8 20l8 4 8-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>

        {/* Chakana (Andean Cross) */}
        <symbol id="chakana" viewBox="0 0 24 24">
          <path
            d="M12 2L20 10L12 18L4 10L12 2Z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <rect x="10" y="10" width="4" height="4" fill="currentColor" />
          <path
            d="M12 6V2M12 22V18M18 12H22M2 12H6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>

        {/* Mountain Pattern */}
        <symbol id="mountain" viewBox="0 0 24 24">
          <path
            d="M2 20L8 8L12 14L16 6L22 20H2Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M2 20L8 8L12 14L16 6L22 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Wave Pattern */}
        <symbol id="wave" viewBox="0 0 24 24">
          <path
            d="M2 12C4 8 6 8 8 12C10 16 12 16 14 12C16 8 18 8 20 12C22 16 24 16 26 12"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </symbol>

        {/* Success Check */}
        <symbol id="check-circle" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M9 12L11 14L15 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Warning */}
        <symbol id="warning-triangle" viewBox="0 0 24 24">
          <path
            d="M12 2L22 20H2L12 2Z"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 9V13M12 17H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>

        {/* Info */}
        <symbol id="info-circle" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M12 16V12M12 8H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}

interface SpriteIconProps {
  id: string;
  className?: string;
  size?: number;
}

export function SpriteIcon({ id, className = '', size = 24 }: SpriteIconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <use href={`#${id}`} />
    </svg>
  );
}