'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Sword, Zap, Heart, Star, Briefcase,
  Sparkles, Box, Plus, X, ArrowUpCircle,
  ShieldAlert, ChevronLeft
} from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { UnitService } from '@/lib/services/unit-service';
import { EquipmentService } from '@/lib/services/equipment-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { RarityIcon } from '@/components/ui/RarityIcon';
import { ViewShell } from '@/components/ui/ViewShell';
import { Button } from '@/components/ui/Button';
import { getRarityCode } from '@/lib/config/assets-config';

interface UnitDetailsViewProps {
  unitId: string;
  onNavigate: (view: any) => void;
  onUpdate: () => void;
  onOpenInventory: (slot: 'weapon' | 'card' | 'skill') => void;
  onOpenCardDetails: (cardId: string, itemId: string) => void;
}

export function UnitDetailsView({
  unitId,
  onNavigate,
  onUpdate,
  onOpenInventory,
  onOpenCardDetails
}: UnitDetailsViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextJobs, setNextJobs] = useState<any[]>([]);
  const [evolvedJobName, setEvolvedJobName] = useState<string | null>(null);
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
      } catch (e: any) {
        logger.error('error', 'Failed to load unit details', e as Error);
       setError(e.message || "Error al cargar detalles de unidad");
     } finally {
       setLoading(false);
     }
   };

   const loadAvailableSkills = async () => {
     if (!supabase) return;
     setLoadingSkills(true);
     try {
       const { data, error } = await supabase
         .from('skills')
         .select('*')
         .order('rarity', { ascending: true });
       if (!error && data) {
         setAvailableSkills(data);
       }
      } catch (e) {
        logger.error('error', 'Failed to load available skills', e as Error);
     } finally {
       setLoadingSkills(false);
     }
   };

  useEffect(() => {
    loadData();
  }, [unitId]);

  const handleUnequip = async (instanceId: string, slot: 'weapon' | 'card' | 'skill') => {
    try {
      await EquipmentService.unequipItem(unitId, instanceId, slot);
      loadData();
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEvolve = async (jobId: string, jobName: string) => {
    try {
      setLoading(true);
      await UnitService.evolveUnit(unitId, jobId);
      setEvolvedJobName(jobName);
      await loadData();
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <ViewShell loading onBack={() => onNavigate('home')} />;
  }

  if (error) {
    return <ViewShell error={error} onBack={() => onNavigate('home')} />;
  }

  const { unit, job, weapon, cards, skills, finalStats: stats } = data;

  return (
    <ViewShell
      title="HÉROE"
      subtitle={unit.name}
      onBack={() => onNavigate('home')}
      background="party"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">

        {/* Character Visual */}
        <div className="relative flex flex-col items-center py-8">
           <div className="absolute inset-0 bg-[#F5C76B]/5 blur-[100px] rounded-full pointer-events-none" />
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative z-10"
           >
              <img
                src={AssetService.getSpriteUrl(unit.sprite_id)}
                className="w-48 h-48 object-contain pixel-art filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                alt={unit.name}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/40 blur-xl rounded-[100%] -z-10" />
           </motion.div>

           <div className="mt-6 flex flex-col items-center">
              <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md border border-[#F5C76B]/20 rounded-xl">
                 <span className="text-xl font-black text-white uppercase font-display tracking-tight">{unit.name}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                 <span className="text-[10px] font-black text-[#F5C76B] uppercase tracking-widest bg-[#F5C76B]/10 px-2 py-0.5 rounded-lg border border-[#F5C76B]/20">
                    LV. {unit.level}
                 </span>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {job.name}
                 </span>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
           <StatCard icon={Heart} label="HP" value={stats.hp} color="text-green-400" />
           <StatCard icon={Sword} label="ATK" value={stats.atk} color="text-red-400" />
           <StatCard icon={Shield} label="DEF" value={stats.def} color="text-blue-400" />
           <StatCard icon={Zap} label="SPD" value={stats.spd} color="text-cyan-400" />
        </div>

        {/* Equipment & Cards */}
        <div className="space-y-6">
           <SectionHeader icon={Box} title="EQUIPAMIENTO" />
           <div className="grid grid-cols-1 gap-4">
              {/* Weapon Slot */}
              <EquipSlot
                label="Arma"
                item={weapon}
                onAdd={() => onOpenInventory('weapon')}
                onRemove={ (id: string) => handleUnequip(id, 'weapon')}
              />

              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                 {[0, 1].map(idx => (
                    <EquipSlot
                      key={idx}
                      label={`Carta ${idx + 1}`}
                      item={cards[idx]}
                      onAdd={() => onOpenInventory('card')}
                      onRemove={ (id: string) => handleUnequip(id, 'card')}
                      onDetail={(id: string, itemId: string) => onOpenCardDetails(itemId, id)}
                    />
                 ))}
              </div>
           </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <SectionHeader icon={Sparkles} title="HABILIDADES" />
              <Button
                onClick={() => { loadAvailableSkills(); setShowLearnSkill(true); }}
                variant="ghost"
                size="sm"
                className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest hover:brightness-125 transition-all"
              >
                + APRENDER
              </Button>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {[0, 1, 2].map(idx => (
                 <EquipSlot
                   key={idx}
                   label={`Skill ${idx + 1}`}
                   item={skills[idx]}
                   onAdd={() => onOpenInventory('skill')}
                   onRemove={ (id: string) => handleUnequip(id, 'skill')}
                 />
              ))}
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
                     variant="default"
                     className="p-6 flex flex-col items-center gap-4 glass-frosted frame-earthstone cursor-pointer group hover:border-[#F5C76B]/40 transition-all"
                     onClick={() => handleEvolve(job.id, job.name)}
                   >
                      <div className="w-12 h-12 rounded-xl bg-[#F5C76B]/10 flex items-center justify-center border border-[#F5C76B]/20 group-hover:scale-110 transition-transform">
                         <Star className="text-[#F5C76B]" />
                      </div>
                      <div className="text-center">
                         <h4 className="text-sm font-black text-white uppercase font-display">{job.name}</h4>
                         <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Requerido: LV. {job.evolution_requirements?.minLevel}</p>
                      </div>
                   </NineSlicePanel>
                ))}
             </div>
          </div>
        )}
      </div>

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
                         // TODO: Replace with proper toast notification
                         if (!confirm(`¿Aprender ${skill.name}?`)) return;
                        // RPC learn skill logic...
                        try {
                           const { error } = await supabase.rpc('rpc_learn_skill', {
                             p_unit_id: unitId,
                             p_skill_id: skill.id,
                             p_skill_data: {
                               id: skill.id,
                               name: skill.name,
                               type: 'active',
                               cooldown: skill.cooldown || 2,
                               description: skill.description || ''
                             }
                           });
                           if (error) throw error;
                           loadData();
                           setShowLearnSkill(false);
                        } catch (err: any) { alert(err.message); }
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

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
       <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${color}`}>
          <Icon size={18} />
       </div>
       <div>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-black text-white tabular-nums">{value}</p>
       </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: any) {
  return (
    <div className="flex items-center gap-2">
       <div className="w-1.5 h-1.5 rounded-full bg-[#F5C76B]" />
       <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-stats flex items-center gap-2">
          <Icon size={12} className="text-[#F5C76B]" /> {title}
       </h3>
    </div>
  );
}

function EquipSlot({ label, item, onAdd, onRemove, onDetail }: any) {
  return (
    <NineSlicePanel
      type="border"
      variant="default"
      className="p-3 glass-frosted flex items-center justify-between group rounded-2xl"
      onClick={() => item && onDetail ? onDetail(item.id, item.item_id) : (!item && onAdd ? onAdd() : null)}
    >
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden relative ${!item ? 'cursor-pointer hover:bg-white/5' : ''}`}>
             {item ? (
                item.item_type === 'card' ? (
                   <img src={AssetService.getCardUrl(item.item_id)} className="w-full h-full object-cover" alt="" />
                ) : (
                   <Box size={20} className="text-[#F5C76B]" />
                )
             ) : (
                <Plus size={20} className="text-white/10" />
             )}
          </div>
          <div>
             <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{label}</p>
             <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">
                {item ? item.definition?.name || item.name : 'Vacio'}
             </p>
          </div>
       </div>

          {item && (
             <Button
               onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
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
