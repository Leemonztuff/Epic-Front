import React from 'react';
import Image from 'next/image';

export default function Frame({ children, className = '', frameSrc = '/assets/bg/frame_portrait.png' }: { children: React.ReactNode; className?: string; frameSrc?: string }) {
  return (
    <div className={`relative overflow-visible ${className}`}>
      {/* Decorative frame background if asset exists */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <Image src={frameSrc} alt="frame-bg" fill style={{ objectFit: 'cover' }} priority />
      </div>
      {children}
    </div>
  );
}
