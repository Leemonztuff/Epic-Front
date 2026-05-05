'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Gift, CheckCircle2, Lock, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ViewShell } from '@/components/ui/ViewShell';
import { QuestService, type QuestEntry } from '@/lib/services/quest-service';
import { type Stage } from '@/lib/rpg-system/campaign-types';

interface QuestLogViewProps {
  playerEnergy: number;
  onNavigate: (view: any) => void;
  onOpenQuest: (stage: Stage) => void;
}

export function QuestLogView({ playerEnergy, onNavigate, onOpenQuest }: QuestLogViewProps) {
  const [quests, setQuests] = useState<QuestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuests() {
      const log = await QuestService.getQuestLog();
      setQuests(log);
      setLoading(false);
    }
    loadQuests();
  }, []);

  const activeQuests = quests.filter(q => q.status !== 'locked');

  return (
    <ViewShell
      title="MISIONES"
      subtitle="Registro de Aventuras"
      onBack={() => onNavigate('home')}
      background="home"
      loading={loading}
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {activeQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-20">
             <BookOpen size={48} className="mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest">No hay misiones activas</p>
          </div>
        ) : (
          activeQuests.map((quest, idx) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NineSlicePanel
                type="border"
                variant="default"
                className={`p-5 glass-frosted frame-earthstone flex flex-col gap-4 relative overflow-hidden transition-all ${
                  quest.status === 'completed' ? 'opacity-60 grayscale' : 'hover:border-[#F5C76B]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        quest.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-[#F5C76B]/10 border-[#F5C76B]/20 text-[#F5C76B]'
                      }`}>
                         {quest.status === 'completed' ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-white uppercase font-display leading-none">{quest.title}</h4>
                         <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1 inline-block">
                           {quest.type}
                         </span>
                      </div>
                   </div>
                   {quest.status === 'active' && (
                      <div className="px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
                         <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter italic">EN CURSO</span>
                      </div>
                   )}
                </div>

                <p className="text-[10px] text-white/40 leading-relaxed font-stats">
                   {quest.description}
                </p>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                   <div className="flex items-center gap-3">
                      <Gift size={14} className="text-[#F5C76B]" />
                      <div className="flex gap-2">
                         {quest.rewards.map((r, i) => (
                           <div key={i} className="px-2 py-0.5 bg-white/5 rounded border border-white/5 flex items-center gap-1">
                              <span className="text-[9px] font-black text-white/60 font-stats">{r.amount}</span>
                              <span className="text-[7px] font-bold text-white/20 uppercase font-stats">{r.type}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   {quest.status === 'active' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-4 text-[9px]"
                        onClick={() => quest.target_stage && onOpenQuest(quest.target_stage)}
                      >
                         IR AHORA <ArrowRight size={12} className="ml-1" />
                      </Button>
                   )}
                </div>
              </NineSlicePanel>
            </motion.div>
          ))
        )}
      </div>
    </ViewShell>
  );
}
