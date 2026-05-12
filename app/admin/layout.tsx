'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Users, Swords, Sparkles, Coins,
  BookOpen, Image, Radio, Settings, ChevronLeft,
  Shield, LogOut, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'jobs', label: 'Jobs', icon: Users, href: '/admin/jobs' },
  { id: 'skills', label: 'Skills', icon: Swords, href: '/admin/skills' },
  { id: 'gacha', label: 'Gacha', icon: Sparkles, href: '/admin/gacha' },
  { id: 'economy', label: 'Economy', icon: Coins, href: '/admin/economy' },
  { id: 'quests', label: 'Quests', icon: BookOpen, href: '/admin/quests' },
  { id: 'assets', label: 'Assets', icon: Image, href: '/admin/assets' },
  { id: 'liveops', label: 'Live Ops', icon: Radio, href: '/admin/liveops' },
  { id: 'configs', label: 'Config', icon: Settings, href: '/admin/configs' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase) { setAdminAuthed(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('players')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          setAdminAuthed(true);
          return;
        }
      }
      setAdminAuthed(false);
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    setAdminAuthed(false);
  };

  if (adminAuthed === null) {
    return (
      <div className="min-h-screen bg-[#020508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/5 rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminAuthed) {
    return (
      <div className="min-h-screen bg-[#020508] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Shield size={32} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase font-display tracking-widest">Game Master</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Admin Access Only</p>
          </div>
          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase tracking-widest text-[11px] text-center hover:brightness-110 transition-all"
          >
            Login with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020508] flex text-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        className="relative bg-[#0B1A2A]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col shrink-0 overflow-hidden z-50"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-black uppercase font-display tracking-wider truncate"
            >
              Game Studio
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map(item => {
            const isActive = typeof window !== 'undefined' &&
              window.location.pathname === item.href;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-black uppercase tracking-widest truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/5 p-2 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Collapse
              </motion.span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Logout
              </motion.span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#050A0F]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


