'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Sword, Zap, Heart, Star, Briefcase,
  Sparkles, Box, Plus, X, ArrowUpCircle,
  ShieldAlert, ChevronLeft
} from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { logger } from '@/lib/logger';
import { UnitService } from '@/lib/services/unit-service';
import { EquipmentService } from '@/lib/services/equipment-service';
import { SkillService } from '@/lib/services/skill-service';
import { SpriteConfigService } from '@/lib/services/sprite-config-service';
import EvolutionBar from '@/components/ui/EvolutionBar';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { RarityIcon } from '@/components/ui/RarityIcon';
import { ViewShell } from '@/components/ui/ViewShell';
import { Button } from '@/components/ui/Button';
import { getRarityCode } from '@/lib/config/assets-config';
import { useToast } from '@/lib/contexts/ToastContext';
import { gameDebugger } from '@/lib/debug';
import type { ViewType, EquipmentSlot } from '@/lib/types/game-types';

interface UnitDetailsViewProps {
  unitId: string;
  onNavigate: (view: ViewType) => void;
  onUpdate: () => void;
  onOpenInventory: (slot: EquipmentSlot) => void;
  onOpenCardDetails: (cardId: string, itemId: string) => void;
}

export function UnitDetailsView({
  unitId,
  onNavigate,
  onUpdate,
  onOpenInventory,
  onOpenCardDetails
}: UnitDetailsViewProps) {
  const { showToast, confirm: confirmToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextJobs, setNextJobs] = useState<any[]>([]);
  const [evolvedJobName, setEvolvedJobName] = useState<string | null>(null);
  const [evolving, setEvolving] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [showLearnSkill, setShowLearnSkill] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const details = await UnitService.getUnitDetails(unitId);
      setData(details);
      const jobs = await UnitService.getNextJobs(details.job.id);
      setNextJobs(jobs);
} catch (e) {
        const message = e instanceof Error ? e.message : "Error al cargar detalles de unidad";
        logger.error('error', 'Failed to load unit details', e instanceof Error ? e : undefined);
        setError(message);
      } finally {
       setLoading(false);
     }
   };

   const loadAvailableSkills = async (jobId?: string) => {
     setLoadingSkills(true);
     try {
       const data = await SkillService.getAvailableSkills(jobId);
       setAvailableSkills(data);
 } catch (e) {
         logger.error('error', 'Failed to load available skills', e instanceof Error ? e : undefined);
       } finally {
        setLoadingSkills(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [unitId]);

  const handleUnequip = async (instanceId: string, slot: 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill') => {
    try {
      await EquipmentService.unequipItem(unitId, instanceId, slot);
      showToast('Item des-equipado', 'success');
      loadData();
      onUpdate();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al des-equipar';
      showToast(message, 'error');
    }
  };

  const handleEvolve = async (jobId: string, jobName: string) => {
    const confirmed = await confirmToast(`¿Evolucionar a ${jobName}?`);
    if (!confirmed) return;
    setEvolving(true);
    try {
      await UnitService.evolveUnit(unitId, jobId);
      setEvolvedJobName(jobName);
      await loadData();
      onUpdate();
      showToast(`¡Ascendido a ${jobName}!`, 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al evolucionar';
      showToast(message, 'error');
    } finally {
      setEvolving(false);
    }
  };

  if (loading && !data) {
    return <ViewShell loading onBack={() => onNavigate('home')} />;
  }

  if (error) {
    return <ViewShell error={error} onBack={() => onNavigate('home')} />;
  }

  const { unit, job, equipment, setBonus, finalStats: stats } = data;
  const { weapon, armor, accessory, boots, cards, skills } = equipment || { weapon: null, armor: null, accessory: null, boots: null, cards: [], skills: [] };
  
  // Get job level info for current job
  const jobLevels = unit.job_levels || {};
  const currentJobLevel = jobLevels[unit.current_job_id]?.level || 1;
  const currentJobPoints = jobLevels[unit.current_job_id]?.skillPoints || 0;
  
  // Add to equipment for display
  const enhancedEquipment = {
    ...equipment,
    jobLevel: currentJobLevel,
    skillPoints: currentJobPoints
  };

  return (
    <ViewShell
      title="HÉROE"
      subtitle={unit.name}
      onBack={() => onNavigate('home')}
      background="party"
    >
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-4 custom-scrollbar touch-manipulation">

        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-1 pt-2">
          <div className="w-11" />
          <div className="text-center">
            <h1 className="text-base font-black text-white uppercase font-display tracking-wider">{unit.name}</h1>
            <span className="text-[8px] font-black text-[#F5C76B]/70 uppercase tracking-[0.3em]">{job.name} · LV.{unit.level}</span>
          </div>
          <div className="w-11" />
        </div>

        {/* MAIN CHARACTER PORTRAIT */}
        <section className="relative mx-auto w-full max-w-[300px]">
          <div className="relative overflow-visible rounded-2xl bg-gradient-to-b from-blue-900/20 via-blue-800/5 to-transparent border border-blue-400/5 shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border border-dashed border-blue-400/10 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="w-32 h-32 border border-dotted border-cyan-400/10 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>
            <div className="sprite-break-out flex items-center justify-center pt-3 pb-1">
              <div className="portrait-hero w-[85%]">
                <img src={SpriteConfigService.getJobSpriteUrl(unit.current_job_id || 'novice')}
                  className="w-full h-auto object-contain pixel-art drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                  alt={unit.name} />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full border border-yellow-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F5C76B] shadow-[0_0_6px_rgba(245,199,107,0.6)]" />
              <span className="text-[8px] font-black text-[#F5C76B] uppercase tracking-widest">{unit.rarity || 'UR'}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A2A]/70 via-transparent to-transparent pointer-events-none rounded-2xl" />
          </div>
        </section>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[7px] font-black text-green-400/60 uppercase tracking-widest">HP</p>
            <p className="text-sm font-black text-white tabular-nums">{stats.hp}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[7px] font-black text-red-400/60 uppercase tracking-widest">ATK</p>
            <p className="text-sm font-black text-white tabular-nums">{stats.atk}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[7px] font-black text-blue-400/60 uppercase tracking-widest">DEF</p>
            <p className="text-sm font-black text-white tabular-nums">{stats.def}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[7px] font-black text-cyan-400/60 uppercase tracking-widest">AGI</p>
            <p className="text-sm font-black text-white tabular-nums">{stats.agi}</p>
          </div>
        </div>

        {/* Job Level */}
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[8px] font-black text-purple-400">Job Lv.{enhancedEquipment?.jobLevel || 1}</span>
          {enhancedEquipment?.skillPoints > 0 && (
            <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[8px] font-black text-cyan-400">{enhancedEquipment.skillPoints} pts</span>
          )}
        </div>

        {/* Set Bonus Banner */}
        {setBonus && (
          <div className="bg-gradient-to-r from-[#F5C76B]/20 to-transparent border border-[#F5C76B]/30 p-3 rounded-xl panel-elevated">
            <p className="text-[10px] font-black text-[#F5C76B] uppercase tracking-widest">
              Set: {setBonus.setName} ({setBonus.pieceCount}p)
            </p>
            <p className="text-[8px] text-white/60 mt-1">
              {setBonus.bonus.hp ? `+${setBonus.bonus.hp} HP ` : ''}
              {setBonus.bonus.atk ? `+${setBonus.bonus.atk} ATK ` : ''}
              {setBonus.bonus.def ? `+${setBonus.bonus.def} DEF ` : ''}
              {setBonus.bonus.agi ? `+${setBonus.bonus.agi} AGI` : ''}
            </p>
          </div>
        )}

        {/* Equipment & Cards - Sistema expandido */}
        <div className="space-y-6">
           <SectionHeader icon={Box} title="EQUIPAMIENTO" />
           <div className="grid grid-cols-1 gap-4">
              {/* Main Equipment Row - 4 slots */}
              <div className="grid grid-cols-2 gap-3">
                 <EquipSlot
                   label="Arma"
                   item={weapon}
                   element={weapon?.element}
                   onAdd={() => onOpenInventory('weapon')}
                   onRemove={(id: string) => handleUnequip(id, 'weapon')}
                 />
                 <EquipSlot
                   label="Armadura"
                   item={armor}
                   element={armor?.element}
                   onAdd={() => onOpenInventory('armor')}
                   onRemove={(id: string) => handleUnequip(id, 'armor')}
                 />
                 <EquipSlot
                   label="Accesorio"
                   item={accessory}
                   element={accessory?.element}
                   onAdd={() => onOpenInventory('accessory')}
                   onRemove={(id: string) => handleUnequip(id, 'accessory')}
                 />
                 <EquipSlot
                   label="Botas"
                   item={boots}
                   element={boots?.element}
                   onAdd={() => onOpenInventory('boots')}
                   onRemove={(id: string) => handleUnequip(id, 'boots')}
                 />
              </div>

              {/* Cards Grid - 3 slots */}
              <div className="grid grid-cols-3 gap-3">
                 {[0, 1, 2].map(idx => (
                    <EquipSlot
                      key={`card-${idx}`}
                      label={`Carta ${idx + 1}`}
                      item={cards[idx]}
                      onAdd={() => onOpenInventory('card')}
                      onRemove={(id: string) => handleUnequip(id, 'card')}
                      onDetail={(id: string, itemId: string) => onOpenCardDetails(itemId, id)}
                    />
                 ))}
              </div>
           </div>
        </div>

        {/* Evolution Path */}
        {nextJobs.length > 0 && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 panel-elevated">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Evolución</p>
            <EvolutionBar jobs={nextJobs.map(j => j.name)} />
          </div>
        )}

        {/* Skills Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <SectionHeader icon={Sparkles} title="HABILIDADES" />
              <Button
                 onClick={() => { loadAvailableSkills(job?.id); setShowLearnSkill(true); }}
                variant="ghost"
                size="sm"
                className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest hover:brightness-125 transition-all"
              >
                + APRENDER
              </Button>
           </div>
           
           {/* Gacha Skills (equipables) */}
           <div className="grid grid-cols-2 gap-3">
              {[0, 1].map(idx => (
                 <EquipSlot
                   key={`gacha-${idx}`}
                   label={`Habilidad ${idx + 1}`}
                   item={skills[idx]}
                   onAdd={() => onOpenInventory('skill')}
                   onRemove={(id: string) => handleUnequip(id, 'skill')}
                 />
              ))}
           </div>
           
           {/* Job Skills (automáticas, no equipables) */}
           {job?.skills_unlocked && job.skills_unlocked.length > 0 && (
             <div className="mt-4 p-3 bg-black/20 border border-white/5 rounded-xl">
               <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Habilidades de Job</p>
               <div className="space-y-2">
                  {job.skills_unlocked.map((skillName: string, idx: number) => (
                    <div key={`job-skill-${skillName}-${idx}`} className="flex items-center gap-2 text-[10px] text-white/60">
                     <Sparkles size={10} className="text-cyan-400" />
                     <span>{skillName}</span>
                   </div>
                 ))}
               </div>
             </div>
           )}
           </div>
        </div>

        {/* Evolution Section */}
        {nextJobs.length > 0 && (
          <div className="space-y-6 pb-8">
             <SectionHeader icon={ArrowUpCircle} title="EVOLUCIÓN" />
             <div className={`grid gap-4 ${nextJobs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {nextJobs.map(job => (
                   <NineSlicePanel
                     key={job.id}
                     type="border"
                     variant={evolving ? 'default' : 'default'}
                     className={`p-6 flex flex-col items-center gap-4 glass-frosted frame-earthstone group transition-all card-premium ${evolving ? 'opacity-50 grayscale pointer-events-none' : 'cursor-pointer'}`}
                     onClick={() => handleEvolve(job.id, job.name)}
                   >
                       {evolving ? (
                         <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-t-purple-400 border-white/10 rounded-full" />
                         </div>
                       ) : (
                         <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform sprite-break-out">
                           <img
                             src={SpriteConfigService.getJobSpriteUrl(job.id)}
                             className="w-full h-full object-contain pixel-art"
                             alt={job.name}
                           />
                         </div>
                       )}
                       <div className="text-center">
                          <h4 className="text-sm font-black text-white uppercase font-display">{job.name}</h4>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">LV. {job.evolution_requirements?.minLevel}</p>
                      </div>
                   </NineSlicePanel>
                ))}
             </div>
          </div>
        )}

      {/* Learn Skill Modal Overlay */}
      <AnimatePresence>
        {showLearnSkill && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B1A2A]/98 backdrop-blur-2xl flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
                <Button onClick={() => setShowLearnSkill(false)} variant="ghost" size="sm" className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl" aria-label="Volver a detalles de unidad">
                    <ChevronLeft size={20} />
                 </Button>
               <h2 className="text-xl font-black text-white uppercase font-display">ENTRENAMIENTO</h2>
               <div className="w-10" />
            </div>

            {loadingSkills ? (
              <div className="flex-1 flex items-center justify-center">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">Escaneando Datos...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {availableSkills.map(skill => {
                  const isLearned = skills.some((s: any) => s.item_id === skill.id);
                  return (
                    <NineSlicePanel
                      key={skill.id}
                      type="border"
                      variant="default"
                       className={`p-4 glass-frosted frame-earthstone ${isLearned ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-cyan-400/40 cursor-pointer'}`}
                        onClick={async () => {
                          const confirmed = await confirmToast(`¿Aprender ${skill.name}?`);
                          if (!confirmed) return;
                         try {
                            const result = await SkillService.learnSkill(unitId, skill);
                            if (!result.success) throw new Error(result.message);
                            showToast(`¡${skill.name} aprendida!`, 'success');
                            loadData();
                            setShowLearnSkill(false);
                         } catch (err) { 
                           const message = err instanceof Error ? err.message : 'Error al aprender habilidad';
                           showToast(message, 'error'); 
                         }
                       }}
                    >
                      <div className="flex items-center justify-between mb-2">
                         <span className="font-display text-white">{skill.name}</span>
                         <RarityIcon rarity={getRarityCode(skill.rarity)} size="sm"><Sparkles size={12} /></RarityIcon>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed italic">{skill.description}</p>
                    </NineSlicePanel>
                  );
                })}
              </div>
            )}
            <Button onClick={() => setShowLearnSkill(false)} className="mt-6 w-full">CERRAR</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Celebration */}
      <AnimatePresence>
        {evolvedJobName && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
          >
             <Sparkles size={120} className="text-[#F5C76B] animate-pulse mb-8" />
             <h2 className="text-4xl font-black text-white uppercase font-display tracking-widest mb-2">ASCENSIÓN</h2>
             <p className="text-[#F5C76B] text-2xl font-black uppercase italic font-display">{evolvedJobName}</p>
             <Button onClick={() => setEvolvedJobName(null)} variant="primary" className="mt-12 w-full max-w-xs">CONTINUAR</Button>
          </motion.div>
        )}
      </AnimatePresence>

    </ViewShell>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 panel-elevated">
       <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border ${color}`}>
          <Icon size={18} />
       </div>
       <div>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{label}</p>
          <p className="text-stat-value">{value}</p>
       </div>
    </div>
  );
}

interface SectionHeaderProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
}

function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
       <div className="w-1.5 h-1.5 rounded-full bg-[#F5C76B]" />
       <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-stats flex items-center gap-2">
          <Icon size={12} className="text-[#F5C76B]" /> {title}
       </h3>
    </div>
  );
}

function CompactStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center panel-elevated">
      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-black ${color} tabular-nums`}>{value}</p>
    </div>
  );
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#FF6B35',
  water: '#4DABF7',
  earth: '#69DB7C',
  thunder: '#FFD43B',
  light: '#FFFFFF',
  dark: '#9775FA',
};

