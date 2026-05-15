'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Coins,
  Diamond,
  Calendar,
  Bell,
  Mail,
  Zap,
  Sparkles,
  UserPlus,
  Sword,
  Star,
  BookOpen,
  Heart,
  Shield,
  Info,
  ChevronRight,
  TrendingUp,
  Gift,
  Trophy,
  Crown,
  Castle
} from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { Button } from '@/components/ui/Button';
import { LevelProgress } from '@/components/ui/LevelProgress';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { getExpForNextLevel, getUnlockForLevel } from '@/lib/config/level-curve';
import { RARITY_COLORS, getRarityCode } from '@/lib/config/assets-config';

interface RPGHomeViewProps {
  saveData: any;
  activePartyUnits: any[];
  onNavigate: (view: import('@/lib/types/game-types').ViewType) => void;
  onSelectUnit?: (unitId: string) => void;
}

const rarityColor = (rarity: string) => {
  const code = getRarityCode(rarity);
  return RARITY_COLORS[code] || RARITY_COLORS.C;
};

const CharacterSlot = ({ unit, scale = 1, zIndex = 1, emphasized = false, flipped = false, onSelectUnit }: any) => {
  const sprite = unit ? AssetService.getSpriteUrl(unit.sprite_id ||
    (unit.name && unit.name.toLowerCase().includes('kael') ? AssetService.getJobSpriteId('archer') :
     unit.name && unit.name.toLowerCase().includes('garran') ? AssetService.getJobSpriteId('swordman') :
     'novice')
  ) : undefined;

  const rarity = unit?.rarity || (emphasized ? 'UR' : 'R');
  const color = rarityColor(rarity);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", damping: 12 }}
      className={`relative flex flex-col items-center justify-end h-full w-full ${emphasized ? "z-20" : "z-10"} cursor-pointer`}
      onClick={() => unit && onSelectUnit && onSelectUnit(unit.id)}
      style={{ scale: scale * 1.45 }}
    >
      {/* Rarity Aura / Glow behind character */}
      {unit && (
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-32 h-32 blur-3xl opacity-30 pointer-events-none rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Rarity Badge above Character head - positioned closer to sprite */}
      {unit && (
        <motion.div
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute top-[8%] left-1/2 -translate-x-1/2 -translate-y-full z-20"
        >
          <RarityBadge rarity={unit.rarity || rarity} size="sm" />
        </motion.div>
      )}

{/* Character Sprite */}
      <div className="relative w-full h-[70%] flex items-center justify-center mb-2">
        {unit ? (
          <>
            {/* Ground Shadow - more prominent */}
            <div className="absolute bottom-1 w-24 h-5 bg-black/50 blur-xl rounded-full -z-10" />

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3 + (emphasized ? 0 : 1), repeat: Infinity, ease: "easeInOut", delay: emphasized ? 0 : 0.5 }}
              className={`w-[180%] max-w-[200px] h-auto object-contain origin-bottom relative ${flipped ? 'scale-x-[-1]' : ''}`}
            >
              <ImageWithFallback
                src={sprite || ''}
                alt={unit.name}
                className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
                fallbackSrc={AssetService.getSpriteUrl('novice_idle.png')}
              />
            </motion.div>
          </>
        ) : (
           <div className="w-16 h-16 rounded-full bg-black/30 border-2 border-dashed border-white/10 flex items-center justify-center mb-8">
             <Users size={24} className="text-white/20" />
           </div>
        )}
      </div>

      {/* Stat Panel Below - More compact and premium */}
      {unit && (
        <NineSlicePanel
          type="border"
          variant="default"
          className="w-[120%] p-3 glass-frosted frame-earthstone relative overflow-hidden group hover:border-white/20 transition-all"
          style={{ borderColor: `${color}44` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0B1A2A] border border-white/10 px-3 py-0.5 rounded-full shadow-lg z-10">
             <span className="text-[10px] font-black text-white uppercase tracking-tighter">LV.{unit.level || 60}</span>
          </div>
          <h4 className="text-center text-white text-[11px] font-black tracking-widest uppercase truncate mb-2 mt-1 drop-shadow-md">{unit.name}</h4>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-stats font-bold">
             <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                <span className="text-pink-400/80 uppercase">HP</span>
                <span className="text-white">{(unit.base_stats?.hp || unit.baseStats?.hp || 300)}</span>
             </div>
             <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                <span className="text-orange-400/80 uppercase">ATK</span>
                <span className="text-white">{(unit.base_stats?.atk || unit.baseStats?.atk || 250)}</span>
             </div>
          </div>
        </NineSlicePanel>
      )}
    </motion.div>
  );
};

