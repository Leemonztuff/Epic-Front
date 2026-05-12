import React from 'react';
import Image from 'next/image';

export default function Slot({ icon, empty = true }: { icon?: string | null; empty?: boolean }) {
  return (
    <div className="slot-circle w-14 h-14 flex items-center justify-center rounded-full border border-slate-600 bg-slate-800">
      {icon && !empty ? (
        <Image src={`/assets/icons/${icon}.png`} alt={icon} width={36} height={36} />
      ) : (
        <div className="text-slate-500 text-2xl">+</div>
      )}
    </div>
  );
}
