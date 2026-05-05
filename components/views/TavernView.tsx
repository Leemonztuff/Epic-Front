'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Clock, Sword, Heart, Zap, Trash2 } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Button } from '@/components/ui/Button';
import { ViewShell } from '@/components/ui/ViewShell';
import { useGameStore } from '@/lib/stores/game-store';
import { useToast } from '@/lib/contexts/ToastContext';
import { RecruitmentService } from '@/lib/services/recruitment-service';

interface TavernViewProps {
  onClaim: (slotId: string) => void;
  onBack?: () => void;
}

export function TavernView({ onClaim, onBack }: TavernViewProps) {
  const { confirm } = useToast();
  const tavernSlots = useGameStore(state => state.tavernSlots);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDiscard = async (slotId: string) => {
    const ok = await confirm('¿Descartar este recluta?');
    if (ok) {
      await RecruitmentService.discardRecruit(slotId);
    }
  };

  return (
    <ViewShell
      title="Taberna"
      subtitle="Mercenarios Disponibles"
      onBack={onBack}
      background="tavern"
      emptyMessage={tavernSlots.length === 0 ? "No hay aventureros buscando grupo" : undefined}
    >
      <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar">
        {tavernSlots.map((slot: any) => (
          <RecruitCard
            key={slot.id}
            slot={slot}
            now={now}
            onClaim={onClaim}
            onDiscard={handleDiscard}
          />
        ))}
      </div>
    </ViewShell>
  );
}

function RecruitCard({ slot, now, onClaim, onDiscard }: any) {
  const unit = slot.unit_data;
  const availableAt = new Date(slot.available_at).getTime();
  const isReady = now >= availableAt;
  const timeLeft = Math.max(0, Math.floor((availableAt - now) / 1000));

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <NineSlicePanel
      type="border"
      variant="default"
      className={`glass-frosted frame-earthstone p-4 relative overflow-hidden transition-all ${isReady ? 'hover:border-[#F5C76B]/60' : 'opacity-60'}`}
      as={motion.div}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {!isReady && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20">
          <Clock size={32} className="text-white/40" />
          <p className="text-sm font-black text-white/60 tracking-widest font-mono">
            {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="w-24 h-28 bg-gradient-to-b from-white/10 to-transparent rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
          <ImageWithFallback
            src={AssetService.getSpriteUrl(unit.spriteId)}
            alt="Unit"
            className="w-[180%] object-contain transform translate-y-4 pixel-art group-hover:scale-110 transition-transform duration-500"
            fallbackSrc={AssetService.getSpriteUrl('novice_idle.png')}
          />
          {isReady && (
            <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white uppercase font-display leading-none">{unit.name}</h3>
              <span className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest bg-[#F5C76B]/10 px-1.5 py-0.5 rounded-sm mt-1 inline-block border border-[#F5C76B]/20 font-stats">
                {unit.affinity}
              </span>
            </div>
            {isReady && (
              <button onClick={() => onDiscard(slot.id)} className="text-white/20 hover:text-red-500 transition-colors p-2">
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 font-stats">
            <StatMini label="ATK" value={unit.baseStats.atk} icon={Sword} color="text-red-400" />
            <StatMini label="HP" value={unit.baseStats.hp} icon={Heart} color="text-green-400" />
            <StatMini label="SPD" value={unit.baseStats.spd} icon={Zap} color="text-cyan-400" />
          </div>
        </div>

        <div className="flex items-center">
          {isReady && (
            <Button
              onClick={() => onClaim(slot.id)}
              variant="primary"
              size="sm"
              className="rounded-xl h-full w-16 !p-0 flex flex-col items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              <span className="text-[8px] font-black">RECLUTAR</span>
            </Button>
          )}
        </div>
      </div>
    </NineSlicePanel>
  );
}

function StatMini({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{label}</span>
      <div className="flex items-center gap-1 mt-0.5">
         <Icon size={10} className={color} />
         <span className="text-[10px] font-black text-white/80 tabular-nums">{value}</span>
      </div>
    </div>
  );
}
