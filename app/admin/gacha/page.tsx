'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Sword, ScrollText, Package, Star, Box } from 'lucide-react';
import { GACHA_ITEMS, GACHA_DATABASE } from '@/lib/rpg-system/gacha-data';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  card: <ScrollText size={14} className="text-purple-400" />,
  weapon: <Sword size={14} className="text-amber-400" />,
  job_core: <Star size={14} className="text-cyan-400" />,
  skill_fragment: <Box size={14} className="text-green-400" />,
};

export default function AdminGachaPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Gacha</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Item Database — {GACHA_ITEMS.length} items</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GACHA_ITEMS.map((item, i) => {
          const rarityCode = getRarityCode(item.rarity);
          const color = RARITY_COLORS[rarityCode as keyof typeof RARITY_COLORS] || '#9CA3AF';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-black/40 border border-white/5 rounded-2xl p-4 panel-elevated"
              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center">
                  {TYPE_ICONS[item.type] || <Package size={14} className="text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-white uppercase font-display truncate">{item.name}</h3>
                  <span className="text-[8px] font-black uppercase tracking-wider" style={{ color }}>{rarityCode}</span>
                </div>
              </div>
              <p className="text-[9px] text-white/40 leading-relaxed mb-2 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-wider">{item.id}</span>
                <span className="text-[7px] font-black text-white/20">·</span>
                <span className="text-[7px] font-black text-white/20 uppercase">{item.type}</span>
                {'pieceCount' in item && item.pieceCount && (
                  <>
                    <span className="text-[7px] font-black text-white/20">·</span>
                    <span className="text-[7px] font-black text-green-400">{item.pieceCount} pcs</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