export function RPGHomeView({ saveData, activePartyUnits, onNavigate, onSelectUnit }: RPGHomeViewProps) {
  // Sort units by rarity for visual distribution (highest rarity in center/foreground)
  const rarityOrder = { 'SSR': 4, 'UR': 3, 'SR': 2, 'R': 1, 'N': 0 };
  const sortedUnits = [...(activePartyUnits || [])].filter(Boolean).sort((a, b) => {
    if (!a || !b) return 0;
    const rarityA = (a.rarity || 'N').toUpperCase();
    const rarityB = (b.rarity || 'N').toUpperCase();
    return (rarityOrder[rarityB as keyof typeof rarityOrder] || 0) - (rarityOrder[rarityA as keyof typeof rarityOrder] || 0);
  });

  // Distribute: highest rarity center, others flanking
  const validUnits = activePartyUnits?.filter(Boolean) || [];
  const primaryUnit = sortedUnits[0] || validUnits[0] || null;
  const leftUnit = sortedUnits[1] || validUnits[1] || null;
  const rightUnit = sortedUnits[2] || validUnits[2] || null;

  const [displayCurrency, setDisplayCurrency] = useState<number>(saveData.profile?.currency || 0);
  const [displayGems, setDisplayGems] = useState<number>(saveData.profile?.premium_currency || 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayCurrency < (saveData.profile?.currency || 0)) setDisplayCurrency(prev => Math.min(saveData.profile?.currency || 0, prev + 100));
      if (displayGems < (saveData.profile?.premium_currency || 0)) setDisplayGems(prev => Math.min(saveData.profile?.premium_currency || 0, prev + 10));
    }, 30);
      return () => clearTimeout(timer);
  }, [saveData.profile?.currency, saveData.profile?.premium_currency, displayCurrency, displayGems]);

  const playerLevel = saveData.profile?.level || 1;
  const playerExp = saveData.profile?.exp || 0;
  const nextLevelExp = playerLevel * 100;
  const expProgress = Math.min((playerExp / nextLevelExp) * 100, 100);

  return (
    <div
      className="w-full h-full flex flex-col relative bg-[#0B1A2A] bg-cover bg-center bg-no-repeat overflow-hidden font-sans"
      style={{ backgroundImage: `url('${AssetService.getBgUrl('home')}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1A2A]/40 via-transparent to-[#020508]/95 pointer-events-none" />

      {/* Top Bar - 8px Grid Spacing */}
      <div className="w-full shrink-0 flex items-center justify-between px-6 z-30 pt-8 gap-4">
        {/* Left: Player Profile */}
        <div className="relative flex items-center gap-4">
           <div className="relative group cursor-pointer" onClick={() => onNavigate('profile')}>
              <div className="absolute inset-0 bg-[#F5C76B] blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
              <div className="w-14 h-14 rounded-full border-2 border-[#F5C76B]/60 bg-gradient-to-b from-[#2a3b5c] to-[#1a253a] flex items-center justify-center shadow-2xl relative overflow-hidden">
                <span className="text-xl font-black text-white italic">{saveData.profile?.username?.charAt(0).toUpperCase() || 'A'}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#F5C76B] text-[#0B1A2A] text-[9px] font-black px-1.5 py-0.5 rounded-md border border-[#0B1A2A] shadow-md">
                {playerLevel}
              </div>
           </div>

<div className="flex flex-col gap-1">
               <h2 className="text-white text-sm font-black tracking-widest uppercase italic drop-shadow-md">
                 {saveData.profile?.username || "Commander"}
               </h2>
               <div className="w-40">
                 <LevelProgress
                   level={playerLevel}
                   currentExp={playerExp}
                   showUnlocks={true}
                   compact={true}
                 />
               </div>
            </div>
        </div>

        {/* Right: Currencies */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
             <motion.div
               whileHover={{ scale: 1.05 }}
               className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3 pl-3 pr-1 py-1 min-w-[110px] shadow-lg"
             >
               <Coins size={14} className="text-[#F5C76B] drop-shadow-[0_0_5px_rgba(245,199,107,0.5)]" />
               <span className="text-[11px] font-black text-white font-stats flex-1 text-center">{displayCurrency.toLocaleString()}</span>
               <button className="w-5 h-5 rounded-lg bg-[#F5C76B]/20 text-[#F5C76B] flex items-center justify-center hover:bg-[#F5C76B]/30 transition-colors">
                 <span className="text-xs font-black">+</span>
               </button>
             </motion.div>

<motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3 pl-3 pr-1 py-1 min-w-[110px] shadow-lg"
              >
                <Diamond size={14} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <span className="text-[11px] font-black text-white font-stats flex-1 text-center">{displayGems.toLocaleString()}</span>
                <button className="w-5 h-5 rounded-lg bg-cyan-400/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-400/30 transition-colors">
                  <span className="text-xs font-black">+</span>
                </button>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('daily_rewards')}
                className="relative p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl border border-purple-400 shadow-lg"
                title="Daily Rewards"
              >
                <Gift size={20} className="text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </motion.button>
          </div>

          <button className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all active:scale-90 relative shadow-xl">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B1A2A]" />
          </button>
        </div>
      </div>

      {/* Battle CTA - Main Focus */}
      <div className="w-full flex flex-col items-center mt-12 z-40">
        <div className="relative group">
          {/* Pulse Glow Effect */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-cyan-400 blur-2xl rounded-full opacity-40 pointer-events-none"
          />

          <motion.button
            onClick={() => onNavigate('campaign')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium-blue px-16 py-5 text-2xl font-black font-display tracking-[0.2em] uppercase z-10 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,172,254,0.4)]"
          >
            <Sword size={24} className="animate-pulse" />
            BATTLE
          </motion.button>

          {/* Star decorations */}
          <div className="absolute -right-6 -top-4 flex flex-col gap-1 z-20">
            {[1,2,3].map(i => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
              >
                <Star size={12 + i * 2} className="text-yellow-400 fill-current drop-shadow-[0_2px_10px_rgba(245,199,107,0.8)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Display Area (Characters) - Fixed spacing */}
      <div className="flex-1 relative flex items-center justify-center px-4 -mt-12 overflow-hidden">
        {/* Background Magic Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] aspect-square bg-blue-900/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />

        <div className="w-full h-full max-w-2xl flex items-center justify-center relative pb-0 gap-0 overflow-hidden">
          <div className="w-[28%] h-[90%] flex items-end -mr-4">
            <CharacterSlot unit={leftUnit} onSelectUnit={onSelectUnit} scale={0.95} zIndex={10} flipped />
          </div>
          <div className="w-[36%] h-[100%] flex items-end z-20">
            <CharacterSlot unit={primaryUnit} onSelectUnit={onSelectUnit} scale={1.1} zIndex={30} emphasized />
          </div>
          <div className="w-[28%] h-[90%] flex items-end -ml-4">
            <CharacterSlot unit={rightUnit} onSelectUnit={onSelectUnit} scale={0.95} zIndex={10} />
          </div>
        </div>

        {/* Floating Sidebar Actions */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
          {[
            { icon: Calendar, label: 'DAILY', badge: saveData.canClaimDaily ? '!' : null, view: 'daily_rewards', color: 'text-yellow-400' },
            { icon: BookOpen, label: 'TRAIN', badge: null, view: 'training', color: 'text-cyan-400' },
            { icon: Mail, label: 'NOTIFS', badge: '1', view: 'quests', color: 'text-white' }
          ].map((btn, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1, x: -5 }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer relative"
              onClick={() => onNavigate(btn.view as any)}
            >
              <NineSlicePanel
                type="border"
                variant="fancy"
                className="w-14 h-14 flex flex-col items-center justify-center glass-frosted frame-earthstone group-hover:border-[#F5C76B] transition-all shadow-2xl"
              >
                <btn.icon size={20} className={`${btn.color} mb-0.5 drop-shadow-[0_0_5px_currentColor]`} />
                <span className="text-[7px] font-black text-white/90 uppercase tracking-[0.2em] font-stats">{btn.label}</span>
                {btn.badge && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-[#0B1A2A] flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-bounce">
                    {btn.badge}
                  </div>
                )}
              </NineSlicePanel>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Area: Objective & Nav */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center pb-8 pt-20 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent">

          {/* Bottom Dock Navigation */}
          <div className="w-full px-6 flex justify-center pointer-events-auto">
            <div className="flex max-w-xl w-full justify-between gap-3 bg-black/40 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/5 shadow-2xl">
              {[
                { id: 'party', icon: Users, label: 'PARTY', active: true },
                { id: 'tavern', icon: UserPlus, label: 'RECRUIT', badge: 'new' },
                { id: 'gacha', icon: Sparkles, label: 'GACHA', badge: '1', activeGlow: true },
                { id: 'inventory', icon: Sword, label: 'EQUIP', action: 'inventory' }
              ].map((btn) => (
                <motion.button
                  key={btn.id}
                  onClick={() => onNavigate(btn.id as any)}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 h-20 flex flex-col items-center justify-center gap-1.5 relative rounded-2xl transition-all border ${
                    btn.active
                      ? 'bg-gradient-to-b from-[#2a3b5c] to-[#1a253a] border-[#F5C76B]/60 shadow-[0_0_20px_rgba(245,199,107,0.15)]'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`relative ${btn.active ? 'scale-110' : ''} transition-transform`}>
                    <btn.icon size={24} className={btn.active ? 'text-[#F5C76B]' : 'text-white/40'} />
                    {btn.activeGlow && (
                      <motion.div
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-cyan-400 blur-md rounded-full -z-10"
                      />
                    )}
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase font-stats ${btn.active ? 'text-[#F5C76B]' : 'text-white/30'}`}>
                    {btn.label}
                  </span>

                  {btn.badge && (
                    <div className={`absolute -top-1 -right-1 ${btn.badge === 'new' ? 'bg-orange-500 rounded px-1.5 py-0.5' : 'w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'} border-2 border-[#0B1A2A] text-[8px] font-black text-white uppercase tracking-tighter shadow-lg`}>
                      {btn.badge}
                    </div>
                  )}

                  {btn.active && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -bottom-1 w-8 h-1 bg-[#F5C76B] rounded-full shadow-[0_0_10px_#F5C76B]"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Contextual Feature Buttons - Unlock based on level */}
          {playerLevel >= 15 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-6 pb-4"
            >
              <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest text-center mb-2">
                Available Features
              </div>
              <div className="flex gap-2 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('guild')}
                  className="flex-1 max-w-[140px] py-2.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 flex flex-col items-center gap-1"
                >
                  <Users size={18} className="text-indigo-400" />
                  <span className="text-[8px] font-bold text-indigo-300 uppercase">Guild</span>
                </motion.button>

                {playerLevel >= 30 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('arena')}
                    className="flex-1 max-w-[140px] py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30 flex flex-col items-center gap-1"
                  >
                    <Trophy size={18} className="text-red-400" />
                    <span className="text-[8px] font-bold text-red-300 uppercase">Arena PvP</span>
                  </motion.button>
                )}

                {playerLevel >= 35 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('tower')}
                    className="flex-1 max-w-[140px] py-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30 flex flex-col items-center gap-1"
                  >
                    <Castle size={18} className="text-amber-400" />
                    <span className="text-[8px] font-bold text-amber-300 uppercase">Tower</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('daily_rewards')}
                  className="flex-1 max-w-[140px] py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 flex flex-col items-center gap-1"
                >
                  <Gift size={18} className="text-green-400" />
                  <span className="text-[8px] font-bold text-green-300 uppercase">Daily</span>
                </motion.button>
              </div>
            </motion.div>
          )}
      </div>
    </div>
  );
}

// Helper icons for objective panel
function Target(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