interface EquipSlotProps {
  label: string;
  item: any;
  element?: string;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onDetail?: (id: string, itemId: string) => void;
}

function EquipSlot({ label, item, onAdd, onRemove, onDetail, element }: EquipSlotProps) {
  const elementColor = element && element !== 'none' ? ELEMENT_COLORS[element] : null;

  const handleClick = () => {
    if (item && onDetail) {
      onDetail(item.id, item.item_id);
    } else if (!item && onAdd) {
      onAdd();
    }
  };

  return (
    <NineSlicePanel
      type="border"
      variant="default"
      className={`p-3 glass-frosted flex items-center justify-between group rounded-2xl card-premium ${!item && onAdd ? 'cursor-pointer' : ''}`}
      style={elementColor ? { borderColor: elementColor } : undefined}
      onClick={handleClick}
    >
       <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden relative ${!item ? 'cursor-pointer hover:bg-white/5' : ''}`}
               style={elementColor ? { borderColor: elementColor, boxShadow: `0 0 10px ${elementColor}40` } : undefined}>
             {item ? (
               <img src={AssetService.getCardUrlWithFallback(item.item_id)} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
             ) : (
               <Plus size={20} className="text-white/10" />
             )}
             {element && element !== 'none' && elementColor && (
               <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{ backgroundColor: elementColor, color: element === 'light' ? '#000' : '#fff' }}>
                  {element[0].toUpperCase()}
               </div>
             )}
          </div>
          <div>
             <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{label}</p>
             <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">
                {item ? item.definition?.name || item.name : 'Vacío'}
             </p>
             {item?.level_required && (
               <p className="text-[8px] text-orange-400">Req. Lv {item.level_required}</p>
             )}
          </div>
       </div>

       {item && (
          <Button
            onClick={(e) => { e.stopPropagation(); onRemove?.(item.id); }}
            variant="ghost"
            size="sm"
            className="p-2 text-white/10 hover:text-red-500 transition-colors"
            aria-label={`Eliminar ${item.definition?.name || item.name}`}
          >
             <X size={14} />
          </Button>
       )}
    </NineSlicePanel>
  );
}
