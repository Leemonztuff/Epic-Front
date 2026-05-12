'use client';

import React, { useState, useEffect } from 'react';
import { Image, Sword, Shield, Sparkles, Package, Users, Map, Save, RotateCcw, Check } from 'lucide-react';
import { AssetService } from '@/lib/services/asset-service';
import { UI_ASSETS, BG_ASSETS } from '@/lib/config/assets-config';
import { SpriteConfigService, type JobSpriteEntry } from '@/lib/services/sprite-config-service';

const SECTIONS = [
  { id: 'sprites', label: 'Job Sprites', icon: Users },
  { id: 'ui', label: 'UI Icons', icon: Shield },
  { id: 'backgrounds', label: 'Backgrounds', icon: Map },
];

const JOBS = ['novice', 'swordman', 'mage', 'ranger', 'archer', 'acolyte', 'knight', 'wizard', 'priest'];

export default function AdminAssetsPage() {
  const [section, setSection] = useState('sprites');
  const [configs, setConfigs] = useState<JobSpriteEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    SpriteConfigService.getConfigs().then(setConfigs);
  }, []);

  const handleSave = async (jobId: string) => {
    if (!editValue.trim()) return;
    setSaving(true);
    const ok = await SpriteConfigService.updateConfig(jobId, editValue.trim());
    if (ok) {
      const updated = await SpriteConfigService.getConfigs();
      setConfigs(updated);
      setSaved(jobId);
      setTimeout(() => setSaved(null), 2000);
    }
    setEditing(null);
    setSaving(false);
  };

  const handleReset = async () => {
    await SpriteConfigService.resetToDefaults();
    const updated = await SpriteConfigService.getConfigs();
    setConfigs(updated);
  };

  const renderSpriteEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest">
          {configs.length} jobs configured
        </h2>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
        >
          <RotateCcw size={12} />
          Reset Defaults
        </button>
      </div>

      {configs.map(entry => (
        <div key={entry.job_id} className="bg-black/40 border border-white/5 rounded-2xl p-4 panel-elevated">
          <div className="flex items-center gap-4">
            {/* Sprite preview */}
            <div className="w-20 h-20 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden">
              <img
                src={AssetService.getSpriteUrl(entry.sprite_file)}
                className="w-full h-full object-contain pixel-art"
                alt={entry.job_id}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-white uppercase font-display">{entry.job_id}</h3>
              {editing === entry.job_id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white font-mono"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(entry.job_id); if (e.key === 'Escape') setEditing(null); }}
                  />
                  <button
                    onClick={() => handleSave(entry.job_id)}
                    className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
                  >
                    {saving ? <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-white/40 font-mono">{entry.sprite_file}</span>
                  {saved === entry.job_id && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-green-400">
                      <Check size={10} /> Saved
                    </span>
                  )}
                  <button
                    onClick={() => { setEditing(entry.job_id); setEditValue(entry.sprite_file); }}
                    className="p-1 bg-white/5 rounded text-white/30 hover:text-white/60"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Icon preview */}
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center">
              <img src={AssetService.getIconUrl(entry.icon_file || entry.job_id)} className="w-8 h-8 object-contain" alt="" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUI = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
      {UI_ASSETS && Object.entries(UI_ASSETS).map(([key, val]: [string, any]) => (
        <div key={key} className="bg-black/60 border border-white/5 rounded-xl p-3 flex flex-col items-center">
          <img src={AssetService.getUIUrl(key)} className="w-12 h-12 object-contain" alt="" />
          <span className="text-[6px] font-black text-white/40 uppercase mt-1 truncate w-full text-center">{key}</span>
        </div>
      ))}
    </div>
  );

  const renderBGs = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {BG_ASSETS && Object.entries(BG_ASSETS).map(([key, val]: [string, any]) => (
        <div key={key} className="bg-black/60 border border-white/5 rounded-xl overflow-hidden">
          <div className="aspect-video bg-black/80">
            <img src={AssetService.getBgUrl(key.toLowerCase())} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          <div className="p-2">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">{key}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Assets</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Job Sprite Configuration</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              section === s.id
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'bg-black/40 border border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
        {section === 'sprites' && renderSpriteEditor()}
        {section === 'ui' && renderUI()}
        {section === 'backgrounds' && renderBGs()}
      </div>
    </div>
  );
}
