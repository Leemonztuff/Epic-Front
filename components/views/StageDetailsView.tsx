'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sword, Zap, Star, Gift, Users } from 'lucide-react';
import { type Stage } from '@/lib/rpg-system/campaign-types';
import { Button } from '@/components/ui/Button';
import { ViewShell } from '@/components/ui/ViewShell';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';

interface StageDetailsViewProps {
  stage: Stage;
  playerEnergy: number;
  onBack: () => void;
  onStartBattle: (stage: Stage) => void;
}

export function StageDetailsView({ stage, playerEnergy, onBack, onStartBattle }: StageDetailsViewProps) {
  const canAfford = playerEnergy >= stage.energy_cost;

  return (
    <ViewShell
      title="MISIÓN"
      subtitle={stage.name}
      onBack={onBack}
      background="campaign"
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {/* Stage Hero Section */}
        <div className="text-center py-4">
           <div className="w-20 h-20 bg-black/40 border border-[#F5C76B]/20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl relative glass-crystal frame-earthstone">
              <Sword size={32} className="text-[#F5C76B]" />
           </div>
           <h2 className="text-2xl font-black text-white tracking-widest uppercase italic font-display">{stage.name}</h2>
           <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2 leading-relaxed font-stats max-w-xs mx-auto">
             {stage.description}
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <NineSlicePanel type="border" variant="default" className="p-4 glass-frosted flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">COSTO ENERGÍA</span>
              <div className="flex items-center gap-2">
                 <Zap size={14} className="text-blue-400" />
                 <span className={`text-lg font-black font-stats ${canAfford ? 'text-white' : 'text-red-500'}`}>
                    {stage.energy_cost}
                 </span>
              </div>
           </NineSlicePanel>
           <NineSlicePanel type="border" variant="default" className="p-4 glass-frosted flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">NIVEL RECOM.</span>
              <div className="flex items-center gap-2">
                 <Users size={14} className="text-[#F5C76B]" />
                 <span className="text-lg font-black text-white font-stats">
                    {stage.recommended_level || 5}
                 </span>
              </div>
           </NineSlicePanel>
        </div>

        {/* Rewards Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-2">
              <Gift size={14} className="text-[#F5C76B]" />
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">POSIBLES RECOMPENSAS</h3>
           </div>
           <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <NineSlicePanel key={i} type="border" variant="default" className="aspect-square flex items-center justify-center bg-black/40 opacity-40">
                   <Star size={16} className="text-white/10" />
                </NineSlicePanel>
              ))}
           </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 pb-8">
           <Button
             variant="primary"
             className="w-full py-6 font-display text-lg tracking-[0.2em]"
             disabled={!canAfford}
             onClick={() => onStartBattle(stage)}
           >
             {canAfford ? 'COMENZAR BATALLA' : 'ENERGÍA INSUFICIENTE'}
           </Button>
        </div>
      </div>
    </ViewShell>
  );
}
