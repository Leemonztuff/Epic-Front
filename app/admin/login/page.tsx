'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === 'EPIC2024') {
      sessionStorage.setItem('admin_authed', 'true');
      router.push('/admin');
    } else {
      setError('Invalid access key');
    }
  };

  return (
    <div className="min-h-screen bg-[#020508] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Shield size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase font-display tracking-widest">Game Master</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Content Studio Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            placeholder="Access Key"
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 text-center tracking-widest font-black uppercase"
            autoFocus
          />
          {error && (
            <p className="text-[10px] text-red-400 text-center font-black uppercase tracking-widest">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all active:scale-95"
          >
            Enter Studio
          </button>
        </form>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-6 text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={12} />
          Back to Game
        </Link>
      </motion.div>
    </div>
  );
}
