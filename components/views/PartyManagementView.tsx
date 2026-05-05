'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, Heart, UserMinus, Plus, Sparkles, ArrowRight } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ViewShell } from '@/components/ui/ViewShell';
import { RarityIcon } from '@/components/ui/RarityIcon';
import { getRarityCode } from '@/lib/config/assets-config';

interface PartyManagementViewProps {
  saveData: any;
  activePartyUnits: any[];
  onNavigate: (view: any) => void;
  onAssignToParty: (idx: number, unitId: string) => void;
  onRemoveFromParty: (idx: number) => void;
  onSelectUnit: (unitId: string) => void;
}

export function PartyManagementView({
  saveData,
  activePartyUnits,
  onNavigate,
  onAssignToParty,
  onRemoveFromParty,
  onSelectUnit
}: PartyManagementViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const partySizeLimit = saveData.profile?.party_size_limit || 3;

  return (
    <ViewShell
      title="FORMACIÓN"
      subtitle="Gestionar Equipo"
      onBack={() => onNavigate('home')}
      background="party"
    >
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
        {/* Active Party Grid */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          {Array.from({ length: partySizeLimit }).map((_, idx) => {
            const unit = activePartyUnits[idx];
            const isSelected = selectedSlot === idx;

            return (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSlot(isSelected ? null : idx)}
                className={`relative aspect-[4/5] rounded-[24px] border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected ? 'border-[#F5C76B] shadow-[0_0_20px_rgba(245,199,107,0.3)]' : 'border-white/5 bg-black/40 hover:border-white/10'
                }`}
              >
                {unit ? (
                  <div className="w-full h-full flex flex-col items-center justify-end p-2">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F5C76B]/5 to-transparent pointer-events-none" />
                    <img
                      src={AssetService.getSpriteUrl(unit.sprite_id)}
                      className="w-[140%] object-contain mb-2 pixel-art filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                      alt={unit.name}
                    />
                    <div className="w-full bg-black/60 backdrop-blur-md rounded-lg py-1 px-2 border border-white/5 relative z-10">
                       <p className="text-[7px] font-black text-white/40 uppercase tracking-tighter truncate">{unit.name}</p>
                       <p className="text-[9px] font-black text-white uppercase font-display tracking-tight leading-none mt-0.5">LV.{unit.level}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                       <Plus size={16} className="text-white/20" />
                    </div>
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">PUESTO {idx + 1}</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#F5C76B] rounded-full animate-pulse shadow-[0_0_8px_#F5C76B]" />
                )}
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selectedSlot !== null ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-[10px] font-bold text-[#F5C76B] uppercase tracking-[0.2em] flex items-center gap-2 font-stats">
                  <ArrowRight size={14} className="text-[#F5C76B]" /> Asignar Ranura {selectedSlot + 1}
                </h3>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-[9px] font-bold text-white/40 uppercase hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 font-stats"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {activePartyUnits[selectedSlot] && (
                  <button
                    onClick={() => { onRemoveFromParty(selectedSlot); setSelectedSlot(null); }}
                    className="w-full glass-frosted frame-earthstone p-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95 font-stats"
                  >
                    <UserMinus size={16} /> Retirar de Formación
                  </button>
                )}

                {saveData.roster
                  .filter((u: any) => !activePartyUnits.some(pu => pu?.id === u.id))
                  .map((unit: any, idx: number) => (
                    <NineSlicePanel
                      key={unit.id}
                      type="border"
                      variant="default"
                      className="glass-frosted frame-earthstone p-3.5 flex items-center gap-3 hover:border-[#F5C76B]/50 cursor-pointer transition-all rounded-2xl"
                      onClick={() => { onAssignToParty(selectedSlot, unit.id); setSelectedSlot(null); }}
                      as={motion.div}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ x: 6, transition: { duration: 0.2 } }}
                    >
                      <RarityIcon
                        rarity={getRarityCode(unit?.rarity || 'C')}
                        size="sm"
                        className="shrink-0"
                        glass={true}
                      >
                        <div className="relative">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/50 blur-md rounded-full" />
                          <img src={AssetService.getSpriteUrl(unit.sprite_id)} className="w-[160%] relative" style={{imageRendering: 'pixelated'}} alt="" />
                        </div>
                      </RarityIcon>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-white text-sm truncate">{unit.name}</span>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-white/50 font-stats">
                            <Sword size={10} className="text-[#F5C76B]" />
                            <span className="text-white/70">{unit.base_stats?.atk}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-white/50 font-stats">
                            <Heart size={10} className="text-red-400" />
                            <span className="text-white/70">{unit.base_stats?.hp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <img src={AssetService.getIconUrl(unit.icon_id)} className="w-5 h-5 object-contain opacity-40" />
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter font-stats">{unit.current_job_id}</span>
                      </div>

                      <Plus size={18} className="text-[#F5C76B] drop-shadow-[0_0_5px_rgba(245,199,107,0.3)] shrink-0" />
                    </NineSlicePanel>
                  ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-3 overflow-hidden"
            >
              <h3 className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase shrink-0 flex items-center gap-2 font-stats">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                Reserva General ({saveData.roster?.length || 0})
              </h3>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {saveData.roster?.map((unit: any, idx: number) => (
                  <NineSlicePanel
                    key={unit.id}
                    type="border"
                    variant="default"
                    className="glass-frosted frame-earthstone p-3.5 flex items-center gap-3 hover:border-[#F5C76B]/50 cursor-pointer group relative rounded-2xl"
                    onClick={() => onSelectUnit(unit.id)}
                    as={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  >
                    <RarityIcon
                      rarity={getRarityCode(unit?.rarity || 'C')}
                      size="md"
                      className="shrink-0"
                      glass={true}
                    >
                      <div className="relative">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-black/60 blur-md rounded-full" />
                        <img src={AssetService.getSpriteUrl(unit.sprite_id)} className="w-[160%] relative" style={{imageRendering: 'pixelated'}} />
                      </div>
                    </RarityIcon>

                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-white text-sm truncate">{unit.name}</span>
                        <span className="text-[8px] font-bold text-[#F5C76B] bg-[#F5C76B]/10 px-2 py-0.5 rounded-full border border-[#F5C76B]/20 uppercase shrink-0">
                          {unit.rarity || 'C'}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 items-center">
                        <span className="text-[10px] font-bold text-[#F5C76B] font-stats italic">LV.{unit.level}</span>
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate font-stats">{unit.current_job_id}</span>
                      </div>
                    </div>

                    <ArrowRight size={16} className="text-white/10 group-hover:text-[#F5C76B] transition-colors shrink-0 group-hover:translate-x-1" />
                  </NineSlicePanel>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ViewShell>
  );
}
