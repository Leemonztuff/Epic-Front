'use client';

import React from 'react';
import { Coins, Diamond, Zap, Gift, TrendingUp } from 'lucide-react';
import { LOGIN_BONUS_SCHEDULE } from '@/lib/config/login-bonus';
import { PROGRESSION_LEVELS } from '@/lib/config/level-curve';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';

const RESOURCES = [
  { label: 'Gold', key: 'currency', icon: Coins, color: 'text-[#F5C76B]', value: 'Soft currency for pulls, shop' },
  { label: 'Gems', key: 'gems', icon: Diamond, color: 'text-cyan-400', value: 'Premium currency' },
  { label: 'Energy', key: 'energy', icon: Zap, color: 'text-purple-400', value: 'Regens 1/4min, max 20' },
];

export default function AdminEconomyPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Economy</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Currency & Progression Balance</p>
      </div>

      {/* Resources */}
      <div className="grid sm:grid-cols-3 gap-4">
        {RESOURCES.map(r => (
          <div key={r.key} className="bg-black/40 border border-white/5 rounded-2xl p-5 panel-elevated">
            <div className="flex items-center gap-3 mb-3">
              <r.icon size={18} className={r.color} />
              <h3 className="text-sm font-black text-white uppercase font-display">{r.label}</h3>
            </div>
            <p className="text-[10px] text-white/40">{r.value}</p>
          </div>
        ))}
      </div>

      {/* Login Bonus */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Gift size={14} className="text-amber-400" />
          Login Bonus — 7-Day Schedule
        </h2>
        <div className="flex justify-center gap-3">
          {LOGIN_BONUS_SCHEDULE.length > 0 ? (
            LOGIN_BONUS_SCHEDULE.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-black/60 rounded-xl border border-white/5 min-w-[80px]">
                <span className="text-[8px] font-black text-white/30 uppercase">Day {day.day}</span>
                <Coins size={16} className="text-[#F5C76B]" />
                <span className="text-sm font-black text-white">{day.currency}</span>
                {day.premiumCurrency > 0 && (
                  <div className="flex items-center gap-1">
                    <Diamond size={10} className="text-cyan-400" />
                    <span className="text-[10px] font-black text-cyan-400">+{day.premiumCurrency}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-[10px] text-white/30">No login bonus data</p>
          )}
        </div>
      </div>

      {/* Level Curve Preview */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-cyan-400" />
          Level Curve — Preview
        </h2>
        <div className="space-y-1">
          {PROGRESSION_LEVELS.length > 0 ? (
            [1, 10, 25, 50].filter(l => l <= PROGRESSION_LEVELS.length).map(lvl => {
              const entry = PROGRESSION_LEVELS[lvl - 1];
              return (
                <div key={lvl} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-[10px]">
                  <span className="font-black text-white/60">Level {lvl}</span>
                  <span className="font-black text-white/40">EXP: {entry?.expRequired?.toLocaleString() || '-'}</span>
                  <span className="font-black text-white/40">Energy: {entry?.energyCost || '-'}</span>
                  <span className="font-black text-white/40">Enemy Power: {entry?.enemyPower || '-'}</span>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-white/30">No level curve data</p>
          )}
        </div>
      </div>
    </div>
  );
}
