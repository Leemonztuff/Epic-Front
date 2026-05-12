import React from 'react';
import Image from 'next/image';

export default function Slot({ icon, empty = true }: { icon?: string | null; empty?: boolean }) {
  return (
    <div className="slot-circle w-12 sm:w-14 h-12 sm:h-14 flex items-center justify-center rounded-full border border-slate-600 bg-slate-800 shrink-0">
      {icon && !empty ? (
        <Image src={`/assets/icons/${icon}.png`} alt={icon} width={28} height={28} />
      ) : (
        <div className="text-slate-500 text-xl sm:text-2xl">+</div>
      )}
    </div>
  );
}
