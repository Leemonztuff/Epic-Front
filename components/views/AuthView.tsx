'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AssetService } from '@/lib/services/asset-service';
import { Mail, Lock, UserPlus, LogIn, ShieldCheck, Sparkles, Stars, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanelButton } from '@/components/ui/PanelButton';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';

export function AuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      // Clear any existing session first to avoid stale token issues
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }

      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Handle specific auth errors
          if (signInError.message.includes('Invalid login') || signInError.message.includes('invalid')) {
            throw new Error('Email o contraseña incorrectos');
          }
          if (signInError.message.includes('403') || signInError.message.includes('Forbidden')) {
            throw new Error('Error de autenticación. Por favor, intenta de nuevo.');
          }
          throw signInError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-3 sm:p-4 w-full max-w-sm relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="particle-magic" style={{ top: '10%', left: '20%', animationDelay: '0s' }} />
        <div className="particle-magic" style={{ top: '30%', right: '15%', animationDelay: '1s' }} />
        <div className="particle-magic" style={{ bottom: '40%', left: '10%', animationDelay: '2s' }} />
        <div className="particle-magic" style={{ top: '60%', right: '25%', animationDelay: '0.5s' }} />
        <div className="particle-magic" style={{ bottom: '20%', right: '10%', animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full relative z-10"
      >
        <NineSlicePanel
          type="panel"
          variant="panel-021"
          className="overflow-hidden relative z-10 glass-crystal"
          glassmorphism={true}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-[#0B1A2A]/80 pointer-events-none" />

          {/* Floating decorative elements */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#F5C76B]/5 blur-3xl rounded-full animate-pulse" />

          <div className="p-6 sm:p-10 text-center relative z-10">
            {/* Icon section - logo bigger, no frame, with glow only */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 20 }}
              className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 relative"
            >
              {/* Glow effect only - no border */}
              <div className="absolute inset-0 bg-[#F5C76B]/10 rounded-full blur-2xl animate-pulse" />
              <img
                src={AssetService.getUIUrl('logo')}
                alt="Epic Frontier"
                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(245,199,107,0.5)]"
              />

              {/* Rotating decorative rings - adjusted for larger logo */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-12px] sm:inset-[-16px] border-2 border-dashed border-[#F5C76B]/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] sm:inset-[-24px] border border-dotted border-cyan-400/20 rounded-full"
              />
            </motion.div>

            {/* Title with typography hierarchy */}
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-black text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] font-display"
            >
              Epic Frontier
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mt-3 sm:mt-4 mb-6 sm:mb-8"
            >
              <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#F5C76B]/60" />
              <span className="text-[9px] sm:text-[10px] text-white/40 font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] font-stats">Guardian Access</span>
              <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#F5C76B]/60" />
            </motion.div>
          </div>

          <div className="px-6 sm:px-10 pb-6 sm:pb-10 relative z-10">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <Stars size={64} className="text-[#F5C76B] mx-auto mb-6 drop-shadow-[0_0_30px_rgba(245,199,107,0.5)] animate-pulse" />
                  </motion.div>

                  <div className="text-white font-black uppercase tracking-widest text-xl mb-3 italic font-display">
                    Inscripción Completada
                  </div>
                  <p className="text-white/40 text-[10px] uppercase font-bold leading-relaxed tracking-wider font-stats mb-8">
                    Verifica tu correo electrónico para sellar el pacto y poder entrar al reino.
                  </p>

                  <PanelButton
                    variant="default"
                    onClick={() => { setIsRegistering(false); setSuccess(false); }}
                    className="mt-8 w-full py-4 btn-back"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChevronRight size={16} />
                    <span>Regresar al Portal</span>
                  </PanelButton>
                </motion.div>
              ) : (
                <motion.form
                  key={isRegistering ? 'register' : 'login'}
                  initial={{ opacity: 0, x: isRegistering ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleAuth}
                  className="space-y-6"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[9px] text-red-400 font-black uppercase text-center tracking-tight glass-frosted frame-earthstone"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 font-stats">
                      Firma de Aventurero (Email)
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#F5C76B]/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-sm text-white placeholder-white/10 focus:border-[#F5C76B]/40 focus:outline-none transition-all font-bold tracking-wider"
                        placeholder="usuario@epicfrontier.app"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 font-stats">
                      Código de Encriptación (Clave)
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#F5C76B]/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-sm text-white placeholder-white/10 focus:border-[#F5C76B]/40 focus:outline-none transition-all font-bold tracking-wider"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <PanelButton
                    variant="gold"
                    onClick={() => handleAuth(new Event('submit') as any)}
                    className="w-full py-4 sm:py-5 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(245,199,107,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                        <span className="font-black tracking-widest">
                          {isRegistering ? 'Forjar Perfil' : 'Entrar al Reino'}
                        </span>
                      </>
                    )}
                  </PanelButton>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsRegistering(!isRegistering)}
                      className="text-[10px] font-black text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-stats"
                    >
                      {isRegistering
                        ? '¿Ya eres un Guardián? Conectarse'
                        : '¿Nuevo Aventurero? Crear Cuenta'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </NineSlicePanel>
      </motion.div>
    </div>
  );
}
