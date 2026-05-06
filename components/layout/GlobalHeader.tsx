'use client';

import React from 'react';
import { Coins, Diamond, Zap, Bell, Gift, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface GlobalHeaderProps {
  profile: any;
  onNavigate: (view: any) => void;
}

export function GlobalHeader({ profile, onNavigate }: GlobalHeaderProps) {
  if (!profile) return null;

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between z-50 bg-gradient-to-b from-[#0B1A2A] to-transparent pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="relative group cursor-pointer" onClick={() => onNavigate('profile')}>
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5C76B] to-amber-700 p-[1px]">
              <div className="w-full h-full rounded-xl bg-[#0B1A2A] flex items-center justify-center overflow-hidden">
                 <img src="/assets/ui/ui_icon_novice_64.png" className="w-8 h-8 object-contain" alt="Avatar"
                      onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jules'; }} />
              </div>
           </div>
           <div className="absolute -bottom-1 -right-1 bg-[#F5C76B] text-[#0B1A2A] text-[8px] font-black px-1 rounded-sm border border-[#0B1A2A]">
              LV.{profile.level || 1}
           </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 pointer-events-auto">
        <ResourceItem icon={Zap} value={profile.energy || 0} maxValue={100} color="text-blue-400" />
        <ResourceItem icon={Coins} value={profile.currency || 0} color="text-[#F5C76B]" />
        <ResourceItem icon={Diamond} value={profile.premium_currency || 0} color="text-cyan-400" />

        <button
          onClick={() => onNavigate('daily_rewards')}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative"
        >
          <Bell size={18} className="text-white/60" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0B1A2A]" />
        </button>
      </div>
    </header>
  );
}

function ResourceItem({ icon: Icon, value, maxValue, color }: any) {
  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl">
      <Icon size={14} className={color} />
      <div className="flex flex-col items-start leading-none">
        <span className="text-[11px] font-black text-white tabular-nums">
          {value.toLocaleString()}
          {maxValue && <span className="text-white/30 text-[9px] ml-0.5">/{maxValue}</span>}
        </span>
      </div>
    </div>
  );
}
