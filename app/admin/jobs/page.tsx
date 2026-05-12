'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Users, Star, Swords, Shield, Zap, ArrowUpCircle } from 'lucide-react';
import { INITIAL_JOBS } from '@/lib/rpg-system/data';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';

const TIER_COLORS: Record<number, string> = {
  0: 'text-white/30 border-white/10',
  1: 'text-blue-400 border-blue-500/20',
  2: 'text-purple-400 border-purple-500/20',
  3: 'text-amber-400 border-amber-500/20',
  4: 'text-red-400 border-red-500/20',
};

export default function AdminJobsPage() {
  const jobs = INITIAL_JOBS;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Jobs</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Class / Evolution Definitions</p>
      </div>

      <div className="space-y-4">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center ${TIER_COLORS[job.tier] || 'border-white/10'}`}>
                  <Users size={20} className="text-white/60" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase font-display">{job.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${TIER_COLORS[job.tier]?.split(' ')[0] || 'text-white/30'}`}>
                      Tier {job.tier}
                    </span>
                    <span className="text-[8px] text-white/20">|</span>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">{job.id}</span>
                  </div>
                </div>
              </div>
              {job.evolution_requirements && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <ArrowUpCircle size={12} className="text-amber-400" />
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Evolvable</span>
                </div>
              )}
            </div>

            {/* Stat modifiers */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {(['hp', 'atk', 'def', 'matk', 'mdef', 'agi'] as const).map(stat => (
                <div key={stat} className="bg-black/60 rounded-xl p-2 text-center">
                  <span className="text-[7px] font-black text-white/20 uppercase tracking-wider block">{stat}</span>
                  <span className="text-sm font-black text-white">{((job.stat_modifiers?.[stat] || 1) * 100 - 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {/* Allowed weapons */}
            <div className="flex items-center gap-2 mb-3">
              <Swords size={12} className="text-white/30" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Weapons:</span>
              {job.allowed_weapons?.map((w: string) => (
                <span key={w} className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-white/60 uppercase tracking-wider">{w}</span>
              ))}
            </div>

            {/* Skills */}
            {job.skills_unlocked?.length > 0 && (
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-cyan-400" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Skills:</span>
                {job.skills_unlocked.map((s: any) => (
                  <span key={s.id || s} className="px-2 py-0.5 bg-cyan-500/10 rounded text-[8px] font-black text-cyan-400 uppercase tracking-wider">
                    {s.name || s}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
