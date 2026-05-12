import React from 'react';

interface PixelPlusIconProps {
  size?: number;
  className?: string;
}

export default function PixelPlusIcon({ size = 16, className = '' }: PixelPlusIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="7" y="1" width="2" height="14" fill="currentColor" />
      <rect x="1" y="7" width="14" height="2" fill="currentColor" />
    </svg>
  );
}
