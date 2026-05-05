'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Crown, Shield, Sword, Gift } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { ViewShell } from '@/components/ui/ViewShell';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { Button } from '@/components/ui/Button';

interface GuildViewProps {
  onBack: () => void;
}

interface GuildMember {
  id: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  power: number;
}

export function GuildView({ onBack }: GuildViewProps) {
  const [members] = useState<GuildMember[]>([
    { id: '1', name: 'MasterGamer', role: 'leader', contribution: 50000, power: 25000 },
    { id: '2', name: 'ShadowSlayer', role: 'officer', contribution: 32000, power: 18000 },
    { id: '3', name: 'HealerPro', role: 'member', contribution: 12000, power: 12000 },
  ]);

  return (
    <ViewShell
      title="GREMIO"
      subtitle="Alianza de Aventureros"
      onBack={onBack}
      background="home"
    >
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">

        {/* Guild Banner */}
        <NineSlicePanel type="border" variant="fancy" className="p-6 glass-frosted frame-earthstone relative overflow-hidden shrink-0">
           <div className="flex flex-col items-center text-center">
              <Shield size={48} className="text-[#F5C76B] mb-4" />
              <h3 className="text-xl font-black text-white uppercase font-display">VALHALLA</h3>
              <div className="flex items-center gap-4 mt-2">
                 <span className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest">Nivel 15</span>
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Miembros: 28/50</span>
              </div>
           </div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#F5C76B]/5 to-transparent pointer-events-none" />
        </NineSlicePanel>

        {/* Members List */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
           <div className="flex items-center gap-2 px-2 shrink-0">
              <Users size={14} className="text-[#F5C76B]" />
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-stats">MIEMBROS ACTIVOS</h3>
           </div>

           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {members.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <NineSlicePanel type="border" variant="default" className="p-4 flex items-center justify-between glass-frosted">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                           {member.role === 'leader' ? <Crown size={20} className="text-[#F5C76B]" /> : <Users size={20} className="text-white/20" />}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-white uppercase font-display leading-none">{member.name}</h4>
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">{member.role}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                           <Sword size={10} className="text-white/20" />
                           <span className="text-[10px] font-black text-white font-stats">{member.power}</span>
                        </div>
                        <p className="text-[8px] font-black text-[#F5C76B] uppercase tracking-tighter mt-1">Donación: {member.contribution}</p>
                     </div>
                  </NineSlicePanel>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Guild Actions */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
           <Button variant="secondary" className="flex-1 py-4">
              <Gift size={16} className="mr-2" /> DONAR
           </Button>
           <Button variant="primary" className="flex-1 py-4">
              CHAT GRUPAL
           </Button>
        </div>
      </div>
    </ViewShell>
  );
}
