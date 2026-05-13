'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function EvolutionBar({ jobs }: { jobs: string[] }) {
  if (!jobs.length) return null;
  return (
    <div className="flex items-center gap-2">
      {jobs.map((job, i) => (
        <React.Fragment key={job}>
          <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[9px] font-black text-purple-400 uppercase tracking-wider">
            {job}
          </div>
          {i < jobs.length - 1 && <ArrowRight size={12} className="text-white/20 shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}
