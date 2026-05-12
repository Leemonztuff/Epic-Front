'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Diamond, Coins, Box, ScrollText, Zap, Info, Star, Sword } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { RarityIcon } from '@/components/ui/RarityIcon';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { Button } from '@/components/ui/Button';
import { ViewShell } from '@/components/ui/ViewShell';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';
import { GachaService, type PullResult } from '@/lib/services/gacha-service';
import { InventoryService } from '@/lib/services/inventory-service';
import { useToast } from '@/lib/contexts/ToastContext';
import { gameDebugger } from '@/lib/debug';
import type { PlayerProfile, ViewType } from '@/lib/types/game-types';

interface GachaViewProps {
  profile: PlayerProfile | null;
  onNavigate: (view: ViewType) => void;
  onPullComplete?: () => void;
}

export function GachaView({ profile, onNavigate, onPullComplete }: GachaViewProps) {
  const { showToast, confirm: confirmToast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [results, setResults] = useState<PullResult[]>([]);
  const [selectedReward, setSelectedReward] = useState<PullResult | null>(null);
  const pullLockRef = useRef(false);

  const handlePull = async (amount: number, currency: 'soft' | 'premium') => {
    if (pullLockRef.current) return;
    pullLockRef.current = true;

    // Confirmation for premium pulls
    if (currency === 'premium') {
      const price = amount === 10 ? 2700 : 300;
      const confirmed = await confirmToast(`¿Gastar ${price} CRISTALES en ${amount}x invocaciones?`);
      if (!confirmed) { pullLockRef.current = false; return; }
    }

    setIsPulling(true);
    setResults([]);
    setSelectedReward(null);
    try {
      const items = await GachaService.pull(amount, currency);
      gameDebugger.info('gacha', 'Pull completed', { count: items.length, items });
      
      // Batch save items to inventory
      await Promise.all(items.map(item =>
        InventoryService.addItem(item.item_id, item.item_type as any, 1)
      ));
      gameDebugger.info('gacha', 'Items saved to inventory', { count: items.length });
      
      setResults(items);

      if (onPullComplete) {
        onPullComplete();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      gameDebugger.error('gacha', 'Pull failed', e);
      showToast(message, 'error');
    } finally {
      setIsPulling(false);
      pullLockRef.current = false;
    }
  };

  const getItemIcon = (item: PullResult) => {
    if (item.item_type === 'weapon') return <Sword size={24} className="text-white/80" />;
    if (item.item_type === 'card') return <img src={AssetService.getCardUrlWithFallback(item.item_id)} className="w-10 h-10 object-contain" alt={item.item_name} />;
    if (item.item_type === 'skill') return <ScrollText size={24} className="text-white/80" />;
    return <Box size={24} className="text-white/80" />;
  };

  return (
    <ViewShell title="INVOCACIÓN" subtitle="Adquiere Equipo Legendario" onBack={() => onNavigate('home')} background="gacha">
      <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-6 overflow-hidden relative">

        {/* Banner Display */}
        <NineSlicePanel type="border" variant="fancy" className="aspect-[16/9] glass-frosted frame-earthstone relative overflow-hidden group shrink-0 panel-elevated-lg">
          <img src={AssetService.getBgUrl('gacha')} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[10s]" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A2A] via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
             <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-[#F5C76B] animate-pulse" />
                <span className="text-[10px] font-black text-[#F5C76B] uppercase tracking-widest">EVENTO LIMITADO</span>
             </div>
             <h2 className="text-xl font-black text-white uppercase font-display leading-none">Forja de las Estrellas</h2>
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-[#F5C76B]/30 px-3 py-1 rounded-full flex items-center gap-2">
             <Info size={12} className="text-[#F5C76B]" />
             <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Detalles Prob.</span>
          </div>
        </NineSlicePanel>

        {/* Currency Display */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
<CurrencyCard icon={Coins} value={profile?.currency || 0} label="ZENY" color="text-[#F5C76B]" />
            <CurrencyCard icon={Diamond} value={profile?.gems || 0} label="CRISTALES" color="text-cyan-400" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <PullButton
            amount={1}
            price={100}
            currency="soft"
            disabled={isPulling || (profile?.currency || 0) < 100}
            insufficient={(profile?.currency || 0) < 100}
            onClick={() => handlePull(1, 'soft')}
          />
          <PullButton
            amount={10}
            price={2700}
            currency="premium"
            disabled={isPulling || (profile?.gems || 0) < 2700}
            insufficient={(profile?.gems || 0) < 2700}
            onClick={() => handlePull(10, 'premium')}
            highlight
          />
        </div>

        {/* Results Overlay */}
        <AnimatePresence>
          {(isPulling || results.length > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#0B1A2A]/98 backdrop-blur-2xl flex flex-col p-4 sm:p-6"
            >
              {isPulling ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:p-6">
                  <div className="relative">
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border-2 border-dashed border-[#F5C76B]/40 rounded-full" />
                     <Sparkles size={40} className="absolute inset-0 m-auto text-[#F5C76B] animate-pulse" />
                  </div>
                  <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">Abriendo Portal...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-white uppercase font-display tracking-widest">RESULTADOS</h3>
                    <div className="w-24 h-1 bg-[#F5C76B] mx-auto mt-2 shadow-[0_0_10px_#F5C76B]" />
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 pr-2 custom-scrollbar content-start">
                    {results.map((item, idx) => (
                      <motion.div
                        key={`${item.item_id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, type: 'spring' }}
                        className="aspect-square relative group cursor-pointer card-premium"
                        onClick={() => setSelectedReward(item)}
                      >
                         <NineSlicePanel type="border" variant="default" rarity={item.rarity} className={`w-full h-full glass-crystal flex items-center justify-center group-hover:scale-105 transition-transform ${item.rarity ? `card-glow-${item.rarity.toLowerCase()}` : ''}`}>
                            {getItemIcon(item)}
                         </NineSlicePanel>
                         {['rare', 'epic', 'legendary', 'mythic'].includes(item.rarity.toLowerCase()) && (
                            <div className="absolute -top-1 -right-1">
                               <Star size={10} className="text-[#F5C76B] fill-[#F5C76B]" />
                            </div>
                         )}
                      </motion.div>
                    ))}
                  </div>

                  <Button onClick={() => setResults([])} variant="primary" className="mt-8 w-full py-6 font-display text-lg tracking-widest">
                    RECOGER RECOMPENSAS
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward Detail Modal */}
        <AnimatePresence>
          {selectedReward && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedReward(null)}
               className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-8 backdrop-blur-md"
            >
               <motion.div
                 initial={{ scale: 0.9, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 onClick={e => e.stopPropagation()}
                 className="w-full max-w-xs"
               >
                  <NineSlicePanel type="panel" variant="default" rarity={selectedReward.rarity} className="p-8 text-center glass-frosted frame-earthstone relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#F5C76B]/10 to-transparent pointer-events-none" />

                     <div className="mb-6 flex justify-center">
                        <RarityIcon rarity={getRarityCode(selectedReward.rarity)} size="lg" glass>
                           <div className="p-4">{getItemIcon(selectedReward)}</div>
                        </RarityIcon>
                     </div>

                     <h4 className="text-2xl font-black text-white uppercase font-display mb-1">{selectedReward.item_name}</h4>
                     <RarityBadge rarity={selectedReward.rarity} className="mx-auto mb-4" />

                     <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-6">
                        Nuevo objeto añadido al inventario
                     </p>

                     <Button onClick={() => setSelectedReward(null)} variant="secondary" size="sm" className="w-full">
                        CERRAR
                     </Button>
                  </NineSlicePanel>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ViewShell>
  );
}

interface CurrencyCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  label: string;
  color: string;
}

function CurrencyCard({ icon: Icon, value, label, color }: CurrencyCardProps) {
  return (
    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
       <div className="flex items-center gap-2">
          <Icon size={12} className={color} />
          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-sm font-black text-white tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

interface PullButtonProps {
  amount: number;
  price: number;
  currency: 'soft' | 'premium';
  onClick: () => void;
  disabled: boolean;
  insufficient?: boolean;
  highlight?: boolean;
}

function PullButton({ amount, price, currency, onClick, disabled, insufficient, highlight }: PullButtonProps) {
  const Icon = currency === 'soft' ? Coins : Diamond;
  const color = currency === 'soft' ? 'text-[#F5C76B]' : 'text-cyan-400';
  
  return (
    <Button
      whileHover={!disabled ? { y: -4, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      variant={highlight ? 'primary' : 'secondary'}
      className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all card-premium ${
        highlight
          ? 'border-[#F5C76B]/30 shadow-[0_10px_30px_rgba(245,199,107,0.1)] card-glow-rare'
          : 'border-white/10 hover:bg-white/10'
      } ${disabled ? 'opacity-50 grayscale' : ''} ${insufficient ? 'border-red-500/30' : ''}`}
    >
      <div className="flex items-center gap-2">
         <Sparkles size={16} className={highlight ? 'text-[#F5C76B]' : 'text-white/40'} />
         <span className="text-lg font-black text-white uppercase font-display italic">x{amount}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/5">
         <Icon size={10} className={color} />
         <span className={`text-[10px] font-black ${insufficient ? 'text-red-400' : color} tabular-nums`}>{price.toLocaleString()}</span>
      </div>
    </Button>
  );
}
