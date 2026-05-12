import React from 'react';
import Image from 'next/image';
import spriteForJob from '@/lib/spriteMap';

export default function EvolutionBar({ jobs }: { jobs?: string[] }) {
  const list = jobs || [];
  if (list.length === 0) return <div className="text-slate-400 text-sm">No hay evoluciones</div>;

  return (
    <div className="flex gap-3">
      {list.map((job) => (
        <div key={job} className="evo-card flex items-center gap-3 p-2 rounded-lg bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700 w-full">
          <div className="w-14 h-14 relative flex-shrink-0">
            <Image src={spriteForJob(job, 'portrait')} alt={job} width={56} height={56} style={{ objectFit: 'contain' }} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm text-white font-semibold">{job}</div>
            <div className="text-xs text-slate-300">Ruta</div>
          </div>
          <div className="text-amber-400 font-bold">→</div>
        </div>
      ))}
    </div>
  );
}
