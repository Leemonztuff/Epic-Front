'use client';

import { motion, VariantLabels, TargetAndTransition } from 'motion/react';
import { ReactNode } from 'react';
import PixelPlusIcon from './PixelPlusIcon';

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  whileHover?: VariantLabels | TargetAndTransition;
  whileTap?: VariantLabels | TargetAndTransition;
  variant?: 'burst' | 'skill' | 'default';
}

const variantStyles = {
  burst: 'bg-gradient-to-tr from-[#991b1b] via-[#ef4444] to-[#f87171] border-red-400/30',
  skill: 'bg-[#152336] border-cyan-500/20',
  default: 'bg-[#1a2d42] border-white/10'
};

export function ActionButton({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  whileHover,
  whileTap,
  variant = 'default'
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={!disabled ? whileHover : undefined}
      whileTap={!disabled ? whileTap : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-2xl border-2 transition-all flex items-center justify-center 
        overflow-hidden shadow-xl
        min-w-[48px] min-h-[40px] px-3 py-2
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-[#F5C76B]/40'}
        ${className}
      `}
    >
      {React.Children.count(children as any) === 0 ? <PixelPlusIcon className="w-5 h-5 text-white/60" /> : children}
    </motion.button>
  );
}
