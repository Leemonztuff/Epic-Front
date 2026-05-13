'use client';
import React from 'react';

export default function Frame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-visible ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5C76B]/5 via-transparent to-transparent rounded-xl pointer-events-none" />
      {children}
    </div>
  );
}
