'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Crown, Clock, Flame, Lock, ChevronRight } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { Button } from '@/components/ui/Button';
import { ViewShell } from '@/components/ui/ViewShell';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';

interface TowerViewProps {
  onBack: () => void;
  playerPower?: number;
}

interface TowerFloor {
  floor: number;
  enemyPower: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
}

export function TowerView({ onBack, playerPower = 5000 }: TowerViewProps) {
  const [currentFloor] = useState(5);

  const floors: TowerFloor[] = Array.from({ length: 50 }, (_, i) => ({
    floor: i + 1,
    enemyPower: Math.floor(100 + (i * 150) + (i * i * 5)),
    isUnlocked: i < currentFloor,
    isCompleted: i < currentFloor - 1,
    stars: i < currentFloor - 1 ? 3 : 0
  }));

  const activeFloors = floors.slice(0, currentFloor + 5).reverse();

  return (
    <ViewShell
      title="TORRE INFINITA"
      subtitle="Ascensión del Guardián"
      onBack={onBack}
      background="battle"
    >
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">

        {/* Tower Info Bar */}
        <NineSlicePanel type="border" variant="default" className="p-4 flex items-center justify-between glass-frosted frame-earthstone shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                 <Flame size={20} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">PISO MÁS ALTO</p>
                 <p className="text-lg font-black text-white font-display">PISO {currentFloor}</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">TEMPORADA</p>
              <p className="text-sm font-black text-cyan-400 font-stats">01 - GÉNESIS</p>
           </div>
        </NineSlicePanel>

        {/* Floors List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
           {activeFloors.map((f, idx) => (
             <motion.div
               key={f.floor}
               initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05 }}
             >
               <NineSlicePanel
                 type="border"
                 variant="default"
                 className={`p-5 flex items-center justify-between glass-frosted transition-all ${
                   f.isUnlocked ? 'hover:border-[#F5C76B]/40 cursor-pointer' : 'opacity-40 grayscale pointer-events-none'
                 } ${f.isCompleted ? 'bg-green-500/5' : ''}`}
               >
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center border font-display text-lg ${
                       f.isUnlocked ? 'bg-[#F5C76B]/10 border-[#F5C76B]/20 text-[#F5C76B]' : 'bg-white/5 border-white/10 text-white/20'
                     }`}>
                        {f.floor}
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-white uppercase font-display leading-none">
                           {f.floor % 10 === 0 ? 'PISO DE JEFE' : `Desafío Piso ${f.floor}`}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                           <Sword size={10} className="text-white/20" />
                           <span className="text-[10px] font-black text-white/40 font-stats">{f.enemyPower.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {!f.isUnlocked ? (
                       <Lock size={16} className="text-white/10" />
                     ) : f.isCompleted ? (
                       <div className="flex gap-0.5">
                          {[1, 2, 3].map(i => <Crown key={i} size={10} className="text-[#F5C76B] fill-[#F5C76B]" />)}
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 text-[#F5C76B] opacity-40">
                          <span className="text-[9px] font-black font-stats">DESAFIAR</span>
                          <ChevronRight size={14} />
                       </div>
                     )}
                  </div>
               </NineSlicePanel>
             </motion.div>
           ))}
        </div>

        {/* Global Rewards Info */}
        <div className="flex items-center gap-3 px-2 text-white/20">
           <Clock size={12} />
           <p className="text-[8px] font-bold uppercase tracking-widest">REINICIO EN: 05D 12H 44M</p>
        </div>
      </div>
    </ViewShell>
  );
}
