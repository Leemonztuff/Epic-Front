'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, TrendingUp, Sparkles, Flame, ChevronLeft } from 'lucide-react';
import { TrainingService, type TrainingResult } from '@/lib/services/training-service';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/contexts/ToastContext';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ViewShell } from '@/components/ui/ViewShell';

interface TrainingViewProps {
  unitId: string;
  unitName: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function TrainingView({ unitId, unitName, onBack, onUpdate }: TrainingViewProps) {
  const { showToast } = useToast();
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);

  const options = TrainingService.getTrainingOptions();

  const handleTrain = async (type: 'basic' | 'intensive' | 'elite') => {
    setTraining(true);
    setResult(null);

    try {
      const res = await TrainingService.trainUnit(unitId, type);
      setResult(res);
      onUpdate();
      showToast('¡Entrenamiento completado!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en entrenamiento';
      showToast(message, 'error');
    } finally {
      setTraining(false);
    }
  };

  return (
    <ViewShell
      title="ENTRENAMIENTO"
      subtitle={unitName}
      onBack={onBack}
      background="party"
    >
      <div className="flex-1 flex flex-col p-6 space-y-8 overflow-hidden">

        {/* Character focus */}
        <div className="flex flex-col items-center py-4">
           <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full" />
              <TrendingUp size={64} className="text-cyan-400 relative z-10 animate-pulse" />
           </div>
           <h3 className="text-xl font-black text-white uppercase font-display mt-6 tracking-widest">{unitName}</h3>
           <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.4em] mt-1">Mejorando Capacidades</p>
        </div>

        {/* Training Options */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
           {options.map((opt) => (
             <NineSlicePanel
               key={opt.id}
               type="border"
               variant="default"
                className="p-5 glass-frosted frame-earthstone flex flex-col gap-4 hover:border-[#F5C76B]/40 cursor-pointer group transition-all"
               onClick={() => !training && handleTrain(opt.id as any)}
             >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                         {opt.id === 'elite' ? <Sparkles size={20} /> : <Zap size={20} />}
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-white uppercase font-display leading-none">{opt.name}</h4>
                         <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1 inline-block">Costo: {opt.energyCost} ENERGÍA</span>
                      </div>
                   </div>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed font-stats">{opt.description}</p>
             </NineSlicePanel>
           ))}
        </div>

        {/* Training Overlay */}
        <AnimatePresence>
          {training && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0B1A2A]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8"
            >
               <div className="relative w-24 h-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-cyan-400 rounded-full"
                  />
                  <Flame size={40} className="absolute inset-0 m-auto text-orange-400 animate-pulse" />
               </div>
               <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mt-8 animate-pulse">ROMPIENDO LÍMITES...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Modal */}
        <AnimatePresence>
          {result && (
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
            >
               <NineSlicePanel type="panel" variant="default" className="p-10 text-center glass-frosted frame-earthstone w-full max-w-xs">
                  <Sparkles size={48} className="text-cyan-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-white uppercase font-display mb-2">¡EXITO!</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">La unidad ha ganado experiencia</p>

                  <div className="flex flex-col items-center gap-2 mb-8">
                     <span className="text-4xl font-black text-cyan-400 font-stats">+{result.expGained}</span>
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">PUNTOS DE EXP</span>
                  </div>

                  <Button onClick={() => setResult(null)} variant="primary" className="w-full">CONTINUAR</Button>
               </NineSlicePanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ViewShell>
  );
}
