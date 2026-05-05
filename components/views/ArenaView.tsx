'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Trophy, Users, Star, Shield } from 'lucide-react';
import { ViewShell } from '@/components/ui/ViewShell';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { Button } from '@/components/ui/Button';

interface ArenaViewProps {
  onBack: () => void;
  playerPower?: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  power: number;
  wins: number;
  rank_tier: string;
}

export function ArenaView({ onBack, playerPower = 5000 }: ArenaViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, username: 'DragonSlayer', power: 15420, wins: 156, rank_tier: 'legendary' },
        { rank: 2, username: 'ShadowKnight', power: 14200, wins: 134, rank_tier: 'epic' },
        { rank: 3, username: 'MysticMage', power: 12800, wins: 112, rank_tier: 'epic' },
        { rank: 4, username: 'ThunderBolt', power: 11500, wins: 98, rank_tier: 'rare' },
        { rank: 5, username: 'IronFist', power: 10200, wins: 87, rank_tier: 'rare' },
      ];
      setLeaderboard(mockLeaderboard);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ViewShell
      title="ARENA"
      subtitle="Coliseo de los Héroes"
      onBack={onBack}
      background="battle"
      loading={isLoading}
    >
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">

        {/* Player Stats Bar */}
        <NineSlicePanel type="border" variant="default" className="p-4 flex items-center justify-between glass-frosted frame-earthstone shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                 <Shield className="text-cyan-400" size={20} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">TU PODER</p>
                 <p className="text-lg font-black text-white font-display">{playerPower.toLocaleString()}</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">RANGO</p>
              <p className="text-sm font-black text-[#F5C76B] font-stats">PLATA II</p>
           </div>
        </NineSlicePanel>

        {/* Leaderboard */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
           <div className="flex items-center gap-2 px-2 shrink-0">
              <Trophy size={14} className="text-[#F5C76B]" />
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-stats">TOP CLASIFICATORIA</h3>
           </div>

           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {leaderboard.map((entry, idx) => (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <NineSlicePanel
                    type="border"
                    variant="default"
                    className="p-3.5 flex items-center justify-between glass-frosted hover:border-[#F5C76B]/40 cursor-pointer group rounded-2xl"
                    onClick={() => setSelectedOpponent(entry)}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center font-display text-[#F5C76B]">
                           {entry.rank}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-white uppercase font-display leading-none">{entry.username}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <Sword size={10} className="text-white/20" />
                              <span className="text-[10px] font-black text-white/40 font-stats">{entry.power.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <Star size={12} className="text-[#F5C76B] fill-[#F5C76B] opacity-20 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[9px] font-black text-white/20 uppercase font-stats">DESAFIAR</span>
                     </div>
                  </NineSlicePanel>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Action Button */}
        <Button variant="primary" className="w-full py-6 font-display text-lg tracking-[0.2em] shrink-0">
          BUSCAR ADVERSARIO
        </Button>
      </div>

      {/* Opponent Modal */}
      <AnimatePresence>
        {selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
            onClick={() => setSelectedOpponent(null)}
          >
             <motion.div
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
               onClick={e => e.stopPropagation()}
               className="w-full max-w-xs"
             >
                <NineSlicePanel type="panel" variant="default" className="p-8 text-center glass-frosted frame-earthstone">
                   <Users size={48} className="text-[#F5C76B] mx-auto mb-6" />
                   <h3 className="text-2xl font-black text-white uppercase font-display mb-1">{selectedOpponent.username}</h3>
                   <p className="text-[10px] text-[#F5C76B] font-black uppercase tracking-widest mb-6">Poder de Combate: {selectedOpponent.power}</p>

                   <div className="grid grid-cols-2 gap-3 mb-8">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[8px] text-white/40 uppercase">VICTORIAS</p>
                         <p className="text-lg font-black text-white font-stats">{selectedOpponent.wins}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[8px] text-white/40 uppercase">RANGO</p>
                         <p className="text-sm font-black text-white uppercase font-stats">{selectedOpponent.rank_tier}</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Button variant="primary" className="w-full">INICIAR DUELO</Button>
                      <Button variant="secondary" className="w-full" onClick={() => setSelectedOpponent(null)}>CANCELAR</Button>
                   </div>
                </NineSlicePanel>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ViewShell>
  );
}
