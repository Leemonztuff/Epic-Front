'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Zap, Star, Gift, Castle, Swords } from 'lucide-react';
import { CAMPAIGN_CHAPTERS } from '@/lib/rpg-system/campaign-data';

export default function AdminQuestsPage() {
  const chapters = CAMPAIGN_CHAPTERS;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Quests</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Campaign / Stage Editor</p>
      </div>

      {chapters.map((chapter, ci) => (
        <div key={chapter.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Castle size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase font-display">{chapter.name}</h2>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{chapter.id} · {chapter.stages?.length || 0} stages</span>
            </div>
          </div>

          <div className="space-y-3">
            {chapter.stages?.map((stage: any, si: number) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: si * 0.03 }}
                className="bg-black/60 border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Swords size={14} className="text-[#F5C76B]" />
                    <h3 className="text-sm font-black text-white uppercase font-display">{stage.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-blue-400" />
                    <span className="text-[9px] font-black text-white/40">{stage.energy_cost}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Enemies:</span>
                  {stage.enemies?.map((e: any, ei: number) => (
                    <span key={ei} className="px-2 py-0.5 bg-red-500/10 rounded text-[8px] font-black text-red-400 uppercase tracking-wider">
                      {e.name} Lv.{e.level}
                    </span>
                  ))}
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Gift size={10} className="text-[#F5C76B]" />
                    <span className="text-[9px] font-black text-white/60">{stage.rewards?.currency} gold</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-purple-400" />
                    <span className="text-[9px] font-black text-white/60">{stage.rewards?.exp} exp</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
