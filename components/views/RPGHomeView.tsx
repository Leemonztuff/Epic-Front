'use client';

import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, MotionValue } from 'motion/react';
import { ChevronRight, Castle, Bell, Star, Trophy, Users, BookOpen } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { Button } from '@/components/ui/Button';
import type { GameState, GameUnit, ViewType } from '@/lib/types/game-types';
import { SpriteConfigService } from '@/lib/services/sprite-config-service';

interface RPGHomeViewProps {
  saveData: GameState | null;
  activePartyUnits: (GameUnit | null)[];
  onNavigate: (view: ViewType) => void;
  onSelectUnit?: (unitId: string) => void;
}

export function RPGHomeView({
  saveData,
  activePartyUnits,
  onNavigate,
  onSelectUnit,
}: RPGHomeViewProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const moveX = (clientX - window.innerWidth / 2) / 40;
    const moveY = (clientY - window.innerHeight / 2) / 40;
    mouseX.set(moveX);
    mouseY.set(moveY);
  }, [mouseX, mouseY]);

  // Reorder party: [left, center, right] → center is idx=1
  const partySlots = activePartyUnits.slice(0, 3);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#020508] font-stats select-none"
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
    >
      {/* Background Layer with Parallax */}
      <motion.div
        style={{
          x: useTransform(mouseX, [-20, 20], [10, -10]),
          y: useTransform(mouseY, [-20, 20], [10, -10]),
          scale: 1.1,
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

      {/* Atmospheric Fog Layer - between BG and characters */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] z-[5] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020508] via-[#020508]/60 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-48 bg-blue-500/8 blur-[100px] rounded-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between p-6">
        {/* Character Stage - JRPG Cinematic Composition */}
        <div className="flex-1 flex items-end justify-center relative" style={{ marginTop: '-2%' }}>
          <div className="w-full max-w-lg h-full flex items-end justify-center pointer-events-none relative">
            {/* Render order: sides first (behind), then center (front) */}
            {[0, 2, 1].map((slotIdx) => {
              const unit = partySlots[slotIdx];
              return (
                <UnitDisplay
                  key={unit?.id || `empty-${slotIdx}`}
                  unit={unit}
                  idx={slotIdx}
                  totalUnits={partySlots.length}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  onSelectUnit={onSelectUnit}
                />
              );
            })}
          </div>

          {/* Current Objective Overlay */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden lg:block">
            <CurrentObjective onNavigate={() => onNavigate('campaign')} />
          </div>
        </div>

        {/* Bottom Section - reduced presence */}
        <div className="flex flex-col items-center gap-3 mt-auto mb-2 relative z-30">
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

interface UnitDisplayProps {
  unit: GameUnit | null;
  idx: number;
  totalUnits: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  onSelectUnit?: (unitId: string) => void;
}

function UnitDisplay({ unit, idx, totalUnits, mouseX, mouseY, onSelectUnit }: UnitDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const isCenter = idx === 1;
  const isLeft = idx === 0;

  // Parallax: center moves less, sides move more
  const parallaxFactor = isCenter ? 1 : 3;
  const x = useTransform(mouseX, [-20, 20], [parallaxFactor * (isLeft ? 1 : -1), -parallaxFactor * (isLeft ? 1 : -1)]);
  const y = useTransform(mouseY, [-20, 20], [1, -1]);

  if (!unit)
    return (
      <div
        className={`flex-shrink-0 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center bg-white/5 backdrop-blur-sm ${
          isCenter ? 'w-44 sm:w-56 h-[70%]' : 'w-28 sm:w-36 h-[55%]'
        }`}
        style={{
          zIndex: isCenter ? 30 : 10,
          ...(isLeft ? { marginRight: '-24px' } : !isCenter ? { marginLeft: '-24px' } : {}),
        }}
      >
        <Star className="w-6 h-6 text-white/10" />
      </div>
    );

  const spriteUrl = SpriteConfigService.getJobSpriteUrl(unit.current_job_id || unit.sprite_id || 'novice');

  // Staging config
  const stageConfig = isCenter
    ? {
        containerClass: 'w-56 sm:w-72',
        spriteClass: 'max-w-[320px] max-h-[420px]',
        zIndex: 30,
        floatDelay: 0,
        floatAmplitude: [-10, 0, -10],
        nameSize: 'text-[11px]',
        glowOpacity: 'opacity-30',
        margin: {},
        brightness: 'brightness-100',
        blur: '',
      }
    : {
        containerClass: 'w-32 sm:w-44',
        spriteClass: 'max-w-[200px] max-h-[280px]',
        zIndex: 10,
        floatDelay: idx * 0.7,
        floatAmplitude: [-5, 0, -5],
        nameSize: 'text-[9px]',
        glowOpacity: 'opacity-10',
        margin: isLeft ? { marginRight: '-28px' } : { marginLeft: '-28px' },
        brightness: 'brightness-75',
        blur: 'blur-[0.5px]',
      };

  return (
    <motion.div
      style={{ x, y, zIndex: stageConfig.zIndex, ...stageConfig.margin }}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: isCenter ? 0 : 0.15 + idx * 0.1, duration: 0.6 }}
      className={`relative ${stageConfig.containerClass} flex flex-col items-center justify-end group pointer-events-auto cursor-pointer flex-shrink-0`}
      onClick={() => onSelectUnit && onSelectUnit(unit.id)}
    >
      {/* Rim light - behind sprite */}
      {isCenter && (
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-gradient-to-t from-transparent via-[#F5C76B]/5 to-[#F5C76B]/15 blur-[60px] rounded-full pointer-events-none z-0" />
      )}

      {/* Sprite Container */}
      <motion.div
        animate={{ y: stageConfig.floatAmplitude }}
        transition={{ duration: isCenter ? 5 : 4, repeat: Infinity, ease: 'easeInOut', delay: stageConfig.floatDelay }}
        className="relative z-20"
      >
        {imgError ? (
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/5 flex items-center justify-center">
            <Star className="w-10 h-10 text-white/20" />
          </div>
        ) : (
          <img
            src={spriteUrl}
            alt={unit.name}
            onError={() => setImgError(true)}
            className={`w-full ${stageConfig.spriteClass} aspect-auto object-contain pixel-art ${stageConfig.brightness} ${stageConfig.blur} group-hover:brightness-125 transition-all duration-500`}
            style={{
              filter: isCenter
                ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))'
                : 'drop-shadow(0 10px 20px rgba(0,0,0,0.6)) brightness(0.7)',
            }}
          />
        )}

        {/* Heroic Glow */}
        <div className={`absolute inset-0 bg-[#F5C76B]/10 blur-3xl rounded-full ${stageConfig.glowOpacity} group-hover:opacity-60 transition-opacity duration-500`} />
      </motion.div>

      {/* Atmospheric Floor Glow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${isCenter ? 'w-[200%] h-16' : 'w-[150%] h-10'} bg-blue-500/8 blur-[40px] rounded-full pointer-events-none`} />

      {/* Name Plate */}
      <div className={`nameplate mt-2 group-hover:border-[#F5C76B]/40 transition-all duration-300 ${!isCenter ? 'opacity-60' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F5C76B]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <span className={`${stageConfig.nameSize} font-black text-white/60 group-hover:text-white uppercase tracking-widest font-stats relative z-10`}>
          {unit.name}
        </span>
      </div>

      {/* Ground Shadow */}
      <div className={`absolute bottom-0 ${isCenter ? 'w-52 h-10' : 'w-32 h-6'} bg-black/60 blur-2xl rounded-[100%] scale-x-150 -z-10`} />
    </motion.div>
  );
}

interface QuickActionsProps {
  onNavigate: (view: ViewType) => void;
}

function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions = [
    {
      id: 'guild' as const,
      icon: Users,
      label: 'GREMIO',
      color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30',
    },
    {
      id: 'tower' as const,
      icon: Trophy,
      label: 'TORRE',
      color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    },
    {
      id: 'quests' as const,
      icon: BookOpen,
      label: 'MISIONES',
      color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {actions.map(action => (
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
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {action.label}
          </span>
        </Button>
      ))}
    </div>
  );
}

interface CurrentObjectiveProps {
  onNavigate: (view: ViewType) => void;
}

function CurrentObjective({ onNavigate }: CurrentObjectiveProps) {
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
            <p className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest">
              OBJETIVO ACTUAL
            </p>
            <h3 className="text-sm font-black text-white uppercase font-display tracking-tight">
              El Templo Sumergido
            </h3>
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

interface NotificationBannerProps {
  onNavigate: (view: ViewType) => void;
}

function NotificationBanner({ onNavigate }: NotificationBannerProps) {
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
