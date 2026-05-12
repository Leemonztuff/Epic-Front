'use client';

import React from 'react';
import { Settings, Shield, Zap, Users, Sparkles, Gauge, BarChart3 } from 'lucide-react';
import { config } from '@/lib/config/app-config';

interface ConfigItem {
  label: string;
  value: string;
  color?: string;
}

const CONFIG_SECTIONS: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; items: ConfigItem[] }[] = [
  {
    title: 'Game Balance',
    icon: Gauge,
    items: [
      { label: 'Max Party Size', value: config.game.maxPartySize.toString() },
      { label: 'Max Energy', value: config.game.maxEnergy.toString() },
      { label: 'Energy Regen', value: `${config.game.energyRegenInterval / 60}min` },
      { label: 'Max Tavern Slots', value: config.game.maxTavernSlots.toString() },
    ],
  },
  {
    title: 'Features',
    icon: Sparkles,
    items: [
      { label: 'Gacha System', value: config.features.gacha ? 'Enabled' : 'Disabled', color: config.features.gacha ? 'text-green-400' : 'text-red-400' },
      { label: 'Daily Rewards', value: config.features.dailyRewards ? 'Enabled' : 'Disabled', color: config.features.dailyRewards ? 'text-green-400' : 'text-red-400' },
      { label: 'Campaigns', value: config.features.campaigns ? 'Enabled' : 'Disabled', color: config.features.campaigns ? 'text-green-400' : 'text-red-400' },
      { label: 'Training', value: config.features.training ? 'Enabled' : 'Disabled', color: config.features.training ? 'text-green-400' : 'text-red-400' },
    ],
  },
  {
    title: 'UI Settings',
    icon: Settings,
    items: [
      { label: 'Theme', value: config.ui.theme },
      { label: 'Animations', value: config.ui.animations ? 'On' : 'Off' },
      { label: 'Asset Quality', value: config.ui.assetQuality },
    ],
  },
  {
    title: 'Performance',
    icon: BarChart3,
    items: [
      { label: 'Query Caching', value: config.performance.enableQueryCaching ? 'Enabled' : 'Disabled' },
      { label: 'Asset Preloading', value: config.performance.enableAssetPreloading ? 'On' : 'Off' },
      { label: 'Virtualization', value: config.performance.enableVirtualization ? 'On' : 'Off' },
      { label: 'Max Requests', value: `×${config.performance.maxConcurrentRequests}` },
    ],
  },
];

export default function AdminConfigsPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase font-display tracking-wider">Config</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Game Configuration</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Version', value: '0.1.0', icon: Shield, color: 'text-cyan-400' },
          { label: 'Features', value: '4 active', icon: Sparkles, color: 'text-purple-400' },
          { label: 'Monitored', value: config.monitoring.enableAnalytics ? 'Yes' : 'No', icon: BarChart3, color: config.monitoring.enableAnalytics ? 'text-green-400' : 'text-white/30' },
        ].map(stat => (
          <div key={stat.label} className="bg-black/40 border border-white/5 rounded-2xl p-4 panel-elevated">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={14} className={stat.color} />
            </div>
            <div className="text-lg font-black text-white font-display">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Config Sections */}
      <div className="grid sm:grid-cols-2 gap-6">
        {CONFIG_SECTIONS.map(section => (
          <div key={section.title} className="bg-black/40 border border-white/5 rounded-2xl p-6 panel-elevated">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <section.icon size={14} className="text-cyan-400" />
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">{item.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${item.color || 'text-white/40'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
