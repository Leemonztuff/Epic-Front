'use client';

import React, { Fragment } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Package } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { Button } from '@/components/ui/Button';

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface ViewShellProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  background?: 'home' | 'battle' | 'party' | 'gacha' | 'tavern' | 'campaign' | 'inventory';
  breadcrumbs?: Breadcrumb[];
}

export function ViewShell({ 
  title, 
  subtitle, 
  onBack, 
  children, 
  loading = false, 
  error = null,
  emptyMessage,
  background = 'home',
  breadcrumbs
}: ViewShellProps) {
  const bgUrl = AssetService.getBgUrl(background);

  if (loading) {
    return (
      <div className="flex flex-col h-full relative bg-[#020508]">
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="w-10 h-10 border-2 border-t-[#F5C76B] border-white/5 rounded-full animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-6">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full relative bg-[#020508]">
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <span className="text-red-400 text-2xl font-black">!</span>
          </div>
          <p className="text-white/80 font-stats text-sm mb-6">{error}</p>
          {onBack && (
            <Button onClick={onBack} variant="secondary" size="sm">
              VOLVER
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative bg-[#020508]">
      {/* Background with Overlays */}
      {bgUrl && (
        <div className="absolute inset-0 z-0">
          <img src={bgUrl} className="w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020508] via-transparent to-[#020508]" />
        </div>
      )}
      
      {/* View Header */}
      {title && (
        <div className="relative z-10 flex flex-col gap-2 p-6 pb-2">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-white/20 text-[8px]">/</span>}
                  {crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-[10px] font-bold text-white/40 hover:text-[#F5C76B] uppercase tracking-widest transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[#F5C76B] uppercase tracking-widest">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-white uppercase font-display tracking-tight leading-none">{title}</h1>
              {subtitle && <span className="text-[10px] font-black text-[#F5C76B] uppercase tracking-[0.3em] opacity-60">{subtitle}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pb-6">
        {!children && emptyMessage ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Package size={48} className="text-white/10 mb-4" />
            <p className="text-white/40 font-black text-[10px] uppercase tracking-widest">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Aesthetic Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
}
