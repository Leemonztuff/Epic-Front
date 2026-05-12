'use client';

import React, { useState } from 'react';
import { Radio, Bell, Megaphone, Calendar, Zap, AlertTriangle } from 'lucide-react';

export default function AdminLiveOpsPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Live Ops</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Live Operations & Events</p>
      </div>

      {/* Broadcast */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Megaphone size={14} className="text-amber-400" />
          Send Notification
        </h2>
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Notification message..."
            className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 resize-none h-24"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}} 
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Broadcast
            </button>
            <span className="text-[9px] text-white/30 font-black uppercase tracking-wider">
              Will notify all online players
            </span>
          </div>
        </div>
      </div>

      {/* Active Events */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-green-400" />
          Active Events
        </h2>
        <div className="flex items-center justify-center py-12 text-white/20">
          <Radio size={32} className="mr-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">No active events</span>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated border-red-500/20">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          Maintenance Mode
        </h2>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/30 transition-all">
            Enable Maintenance
          </button>
          <span className="text-[9px] text-white/30 font-black uppercase tracking-wider">
            Players cannot login during maintenance
          </span>
        </div>
      </div>
    </div>
  );
}
