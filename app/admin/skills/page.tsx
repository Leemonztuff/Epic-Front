'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Swords, Zap, Heart, Shield, Sparkles, Target } from 'lucide-react';
import { ENEMY_SKILL_DEFINITIONS } from '@/lib/rpg-system/enemy-skills';

const EFFECT_ICONS: Record<string, React.ReactNode> = {
  damage: <Swords size={14} className="text-red-400" />,
  heal: <Heart size={14} className="text-green-400" />,
  buff: <Shield size={14} className="text-blue-400" />,
  debuff: <Sparkles size={14} className="text-purple-400" />,
  taunt: <Target size={14} className="text-amber-400" />,
};

export default function AdminSkillsPage() {
  const skills = Object.values(ENEMY_SKILL_DEFINITIONS);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Skills</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Enemy Skill Definitions</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-black/40 border border-white/5 rounded-2xl p-5 panel-elevated"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Zap size={18} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display">{skill.name}</h3>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider">{skill.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Type:</span>
              <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-white/60 uppercase">{skill.type}</span>
              {skill.cooldown > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/10 rounded text-[8px] font-black text-amber-400">CD: {skill.cooldown}</span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-wider block mb-1">Effects:</span>
              {skill.effects.map((eff: any, ei: number) => (
                <div key={ei} className="flex items-center gap-2 text-[10px] text-white/60">
                  {EFFECT_ICONS[eff.type] || <Zap size={14} className="text-white/30" />}
                  <span className="font-bold">{eff.type}</span>
                  {eff.power && <span className="text-white/30">×{eff.power}</span>}
                  {eff.scaling && <span className="text-cyan-400/60">({eff.scaling})</span>}
                  <span className="text-white/20">→</span>
                  <span className="text-white/40">{eff.target}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
