"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import SpriteDisplay from '@/components/ui/SpriteDisplay';
import StatTile from '@/components/ui/StatTile';
import Slot from '@/components/ui/Slot';
import Frame from '@/components/ui/Frame';
import EvolutionBar from '@/components/ui/EvolutionBar';
import styles from './CharacterDetailStyled.module.css';
import { useSupabase } from '@/hooks/useSupabase';
import spriteForJob from '@/lib/spriteMap';

type Unit = {
  id: string;
  name: string;
  current_job_id?: string;
  job?: string;
  rarity?: string;
  base_stats?: any;
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  equip_slots?: Array<string | null>;
  specials?: Array<string | null>;
  evolutions?: string[];
  sprite_id?: string | null;
};

export default function CharacterDetailStyled({ characterId }: { characterId: string }) {
  const supabase = useSupabase();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [jobMeta, setJobMeta] = useState<any | null>(null);

  useEffect(() => {
    if (!characterId) return;
    (async () => {
      const { data: u } = await supabase.from('units').select('*').eq('id', characterId).single();
      if (!u) return;
      setUnit(u as Unit);
      const jobId = u.current_job_id ?? u.job;
      if (jobId) {
        const { data: j } = await supabase.from('jobs').select('id, display_name, sprite_path, alternative_jobs').eq('id', jobId).single();
        setJobMeta(j ?? null);
      }
    })();
  }, [characterId, supabase]);

  if (!unit) return <div className="p-6">Cargando...</div>;

  const spriteSrc = unit.sprite_id ? `/assets/sprites/${unit.sprite_id}.png` : jobMeta?.sprite_path ?? spriteForJob(unit.current_job_id ?? unit.job);

  return (
    <div className={`max-w-md mx-auto p-4 ${styles.container}`}>
      <div className={`frame-earthstone p-4 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl relative overflow-visible ${styles.frame}`}>
        {/* Top bar with back and delete */}
        <div className="flex items-center justify-between mb-2">
          <button className="btn-back">◀</button>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-300 mr-2 font-bold uppercase">{unit.name}</div>
            <button className="btn-danger">🗑</button>
          </div>
        </div>

        {/* Portrait */}
        <Frame className="mx-auto max-w-[320px]">
          <div className={`portrait-frame relative mx-auto w-full h-44 sm:h-52 md:h-56 rounded-lg ${styles.portraitFrame}`}>
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
              <div className={`${styles.spriteBreakOut} w-[60%] -mt-12 md:-mt-16`}> 
                <Image src={spriteSrc} alt={unit.name} width={260} height={260} style={{ objectFit: 'contain' }} priority className={styles.spriteImg} />
              </div>
            </div>
            <div className="absolute bottom-2 right-4">
              <div className={`${styles.badgeRankCircle} px-3 py-1 text-xs`}>{unit.rarity ?? 'UR'}</div>
            </div>
          </div>
        </Frame>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <StatTile label="HP" value={unit.hp ?? 0} />
          <StatTile label="ATK" value={unit.atk ?? 0} />
          <StatTile label="DEF" value={unit.def ?? 0} />
          <StatTile label="SPD" value={unit.spd ?? 0} />
        </div>

        {/* Arsenal */}
        <div className="mt-4">
          <div className="text-xs text-slate-300 font-black uppercase tracking-widest mb-2">Arsenal de Combate</div>
          <div className="flex items-center gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Slot key={i} icon={unit.equip_slots?.[i] ?? null} empty={!unit.equip_slots?.[i]} />
            ))}
          </div>
        </div>

        {/* Técnicas especiales */}
        <div className="mt-4">
          <div className="text-xs text-slate-300 font-black uppercase tracking-widest mb-2">Técnicas Especiales</div>
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-md border border-slate-600 bg-slate-800 flex items-center justify-center">{unit.specials?.[i] ? <Image src={`/assets/icons/${unit.specials[i]}.png`} alt="skill" width={28} height={28} /> : <div className="text-slate-500">+</div>}</div>
            ))}
          </div>
        </div>

        {/* Evolution bar */}
        <div className="mt-6">
          <div className="text-xs text-slate-300 font-black uppercase tracking-widest mb-2">Senda de Evolución</div>
          <EvolutionBar jobs={(jobMeta?.alternative_jobs || unit.evolutions || []).slice(0,2)} />
        </div>

      </div>
    </div>
  );
}
