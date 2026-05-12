'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Map as MapIcon,
  Star,
  Lock,
  Zap,
  Sword,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { CampaignService } from '@/lib/services/campaign-service';
import { logger } from '@/lib/logger';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ViewShell } from '@/components/ui/ViewShell';
import { Button } from '@/components/ui/Button';
import {
  type Chapter,
  type Stage,
  type PlayerStageProgress,
} from '@/lib/rpg-system/campaign-types';
import type { ViewType } from '@/lib/types/game-types';

interface CampaignMapViewProps {
  playerEnergy: number;
  onNavigate: (view: ViewType) => void;
  onSelectStage: (stage: Stage) => void;
}

export function CampaignMapView({ playerEnergy, onNavigate, onSelectStage }: CampaignMapViewProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState<PlayerStageProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentChapter = chapters[currentChapterIndex];
  const hasMultipleChapters = chapters.length > 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [chaptersData, progressData] = await Promise.all([
        CampaignService.getChapters(),
        CampaignService.getPlayerProgress(),
      ]);
      setChapters(chaptersData);
      setProgress(progressData);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar datos de campaña';
      logger.error('error', 'Failed to load campaign data', e as Error);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Determine if this chapter is unlocked: first chapter always, others require clearing previous chapter's final stage
  const isChapterUnlocked = useCallback((chapterIdx: number): boolean => {
    if (chapterIdx === 0) return true;
    const prevChapter = chapters[chapterIdx - 1];
    if (!prevChapter?.stages.length) return false;
    const lastStageId = prevChapter.stages[prevChapter.stages.length - 1].id;
    return progress.some(p => p.stage_id === lastStageId && p.cleared);
  }, [chapters, progress]);

  const chapterUnlocked = currentChapter ? isChapterUnlocked(currentChapterIndex) : true;

  const canGoPrev = currentChapterIndex > 0;
  const canGoNext = currentChapterIndex < chapters.length - 1;

  if (loadError && chapters.length === 0) {
    return (
      <ViewShell title="CAMPAÑA" onBack={() => onNavigate('home')}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">{loadError}</p>
          <Button onClick={loadData} variant="primary" size="sm">REINTENTAR</Button>
        </div>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title="CAMPAÑA"
      subtitle={
        currentChapter ? `CAPÍTULO ${currentChapter.index}: ${currentChapter.name}` : undefined
      }
      onBack={() => onNavigate('home')}
      background="campaign"
      loading={loading}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        {/* Chapter Navigation */}
        {hasMultipleChapters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <Button
              onClick={() => setCurrentChapterIndex(i => Math.max(0, i - 1))}
              disabled={!canGoPrev}
              variant={canGoPrev ? 'secondary' : 'ghost'}
              size="sm"
              className="w-10 h-10 rounded-full"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                Capítulo {currentChapter?.index} de {chapters.length}
              </span>
            </div>
            <Button
              onClick={() => setCurrentChapterIndex(i => Math.min(chapters.length - 1, i + 1))}
              disabled={!canGoNext}
              variant={canGoNext ? 'secondary' : 'ghost'}
              size="sm"
              className="w-10 h-10 rounded-full"
            >
              <ChevronRight size={18} />
            </Button>
          </motion.div>
        )}

        {/* Chapter locked overlay */}
        {!chapterUnlocked && currentChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center gap-3"
          >
            <Lock size={32} className="text-white/20" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              Completa el capítulo anterior para desbloquear
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-end mb-2">
          <Button
            onClick={() => onNavigate('quests')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <BookOpen size={14} />
            <span className="text-[9px] font-black uppercase">Misiones</span>
          </Button>
        </div>

        {/* Energy display */}
        <div className="flex items-center gap-2 px-1">
          <Zap size={12} className="text-blue-400" />
          <span className="text-[9px] font-black text-white/40 tabular-nums">
            Energía: {playerEnergy}
          </span>
        </div>

        {currentChapter?.stages.map((stage, idx) => {
          const stageProgress = progress.find(p => p.stage_id === stage.id);
          const isUnlocked = chapterUnlocked && (
            idx === 0 ||
            progress.some(p => {
              const prevStage = currentChapter.stages[idx - 1];
              return p.stage_id === prevStage?.id && p.cleared;
            })
          );
          const hasEnergy = playerEnergy >= stage.energy_cost;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`animate-reveal reveal-delay-${Math.min(idx + 1, 5)}`}
            >
              <NineSlicePanel
                type="border"
                variant="default"
                className={`p-4 flex items-center justify-between group transition-all ${
                  isUnlocked && hasEnergy
                    ? 'glass-frosted frame-earthstone cursor-pointer card-premium'
                    : 'opacity-40 grayscale pointer-events-none'
                }`}
                onClick={() => isUnlocked && hasEnergy && onSelectStage(stage)}
                role="button"
                tabIndex={isUnlocked ? 0 : undefined}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isUnlocked && hasEnergy) onSelectStage(stage);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      isUnlocked
                        ? 'bg-[#F5C76B]/10 border-[#F5C76B]/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {isUnlocked ? (
                      <Sword size={20} className="text-[#F5C76B]" />
                    ) : (
                      <Lock size={20} className="text-white/20" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase font-display leading-none">
                      {stage.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap size={10} className={hasEnergy ? 'text-blue-400' : 'text-red-400'} />
                      <span className={`text-[10px] font-black tabular-nums ${hasEnergy ? 'text-white/40' : 'text-red-400'}`}>
                        {stage.energy_cost}
                      </span>
                      {stageProgress?.cleared && (
                        <div
                          className="flex items-center gap-0.5 ml-2"
                          aria-label={`${stageProgress.stars || 0} de 3 estrellas`}
                        >
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star
                              key={i}
                              size={8}
                              className={
                                i < (stageProgress.stars || 0)
                                  ? 'text-[#F5C76B] fill-[#F5C76B]'
                                  : 'text-white/10'
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isUnlocked && (
                  <ChevronRight
                    size={18}
                    className="text-white/10 group-hover:text-[#F5C76B] transition-colors"
                  />
                )}
              </NineSlicePanel>
            </motion.div>
          );
        })}
      </div>
    </ViewShell>
  );
}
