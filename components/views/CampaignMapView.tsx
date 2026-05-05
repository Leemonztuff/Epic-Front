'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Map as MapIcon,
  Star,
  Lock,
  Zap,
  ChevronRight,
  Sword
} from 'lucide-react';
import { CampaignService } from '@/lib/services/campaign-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ViewShell } from '@/components/ui/ViewShell';
import { type Chapter, type Stage, type PlayerStageProgress } from '@/lib/rpg-system/campaign-types';

interface CampaignMapViewProps {
  playerEnergy: number;
  onNavigate: (view: any) => void;
  onSelectStage: (stage: Stage) => void;
}

export function CampaignMapView({ playerEnergy, onNavigate, onSelectStage }: CampaignMapViewProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState<PlayerStageProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [chaptersData, progressData] = await Promise.all([
          CampaignService.getChapters(),
          CampaignService.getPlayerProgress()
        ]);
        setChapters(chaptersData);
        setProgress(progressData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentChapter = chapters[currentChapterIndex];

  return (
    <ViewShell
      title="CAMPAÑA"
      subtitle={currentChapter ? `CAPÍTULO ${currentChapter.index}: ${currentChapter.name}` : 'Cargando...'}
      onBack={() => onNavigate('home')}
      background="campaign"
      loading={loading}
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {currentChapter?.stages.map((stage, idx) => {
          const stageProgress = progress.find(p => p.stage_id === stage.id);
          const isUnlocked = idx === 0 || progress.some(p => {
             const prevStage = currentChapter.stages[idx-1];
             return p.stage_id === prevStage?.id && p.cleared;
          });

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NineSlicePanel
                type="border"
                variant="default"
                className={`p-4 flex items-center justify-between group transition-all ${
                  isUnlocked ? 'glass-frosted frame-earthstone cursor-pointer hover:border-[#F5C76B]/40' : 'opacity-40 grayscale pointer-events-none'
                }`}
                onClick={() => isUnlocked && onSelectStage(stage)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    isUnlocked ? 'bg-[#F5C76B]/10 border-[#F5C76B]/20' : 'bg-white/5 border-white/10'
                  }`}>
                    {isUnlocked ? <Sword size={20} className="text-[#F5C76B]" /> : <Lock size={20} className="text-white/20" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase font-display leading-none">{stage.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap size={10} className="text-blue-400" />
                      <span className="text-[10px] font-black text-white/40 tabular-nums">{stage.energy_cost}</span>
                      {stageProgress?.cleared && (
                        <div className="flex items-center gap-0.5 ml-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star key={i} size={8} className={i < (stageProgress.stars || 0) ? 'text-[#F5C76B] fill-[#F5C76B]' : 'text-white/10'} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isUnlocked && <ChevronRight size={18} className="text-white/10 group-hover:text-[#F5C76B] transition-colors" />}
              </NineSlicePanel>
            </motion.div>
          );
        })}
      </div>
    </ViewShell>
  );
}
