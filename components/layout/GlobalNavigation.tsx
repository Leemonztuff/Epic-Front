'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MapIcon, Users, UserPlus, Sparkles, Sword } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface GlobalNavigationProps {
  currentView: string;
  onNavigate: (view: any) => void;
}

export function GlobalNavigation({ currentView, onNavigate }: GlobalNavigationProps) {
  const tabs = [
    { id: 'campaign', icon: MapIcon, label: 'AVENTURA', tooltip: 'Explorar capítulos' },
    { id: 'party', icon: Users, label: 'EQUIPO', tooltip: 'Gestionar equipo' },
    { id: 'home', icon: Sword, label: 'INICIO', tooltip: 'Volver al inicio' },
    { id: 'tavern', icon: UserPlus, label: 'TABERNA', tooltip: 'Reclutar héroes' },
    { id: 'gacha', icon: Sparkles, label: 'INVOCAR', tooltip: 'Obtener personajes' },
  ];

  const getActiveTab = () => {
    if (['campaign', 'stage_details', 'quests'].includes(currentView)) return 'campaign';
    if (['party', 'unit_details', 'training'].includes(currentView)) return 'party';
    if (['tavern'].includes(currentView)) return 'tavern';
    if (['gacha'].includes(currentView)) return 'gacha';
    // Default to home for other views like inventory, rewards, etc.
    return 'home';
  };

  const activeTab = getActiveTab();

  // Only show in main views
  const hiddenViews = ['battle', 'auth'];
  if (hiddenViews.includes(currentView)) return null;

  return (
    <nav className="w-full px-4 pb-4 pt-2 z-50 safe-area-bottom">
      <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 flex items-center justify-between shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isRealActive = currentView === tab.id;

          return (
            <Tooltip key={tab.id} content={tab.tooltip || tab.label} position="top">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(tab.id as any)}
              className="relative flex-1 flex flex-col items-center justify-center py-4 gap-1 group min-h-[64px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className="relative">
                <tab.icon
                  size={isActive ? 24 : 22}
                  className={`${isActive ? 'text-[#F5C76B]' : 'text-white/40'} group-hover:text-white transition-colors`}
                />
                {isActive && (
                  <div className="absolute -inset-2 bg-[#F5C76B]/20 blur-lg rounded-full" />
                )}
              </div>

              <span className={`text-[7px] sm:text-[9px] font-black tracking-widest uppercase ${isActive ? 'text-white' : 'text-white/20'}`}>
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 w-1 h-1 bg-[#F5C76B] rounded-full shadow-[0_0_8px_#F5C76B]"
                />
              )}
            </motion.button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
