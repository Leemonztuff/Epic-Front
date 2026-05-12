'use client';

import { motion } from 'motion/react';
import {
  Users, Sparkles, Coins, BookOpen, Shield,
  BarChart3, Activity, Zap, LayoutDashboard
} from 'lucide-react';
import { INITIAL_JOBS } from '@/lib/rpg-system/data';
import { GACHA_ITEMS } from '@/lib/rpg-system/gacha-data';
import { CAMPAIGN_CHAPTERS } from '@/lib/rpg-system/campaign-data';
import { LevelCurveConfigService } from '@/lib/services/config-services';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';

const levelCurve = LevelCurveConfigService.getCurve();

const RARITY_DISTRIBUTION = Object.entries(
  GACHA_ITEMS.reduce<Record<string, number>>((acc, item) => {
    const code = getRarityCode(item.rarity);
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {})
).sort(([a], [b]) => {
  const order = ['C', 'R', 'SR', 'UR', 'MR'];
  return order.indexOf(a) - order.indexOf(b);
});

export default function AdminDashboardClient() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">
            <LayoutDashboard size={20} className="inline mr-2 text-cyan-400" />
            Dashboard
          </h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
            Game Content Studio
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jobs', value: INITIAL_JOBS.length, icon: Users, color: 'text-blue-400', border: 'border-blue-500/20' },
          { label: 'Gacha Items', value: GACHA_ITEMS.length, icon: Sparkles, color: 'text-purple-400', border: 'border-purple-500/20' },
          { label: 'Chapters', value: CAMPAIGN_CHAPTERS.length, icon: BookOpen, color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Equipment Sets', value: 6, icon: Shield, color: 'text-cyan-400', border: 'border-cyan-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-black/40 border ${stat.border} rounded-2xl p-5 panel-elevated`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-3xl font-black text-white font-display">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
          <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-cyan-400" /> Rarity Distribution
          </h2>
          <div className="space-y-3">
            {RARITY_DISTRIBUTION.map(([code, count]) => {
              const color = RARITY_COLORS[code as keyof typeof RARITY_COLORS] || '#9CA3AF';
              const pct = Math.round((count / GACHA_ITEMS.length) * 100);
              return (
                <div key={code} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-black text-white/60" style={{ color }}>{code}</span>
                    <span className="font-black text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
          <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity size={14} className="text-green-400" /> System Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Game Config', status: 'Loaded', type: 'config' },
              { label: 'Level Cap', status: `${levelCurve.length}`, type: 'data' },
              { label: 'Gacha Items', status: `${GACHA_ITEMS.length}`, type: 'data' },
              { label: 'Chapters', status: `${CAMPAIGN_CHAPTERS.length}`, type: 'data' },
              { label: 'Asset Pipeline', status: 'Active', type: 'system' },
              { label: 'Admin Role', status: 'RLS', type: 'system' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">{item.label}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${item.type === 'config' ? 'text-cyan-400' : item.type === 'data' ? 'text-purple-400' : 'text-green-400'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Jobs', href: '/admin/jobs', icon: Users, color: 'from-blue-600/20 border-blue-500/30' },
            { label: 'Gacha', href: '/admin/gacha', icon: Sparkles, color: 'from-purple-600/20 border-purple-500/30' },
            { label: 'Economy', href: '/admin/economy', icon: Coins, color: 'from-amber-600/20 border-amber-500/30' },
            { label: 'Config', href: '/admin/configs', icon: Shield, color: 'from-cyan-600/20 border-cyan-500/30' },
          ].map(action => (
            <a key={action.label} href={action.href}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${action.color} border hover:brightness-110 transition-all`}
            >
              <action.icon size={20} className="text-white/60" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
