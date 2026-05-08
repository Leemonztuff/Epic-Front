'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  ChevronRight,
  Castle,
  Bell,
  Star,
  Trophy,
  Users
} from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { Button } from '@/components/ui/Button';
import type { GameState, PartySlot, ViewType } from '@/lib/types/game-types';

interface RPGHomeViewProps {
  saveData: GameState | null;
  activePartyUnits: PartySlot[];
  onNavigate: (view: ViewType) => void;
  onSelectUnit?: (unitId: string) => void;
}

export function RPGHomeView({
  saveData,
  activePartyUnits,
  onNavigate,
  onSelectUnit
}: RPGHomeViewProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const moveX = (clientX - window.innerWidth / 2) / 40;
    const moveY = (clientY - window.innerHeight / 2) / 40;
    mouseX.set(moveX);
    mouseY.set(moveY);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#020508] font-stats select-none"
      onMouseMove={handleMouseMove}
    >
      {/* Background Layer with Parallax */}
      <motion.div
        style={{
          x: useTransform(mouseX, [ -20, 20 ], [ 10, -10 ]),
          y: useTransform(mouseY, [ -20, 20 ], [ 10, -10 ]),
          scale: 1.1
        }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#020508]/40 via-transparent to-[#020508] z-10" />
        <img
          src={AssetService.getBgUrl('home')}
          alt="Home Background"
          className="w-full h-full object-cover opacity-60"
        />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between p-6">

        {/* Character Stage */}
        <div className="flex-1 flex items-center justify-center relative mt-12">
           <div className="w-full max-w-5xl h-full flex items-end justify-center gap-4 sm:gap-8 pointer-events-none">
            {activePartyUnits.slice(0, 3).map((unit, idx) => (
              <UnitDisplay
                key={unit?.id || `empty-${idx}`}
                unit={unit}
                idx={idx}
                mouseX={mouseX}
                mouseY={mouseY}
                onSelectUnit={onSelectUnit}
              />
            ))}
          </div>

          {/* Current Objective Overlay */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden lg:block">
            <CurrentObjective onNavigate={() => onNavigate('campaign')} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-4 mt-auto mb-4">
           <NotificationBanner onNavigate={onNavigate} />
           <QuickActions onNavigate={onNavigate} />
           <div className="lg:hidden w-full px-4">
             <CurrentObjective onNavigate={() => onNavigate('campaign')} />
           </div>
        </div>
      </div>

      {/* Aesthetic Vignette */}
      <div className="absolute inset-0 pointer-events-none z-40 shadow-[inset_0_0_120px_rgba(0,0,0,0.8)]" />
    </div>
  );
}

function UnitDisplay({ unit, idx, mouseX, mouseY, onSelectUnit }: any) {
  const x = useTransform(mouseX, [ -20, 20 ], [ idx * 2, -idx * 2 ]);
  const y = useTransform(mouseY, [ -20, 20 ], [ idx * 1, -idx * 1 ]);

  if (!unit) return (
    <div className="w-40 h-[50%] border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
       <Star className="w-6 h-6 text-white/10" />
    </div>
  );

  const spriteUrl = AssetService.getSpriteUrl(unit.sprite_id || 'novice_idle.png');

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="relative w-32 sm:w-48 h-[65%] flex flex-col items-center justify-end group pointer-events-auto cursor-pointer"
      onClick={() => onSelectUnit && onSelectUnit(unit.id)}
    >
      {/* Sprite Container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
        className="relative z-20"
      >
        <img
          src={spriteUrl}
          alt={unit.name}
          className="w-full max-w-[192px] aspect-square object-contain pixel-art filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] group-hover:brightness-125 transition-all"
        />

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[#F5C76B]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>

      {/* Name Plate */}
      <div className="mt-4 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl relative overflow-hidden group-hover:border-[#F5C76B]/40 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F5C76B]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <span className="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest font-stats">
          {unit.name}
        </span>
      </div>

      {/* Shadow */}
      <div className="absolute bottom-4 w-32 h-6 bg-black/40 blur-xl rounded-[100%] scale-x-125 -z-10" />
    </motion.div>
  );
}

function QuickActions({ onNavigate }: any) {
  const actions = [
    { id: 'guild', icon: Users, label: 'GREMIO', color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30' },
    { id: 'tower', icon: Trophy, label: 'TORRE', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30' },
  ];

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(action.id)}
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${action.color}`}
        >
          <action.icon size={14} className="text-white/60" />
          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

function CurrentObjective({ onNavigate }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-[280px] pointer-events-auto"
    >
      <Button
        onClick={() => onNavigate('campaign')}
        variant="ghost"
        className="w-full bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl hover:border-[#F5C76B]/30 transition-all shadow-2xl relative overflow-hidden text-left"
      >
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5C76B]/20 to-[#F5C76B]/40 border border-[#F5C76B]/30 flex items-center justify-center">
                 <Castle className="w-5 h-5 text-[#F5C76B]" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest">OBJETIVO ACTUAL</p>
                 <h3 className="text-sm font-black text-white uppercase font-display tracking-tight">El Templo Sumergido</h3>
              </div>
           </div>
           <div className="mt-3 py-2 px-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed italic">
                &quot;Infiltra las profundidades del templo y recupera la Reliquia Antigua.&quot;
              </p>
           </div>
           <div className="mt-2 flex items-center justify-end gap-1 text-[#F5C76B] opacity-40 group-hover:opacity-100 transition-opacity">
             <span className="text-[8px] font-black uppercase tracking-widest">IR AHORA</span>
             <ChevronRight className="w-3 h-3" />
           </div>
      </Button>
    </motion.div>
  );
}

function NotificationBanner({ onNavigate }: any) {
  return (
    <Button
      onClick={() => onNavigate('daily_rewards')}
      variant="ghost"
      className="w-full max-w-md bg-[#F5C76B]/5 border border-[#F5C76B]/20 rounded-xl px-4 py-2 flex items-center gap-3 group hover:bg-[#F5C76B]/10 transition-all pointer-events-auto"
    >
      <div className="relative">
        <Bell className="w-4 h-4 text-[#F5C76B] group-hover:animate-bounce" />
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </div>
      <p className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors flex-1 text-left">
        ¡EVENTO ACTIVO! Reclama tus recompensas diarias.
      </p>
      <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white transition-colors" />
    </Button>
  );
}
