'use client';

import React, { useState } from 'react';
import { Image, Search, Sword, Shield, Sparkles, Package, Users, Map } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { SPRITE_ASSETS, UI_ASSETS, BG_ASSETS } from '@/lib/config/assets-config';

const SECTIONS = [
  { id: 'sprites', label: 'Sprites', icon: Users },
  { id: 'ui', label: 'UI Icons', icon: Shield },
  { id: 'backgrounds', label: 'Backgrounds', icon: Map },
  { id: 'weapons', label: 'Weapons', icon: Sword },
];

export default function AdminAssetsPage() {
  const [section, setSection] = useState('sprites');

  const renderSprites = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
      {SPRITE_ASSETS?.CLASSES && Object.entries(SPRITE_ASSETS.CLASSES).map(([job, states]: [string, any]) =>
        Object.entries(states).map(([state, file]: [string, any]) => (
          <div key={`${job}-${state}`} className="bg-black/60 border border-white/5 rounded-xl p-2 flex flex-col items-center">
            <img src={AssetService.getSpriteUrl(file)} className="w-16 h-16 object-contain pixel-art" alt="" />
            <span className="text-[6px] font-black text-white/40 uppercase mt-1 truncate w-full text-center">{job} {state}</span>
          </div>
        ))
      )}
    </div>
  );

  const renderUI = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
      {UI_ASSETS && Object.entries(UI_ASSETS).map(([key, val]: [string, any]) => (
        <div key={key} className="bg-black/60 border border-white/5 rounded-xl p-3 flex flex-col items-center">
          <img src={AssetService.getUIUrl(key)} className="w-12 h-12 object-contain" alt="" />
          <span className="text-[6px] font-black text-white/40 uppercase mt-1 truncate w-full text-center">{key}</span>
        </div>
      ))}
    </div>
  );

  const renderBGs = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {BG_ASSETS && Object.entries(BG_ASSETS).map(([key, val]: [string, any]) => (
        <div key={key} className="bg-black/60 border border-white/5 rounded-xl overflow-hidden">
          <div className="aspect-video bg-black/80">
            <img src={AssetService.getBgUrl(key.toLowerCase())} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          <div className="p-2">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">{key}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Assets</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Game Asset Browser</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              section === s.id
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'bg-black/40 border border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        {section === 'sprites' && renderSprites()}
        {section === 'ui' && renderUI()}
        {section === 'backgrounds' && renderBGs()}
        {section === 'weapons' && (
          <p className="text-[10px] text-white/30">Weapon assets coming soon</p>
        )}
      </div>
    </div>
  );
}
