'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, Swords, Sparkles, Coins,
  BookOpen, Image, Radio, Settings, ChevronLeft,
  Shield, LogOut, Menu, X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

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

function NavLink({ item, collapsed, mobile, onClick }: { item: typeof NAV_ITEMS[0]; collapsed?: boolean; mobile?: boolean; onClick?: () => void }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') setActive(window.location.pathname === item.href);
  }, [item.href]);

  if (mobile) {
    return (
      <a href={item.href} onClick={onClick}
        className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[44px] min-h-[44px] touch-manipulation ${
          active ? 'text-cyan-400' : 'text-white/30 hover:text-white/60'
        }`}
      >
        <item.icon size={20} />
        <span className="text-[7px] font-black uppercase tracking-wider">{item.label}</span>
      </a>
    );
  }

  return (
    <a href={item.href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl transition-all group touch-manipulation ${
        active ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white hover:bg-white/5'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>}
    </a>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase) { setAdminAuthed(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('players').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') { setAdminAuthed(true); return; }
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
          <Link href="/" className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase tracking-widest text-[11px] text-center hover:brightness-110 transition-all">
            Login with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#020508] text-white flex flex-col">
        <header className="flex items-center justify-between px-4 h-14 bg-[#0B1A2A]/90 backdrop-blur-2xl border-b border-white/5 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-sm font-black uppercase font-display tracking-wider">Studio</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-red-400/60 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#050A0F] pb-20">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0B1A2A]/95 backdrop-blur-2xl border-t border-white/5 safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-1">
            {NAV_ITEMS.slice(0, 5).map(item => (
              <NavLink key={item.id} item={item} mobile />
            ))}
            <div className="relative">
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[44px] min-h-[44px] text-white/30 hover:text-white/60 touch-manipulation"
              >
                <Menu size={20} />
                <span className="text-[7px] font-black uppercase tracking-wider">More</span>
              </button>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-[#0B1A2A]/95 backdrop-blur-2xl border border-white/5 rounded-2xl p-2 shadow-2xl min-w-[180px]"
                  >
                    {NAV_ITEMS.slice(5).map(item => (
                      <NavLink key={item.id} item={item} onClick={() => setSidebarOpen(false)} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-[#020508] flex text-white">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        className={`relative bg-[#0B1A2A]/90 backdrop-blur-2xl border-r border-white/5 flex-col shrink-0 overflow-hidden z-50 ${
          sidebarOpen ? 'flex' : 'hidden lg:flex'
        }`}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            {!collapsed && <span className="text-sm font-black uppercase font-display tracking-wider truncate">Game Studio</span>}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.id} item={item} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="border-t border-white/5 p-2 space-y-1">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all touch-manipulation"
          >
            <ChevronLeft size={18} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all touch-manipulation"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto bg-[#050A0F] min-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
