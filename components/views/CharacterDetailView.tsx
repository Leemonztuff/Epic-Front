"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import SpriteDisplay from '@/components/ui/SpriteDisplay';
import { useSupabase } from '@/hooks/useSupabase';
import spriteForJob from '@/lib/spriteMap';

type Character = {
  id: string;
  name: string;
  job: string;
  rarity: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  equip_slots?: Array<string | null>;
  specials?: Array<string | null>;
  evolutions?: string[];
};

export default function CharacterDetailView({ characterId }: { characterId: string }) {
  const { supabase } = useSupabase();
  const [char, setChar] = useState<Character | null>(null);

  useEffect(() => {
    if (!characterId) return;
    (async () => {
      const { data } = await supabase.from('characters').select('*').eq('id', characterId).single();
      setChar(data as Character);
    })();
  }, [characterId, supabase]);

  if (!char) return <div className="p-6">Cargando...</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-4 shadow-lg panel-elevated">
        <div className="flex items-start gap-4">
          <div className="w-2/5">
            <SpriteDisplay job={char.job} size={220} overlapPx={34} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">{char.name}</h2>
                <div className="text-xs text-slate-300 uppercase">{char.job}</div>
              </div>
              <div className="bg-amber-600 text-black px-3 py-1 rounded-full text-sm">{char.rarity}</div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="stat-card text-center p-2 rounded-md bg-slate-700/60">
                <div className="text-xs text-slate-300">HP</div>
                <div className="text-lg font-semibold text-white">{char.hp}</div>
              </div>
              <div className="stat-card text-center p-2 rounded-md bg-slate-700/60">
                <div className="text-xs text-slate-300">ATK</div>
                <div className="text-lg font-semibold text-white">{char.atk}</div>
              </div>
              <div className="stat-card text-center p-2 rounded-md bg-slate-700/60">
                <div className="text-xs text-slate-300">DEF</div>
                <div className="text-lg font-semibold text-white">{char.def}</div>
              </div>
              <div className="stat-card text-center p-2 rounded-md bg-slate-700/60">
                <div className="text-xs text-slate-300">SPD</div>
                <div className="text-lg font-semibold text-white">{char.spd}</div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm text-slate-300">Arsenal de Combate</h3>
              <div className="flex gap-3 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center">
                    {char.equip_slots?.[i] ? (
                      <Image src={`/assets/icons/${char.equip_slots[i]}.png`} alt="equip" width={36} height={36} />
                    ) : (
                      <div className="text-slate-500">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm text-slate-300">Técnicas Especiales</h3>
              <div className="flex gap-3 mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-md border border-slate-600 bg-slate-800 flex items-center justify-center">
                    {char.specials?.[i] ? (
                      <Image src={`/assets/icons/${char.specials[i]}.png`} alt="skill" width={36} height={36} />
                    ) : (
                      <div className="text-slate-500">+</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm text-slate-300">Senda de Evolución</h3>
              <div className="flex gap-3 mt-3">
                {char.evolutions?.map((job) => (
                  <button key={job} className="flex-1 bg-slate-700/50 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-14 h-14 relative">
                      <Image src={spriteForJob(job)} alt={job} width={56} height={56} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm text-white font-semibold">{job}</div>
                      <div className="text-xs text-slate-300">Tier 1</div>
                    </div>
                    <div className="text-slate-300">›</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
