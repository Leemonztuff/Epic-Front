'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Sword, MapPin } from 'lucide-react';

interface TutorialStep {
  target?: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '¡BIENVENIDO, HÉROE!',
    description: 'Tu aventura comienza aquí. Tienes 3 guerreros listos para la batalla.',
    position: 'bottom'
  },
  {
    target: 'navigation-campaign',
    title: 'MODO AVENTURA',
    description: 'Explora capítulos, enfrenta monstruos y obtén recompensas épicas.',
    position: 'top'
  },
  {
    target: 'navigation-party',
    title: 'GESTIONA TU EQUIPO',
    description: 'Mejora stats, equipa armas y prepara a tus héroes para el combate.',
    position: 'top'
  }
];

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('has_seen_tutorial');
    if (hasSeenTutorial) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('has_seen_tutorial', 'true');
      setIsVisible(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('has_seen_tutorial', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const icons = [Sword, Sparkles, MapPin];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-gradient-to-br from-[#0B1A2A] to-[#1a2535] border border-[#F5C76B]/30 rounded-3xl p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F5C76B] to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#F5C76B]/10 blur-3xl rounded-full" />

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx <= currentStep ? 'w-8 bg-[#F5C76B]' : 'w-3 bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F5C76B]/10 border border-[#F5C76B]/30 flex items-center justify-center">
                {React.createElement(icons[currentStep] || Sword, { size: 32, className: 'text-[#F5C76B]' })}
              </div>
            </div>

            {/* Content */}
            <h2 className="text-xl font-black text-white text-center uppercase font-display mb-3">
              {step.title}
            </h2>
            <p className="text-sm text-white/60 text-center leading-relaxed mb-8">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isFirst && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  ATRÁS
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-[#F5C76B] text-[#0B1A2A] rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {isLast ? '¡COMENZAR!' : 'SIGUIENTE'}
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors"
            >
              OMITIR TUTORIAL
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function hasSeenTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('has_seen_tutorial') === 'true';
}