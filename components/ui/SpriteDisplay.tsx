"use client";
import Image from 'next/image';
import spriteForJob from '@/lib/spriteMap';
import React from 'react';

type Props = {
  job: string;
  size?: number;
  className?: string;
  overlapPx?: number;
};

export default function SpriteDisplay({ job, size = 220, className = '', overlapPx = 28 }: Props) {
  const src = spriteForJob(job);
  return (
    <div className={`relative w-full ${className}`} style={{ height: size }}>
      <div className="mx-auto relative w-full h-full pointer-events-none">
        <div className="relative mx-auto w-[90%] h-full overflow-visible" style={{ maxWidth: size }}>
          <div
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ top: -overlapPx, width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <div className="sprite-image sprite-break-out">
              <Image src={src} alt={job} width={size} height={size} style={{ objectFit: 'contain' }} priority />
            </div>
          </div>
          <div className="card-portrait rounded-lg border p-2 mt-24 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
            {/* Marco / fondo del retrato: aquí queda vacío a propósito */}
          </div>
        </div>
      </div>
    </div>
  );
}
