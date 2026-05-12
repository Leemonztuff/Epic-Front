import React from 'react';

export default function StatTile({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="stat-tile flex flex-col items-center justify-center p-3 rounded-lg">
      <div className="stat-icon mb-1">{icon}</div>
      <div className="text-xs text-slate-300 uppercase">{label}</div>
      <div className="text-stat-value mt-1">{value}</div>
    </div>
  );
}
