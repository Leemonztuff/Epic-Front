'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, Diamond, Zap, CheckCircle2 } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { Button } from '@/components/ui/Button';
import { ViewShell } from '@/components/ui/ViewShell';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { supabase } from '@/lib/supabase';

interface DailyRewardsViewProps {
  onBack: () => void;
}

export function DailyRewardsView({ onBack }: DailyRewardsViewProps) {
  const [streak, setStreak] = useState(1);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDailyRewardsState = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('player_daily_rewards')
      .select('*')
      .eq('player_id', user.id)
      .single();

    if (data) {
      setStreak(data.streak || 1);
      setLastClaimDate(data.last_claim_date);
    }
  };

  useEffect(() => {
    loadDailyRewardsState();
  }, []);

  const handleClaim = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('rpc_claim_daily_reward');
      if (error) throw error;

      setMessage({ type: 'success', text: '¡RECOMPENSA RECLAMADA!' });
      await loadDailyRewardsState();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reclamar';
      setMessage({ type: 'error', text: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isTodayClaimed = lastClaimDate && new Date(lastClaimDate).toDateString() === new Date().toDateString();

  return (
    <ViewShell
      title="BONUS DIARIO"
      subtitle="Recompensas de Logueo"
      onBack={onBack}
      background="gacha"
    >
      <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-6 overflow-hidden">

        {/* Banner */}
        <NineSlicePanel type="border" variant="fancy" className="p-4 sm:p-6 glass-frosted frame-earthstone relative overflow-hidden shrink-0">
           <div className="relative z-10 flex flex-col items-center text-center">
              <Gift size={48} className="text-[#F5C76B] mb-4 animate-bounce" />
              <h3 className="text-xl font-black text-white uppercase font-display">Senda del Destino</h3>
              <p className="text-[10px] text-[#F5C76B] font-black uppercase tracking-[0.3em] mt-1">Racha Actual: {streak} Días</p>
           </div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#F5C76B]/10 to-transparent pointer-events-none" />
        </NineSlicePanel>

        {/* Rewards Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pr-2 custom-scrollbar content-start">
           {[1, 2, 3, 4, 5, 6, 7].map((day) => {
             const isPast = day < streak;
             const isCurrent = day === streak;
             const isFuture = day > streak;
             const claimed = isPast || (isCurrent && isTodayClaimed);

             return (
               <NineSlicePanel
                 key={day}
                 type="border"
                 variant="default"
                 className={`aspect-square flex flex-col items-center justify-center gap-2 transition-all ${
                   isCurrent && !isTodayClaimed ? 'border-[#F5C76B] bg-[#F5C76B]/5' : 'bg-black/40 border-white/5 opacity-60'
                 } ${claimed ? 'opacity-30 grayscale' : ''}`}
               >
                  <span className="text-[8px] font-black text-white/40 uppercase font-stats">Día {day}</span>
                  {day % 7 === 0 ? <Diamond size={18} className="text-cyan-400" /> : <Coins size={18} className="text-[#F5C76B]" />}
                  {claimed && <CheckCircle2 size={12} className="text-green-500 absolute top-2 right-2" />}
               </NineSlicePanel>
             );
           })}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl text-center border font-black uppercase text-[10px] tracking-widest font-stats ${
                message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <Button
          variant="primary"
          className="w-full py-6 font-display text-lg tracking-[0.2em] shrink-0"
          disabled={isTodayClaimed || isLoading}
          onClick={handleClaim}
        >
          {isTodayClaimed ? 'RECLAMADO' : isLoading ? 'PROCESANDO...' : 'RECLAMAR HOY'}
        </Button>
      </div>
    </ViewShell>
  );
}
