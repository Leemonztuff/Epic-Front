'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Clock, Sword, Heart, Shield, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { ViewShell } from '@/components/ui/ViewShell';
import { getRarityCode } from '@/lib/config/assets-config';
import { Button } from '@/components/ui/Button';

interface SkillDetailViewProps {
  skillId: string;
  itemId: string;
  onBack: () => void;
  onEquip: (item: any) => void;
  onDiscard: (itemId: string) => void;
}

const EFFECT_ICONS: Record<string, React.ReactNode> = {
  damage: <Sword size={24} className="text-red-400" />,
  heal: <Heart size={24} className="text-green-400" />,
  buff: <Shield size={24} className="text-blue-400" />,
  debuff: <Sparkles size={24} className="text-purple-400" />,
};

export function SkillDetailView({ skillId, itemId, onBack, onEquip, onDiscard }: SkillDetailViewProps) {
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSkill() {
      if (!supabase) return;
      const { data } = await supabase.from('skills').select('*').eq('id', skillId).single();
      setSkill(data);
      setLoading(false);
    }
    loadSkill();
  }, [skillId]);

  if (loading) return <ViewShell title="Habilidad" onBack={onBack} loading />;
  if (!skill) return <ViewShell title="Habilidad" onBack={onBack} emptyMessage="Habilidad no encontrada" />;

  return (
    <ViewShell title="DETALLES" subtitle="HABILIDAD" onBack={onBack} background="party">
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">

        <NineSlicePanel type="border" variant="fancy" className="p-8 glass-frosted frame-earthstone flex flex-col items-center text-center shrink-0">
           <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Sparkles size={40} className="text-cyan-400" />
           </div>
           <h3 className="text-2xl font-black text-white uppercase font-display mb-1">{skill.name}</h3>
           <RarityBadge rarity={skill.rarity} className="mb-4" />
           <p className="text-xs text-white/50 italic leading-relaxed">{skill.description}</p>
        </NineSlicePanel>

        <div className="grid grid-cols-2 gap-3">
           <StatBox label="ENERGÍA" value={skill.energy_cost || 0} icon={Zap} color="text-blue-400" />
           <StatBox label="ENFRIAMIENTO" value={`${skill.cooldown || 0}T`} icon={Clock} color="text-[#F5C76B]" />
        </div>

        <div className="mt-auto space-y-3">
           <Button variant="primary" className="w-full h-14" onClick={() => onEquip({ ...skill, item_type: 'skill', item_id: skill.id })}>EQUIPAR HABILIDAD</Button>
           <Button variant="secondary" className="w-full" onClick={() => onDiscard(itemId)}>DESCARTAR</Button>
        </div>
      </div>
    </ViewShell>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
       <Icon size={18} className={color} />
       <div>
          <p className="text-[8px] font-black text-white/20 uppercase">{label}</p>
          <p className="text-sm font-black text-white font-stats tabular-nums">{value}</p>
       </div>
    </div>
  );
}
