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

        {/* MAIN CHARACTER PORTRAIT - Premium Hero Framing */}
        <section className="portrait-card relative w-full" style={{ height: 280, overflow: 'visible' }}>
          
          {/* FRAME UI - clips sides/bottom, but sprite overflows top */}
          <div className="portrait-frame relative w-full h-full rounded-2xl overflow-hidden bg-[#1A2837] border-2 border-[#3A4A5A] shadow-2xl">
            
            {/* BACKGROUND interno */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A2837] via-[#2A3B4B] to-[#0B1A2A]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />

            {/* MAGIC CIRCLE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                 className="w-[450px] h-[450px] opacity-20"
               >
                 <svg viewBox="0 0 200 200" className="w-full h-full text-blue-400 fill-none stroke-current stroke-[0.5]">
                    <circle cx="100" cy="100" r="90" strokeDasharray="10 5" />
                    <circle cx="100" cy="100" r="80" strokeDasharray="5 10" />
                    <path d="M100 10 L100 190 M10 100 L190 100 M40 40 L160 160 M40 160 L160 40" opacity="0.5" />
                 </svg>
               </motion.div>
            </div>

            {/* LIGHT FX */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* UI BADGE - Rango UR */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#2A1B0A] to-[#1A0B05] rounded-full border border-[#F5C76B]/40 shadow-lg">
               <div className="flex items-center justify-center w-5 h-5 bg-[#F5C76B] rounded-sm rotate-45 shadow-[0_0_10px_rgba(245,199,107,0.5)]">
                  <Star size={10} className="-rotate-45 text-[#2A1B0A] fill-current" />
               </div>
               <span className="text-[10px] font-black text-[#F5C76B] uppercase tracking-widest">RANGO <span className="text-white text-xs">{unit.rarity || 'UR'}</span></span>
            </div>

          </div>

          {/* CHARACTER SPRITE - OUTSIDE the frame, overflows TOP */}
          <img
            src={SpriteConfigService.getJobSpriteUrl(unit.current_job_id || 'novice')}
            className="character-sprite absolute pixel-art z-20 pointer-events-none"
            style={{
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              height: '140%',
              width: 'auto',
              maxWidth: 'none',
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.7))',
            }}
            alt={unit.name}
          />

        </section>

        {/* STATS GRID - Premium Cards */}
        <div className="grid grid-cols-4 gap-3 mt-4">
           <StatBox icon={Heart} label="HP" value={stats.hp} color="text-red-500" iconColor="bg-red-500/10 border-red-500/20" />
           <StatBox icon={Sword} label="ATK" value={stats.atk} color="text-orange-400" iconColor="bg-orange-500/10 border-orange-500/20" />
           <StatBox icon={Shield} label="DEF" value={stats.def} color="text-slate-400" iconColor="bg-slate-500/10 border-slate-500/20" />
           <StatBox icon={Zap} label="SPD" value={stats.agi} color="text-cyan-400" iconColor="bg-cyan-500/10 border-cyan-500/20" />
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

        {/* ARSENAL DE COMBATE (Equipment) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                 <Briefcase size={14} className="text-[#F5C76B]" />
                 <h3 className="text-[11px] font-black text-[#F5C76B] uppercase tracking-[0.2em] font-display">ARSENAL DE COMBATE</h3>
              </div>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">ESPACIOS: 1/5</span>
           </div>

           <div className="flex items-center justify-start gap-4 px-1">
              <EquipmentCircle item={weapon} label="Arma" onClick={() => onOpenInventory('weapon')} />
              <EquipmentCircle item={armor} label="Armadura" onClick={() => onOpenInventory('armor')} />
              <EquipmentCircle item={accessory} label="Accesorio" onClick={() => onOpenInventory('accessory')} />
              <EquipmentCircle item={boots} label="Botas" onClick={() => onOpenInventory('boots')} />
              <EquipmentCircle item={null} label="Extra" onClick={() => onOpenInventory('card')} />
           </div>
        </div>

        {/* Evolution Path */}
        {nextJobs.length > 0 && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 panel-elevated">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Evolución</p>
            <EvolutionBar jobs={nextJobs.map(j => j.name)} />
          </div>
        )}

        {/* TÉCNICAS ESPECIALES (Skills) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                 <Zap size={14} className="text-[#F5C76B]" />
                 <h3 className="text-[11px] font-black text-[#F5C76B] uppercase tracking-[0.2em] font-display">TÉCNICAS ESPECIALES</h3>
              </div>
           </div>

           <div className="flex items-center justify-start gap-4 px-1">
              {[0, 1, 2, 3, 4].map(idx => (
                 <SkillSlot 
                   key={`skill-slot-${idx}`}
                   item={skills[idx]}
                   onClick={() => onOpenInventory('skill')}
                 />
              ))}
           </div>
        </div>
        </div>

        {/* SENDA DE EVOLUCIÓN */}
        {nextJobs.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <ArrowUpCircle size={14} className="text-[#F5C76B]" />
                <h3 className="text-[11px] font-black text-[#F5C76B] uppercase tracking-[0.2em] font-display">SENDA DE EVOLUCIÓN</h3>
             </div>

             <div className="grid grid-cols-2 gap-3">
                {nextJobs.map(job => (
                   <EvolutionCard 
                     key={job.id}
                     job={job}
                     onClick={() => handleEvolve(job.id, job.name)}
                   />
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

function StatBox({ icon: Icon, label, value, color, iconColor }: any) {
  return (
    <div className="bg-[#1A2837]/60 border border-[#3A4A5A]/30 rounded-2xl p-3 flex flex-col items-center gap-1 shadow-lg backdrop-blur-sm">
       <div className={`p-2 rounded-xl border ${iconColor} mb-1`}>
          <Icon size={16} className={color} />
       </div>
       <span className="text-lg font-black text-white leading-none">{value}</span>
       <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

function EquipmentCircle({ item, label, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center gap-2 cursor-pointer"
    >
       <div className="relative w-14 h-14 rounded-full bg-[#1A2837] border-4 border-[#3A4A5A] shadow-inner flex items-center justify-center overflow-hidden group-hover:border-[#F5C76B]/40 transition-all">
          {item ? (
            <img 
              src={AssetService.getItemIconUrl(item.item_type || 'weapon', item.item_id)} 
              className="w-full h-full object-cover"
              alt={label}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
               <Plus size={20} className="text-white/10 group-hover:text-[#F5C76B]/40 transition-colors" />
               <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#3A4A5A] border-2 border-[#1A2837] flex items-center justify-center">
                  <Plus size={8} className="text-white/40" />
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

function SkillSlot({ item, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="w-14 h-14 rounded-2xl bg-[#1A2837] border-2 border-[#3A4A5A] flex items-center justify-center cursor-pointer hover:border-[#F5C76B]/40 transition-all group"
    >
       {item ? (
          <img 
            src={AssetService.getSkillIconUrl(item.item_id)} 
            className="w-8 h-8 object-contain"
            alt="Skill"
          />
       ) : (
          <Plus size={18} className="text-white/10 group-hover:text-[#F5C76B]/40 transition-colors" />
       )}
    </div>
  );
}

function EvolutionCard({ job, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="relative flex items-center gap-3 p-3 bg-gradient-to-r from-[#1A2837] to-[#2A3B4B] border-2 border-[#3A4A5A] rounded-2xl cursor-pointer hover:border-[#F5C76B]/40 transition-all group overflow-hidden"
    >
       <div className="relative w-16 h-12 rounded-xl bg-black/20 overflow-hidden flex items-center justify-center">
          <img 
            src={SpriteConfigService.getJobSpriteUrl(job.id)} 
            className="w-20 h-20 object-contain pixel-art mt-4"
            alt={job.name}
          />
       </div>
       <div className="flex-1">
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">{job.name}</h4>
          <p className="text-[8px] font-bold text-[#F5C76B] uppercase tracking-widest mt-0.5">TIER 1</p>
       </div>
       <ArrowUpCircle size={14} className="absolute top-2 right-2 text-[#F5C76B]/40 group-hover:text-[#F5C76B] transition-colors" />
    </div>
  );
}
