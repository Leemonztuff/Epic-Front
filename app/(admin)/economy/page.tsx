'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Diamond, Zap, Gift, TrendingUp, Save, Edit3 } from 'lucide-react';
import { LoginBonusConfigService, LevelCurveConfigService, type LoginBonusEntry } from '@/lib/services/config-services';

const RESOURCES = [
  { label: 'Gold', key: 'currency', icon: Coins, color: 'text-[#F5C76B]', value: 'Soft currency for pulls, shop' },
  { label: 'Gems', key: 'gems', icon: Diamond, color: 'text-cyan-400', value: 'Premium currency' },
  { label: 'Energy', key: 'energy', icon: Zap, color: 'text-purple-400', value: 'Regens 1/4min, max 20' },
];

export default function AdminEconomyPage() {
  const [schedule, setSchedule] = useState<LoginBonusEntry[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoginBonusEntry>>({});
  const [loading, setLoading] = useState(true);
  const levelCurve = LevelCurveConfigService.getCurve();

  useEffect(() => {
    LoginBonusConfigService.getSchedule().then(data => {
      setSchedule(data);
      setLoading(false);
    });
  }, []);

  const handleEdit = (entry: LoginBonusEntry) => {
    setEditingDay(entry.day);
    setEditForm({ ...entry });
  };

  const handleSave = async () => {
    if (editingDay === null) return;
    const success = await LoginBonusConfigService.updateEntry(editingDay, editForm);
    if (success) {
      const updated = await LoginBonusConfigService.getSchedule();
      setSchedule(updated);
    }
    setEditingDay(null);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Economy</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Currency & Progression Balance</p>
      </div>

      {/* Resources */}
      <div className="grid sm:grid-cols-3 gap-4">
        {RESOURCES.map(r => (
          <div key={r.key} className="bg-black/40 border border-white/5 rounded-2xl p-5 panel-elevated">
            <div className="flex items-center gap-3 mb-3">
              <r.icon size={18} className={r.color} />
              <h3 className="text-sm font-black text-white uppercase font-display">{r.label}</h3>
            </div>
            <p className="text-[10px] text-white/40">{r.value}</p>
          </div>
        ))}
      </div>

      {/* Login Bonus Editor */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Gift size={14} className="text-amber-400" />
          Login Bonus Schedule
        </h2>

        {loading ? (
          <div className="text-[10px] text-white/30 text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-2">
            {schedule.map(entry => (
              <div key={entry.day} className="bg-black/60 rounded-xl p-3 border border-white/5">
                {editingDay === entry.day ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] font-black text-white/40 w-12">Day {entry.day}</span>
                    <input
                      type="number" value={editForm.currency ?? entry.currency}
                      onChange={e => setEditForm(f => ({ ...f, currency: Number(e.target.value) }))}
                      className="w-20 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                    />
                    <input
                      type="number" value={editForm.premium_currency ?? entry.premium_currency}
                      onChange={e => setEditForm(f => ({ ...f, premium_currency: Number(e.target.value) }))}
                      className="w-20 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] text-cyan-400"
                    />
                    <input
                      type="number" value={editForm.exp ?? entry.exp}
                      onChange={e => setEditForm(f => ({ ...f, exp: Number(e.target.value) }))}
                      className="w-20 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] text-purple-400"
                    />
                    <button onClick={handleSave} className="p-2 bg-green-500/20 rounded-lg text-green-400">
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-white/40 w-12">Day {entry.day}</span>
                    <span className="text-[10px] font-black text-[#F5C76B] w-20">{entry.currency} gold</span>
                    <span className="text-[10px] font-black text-cyan-400 w-16">{entry.premium_currency}★</span>
                    <span className="text-[10px] font-black text-purple-400 w-16">{entry.exp} exp</span>
                    <button onClick={() => handleEdit(entry)} className="p-1.5 bg-white/5 rounded-lg text-white/30 hover:text-white/60">
                      <Edit3 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level Curve Preview */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-cyan-400" />
          Level Curve
        </h2>
        <div className="space-y-1">
          {levelCurve.filter(l => [1, 10, 25, 50].includes(l.level)).map(entry => (
            <div key={entry.level} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-[10px]">
              <span className="font-black text-white/60">Level {entry.level}</span>
              <span className="font-black text-white/40">EXP: {entry.exp_required.toLocaleString()}</span>
              <span className="font-black text-white/40">Energy: {entry.energy_cost}</span>
              <span className="font-black text-white/40">Power: {entry.enemy_power}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
