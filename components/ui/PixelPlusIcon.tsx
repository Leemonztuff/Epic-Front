import React from 'react';

export default function PixelPlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" ry="3" strokeWidth="1.2" />
      <path d="M12 8v8M8 12h8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PixelPlusIcon({ size = 16, className = '' }: { size: number; className?: string }) {
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
