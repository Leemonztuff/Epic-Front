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
  current_job_id?: string;
  rarity: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  equip_slots?: Array<string | null>;
  specials?: Array<string | null>;
  evolutions?: string[];
  sprite_id?: string | null;
};

export default function CharacterDetailView({ characterId }: { characterId: string }) {
  const supabase = useSupabase();
  const [char, setChar] = useState<Character | null>(null);
  const [jobMeta, setJobMeta] = useState<any | null>(null);
  const [loadingEvolve, setLoadingEvolve] = useState(false);

  useEffect(() => {
    if (!characterId) return;
    (async () => {
      // Primero obtener la unidad (units table)
      const { data: unit } = await supabase.from('units').select('*').eq('id', characterId).single();
      if (!unit) return;
      setChar(unit as Character);

      // Obtener metadata del job actual para sprite_path y evoluciones
      const jobId = unit.current_job_id;
      if (jobId) {
        const { data: jobRow } = await supabase
          .from('jobs')
          .select('id, display_name, sprite_path, evolution_requirements, alternative_jobs')
          .eq('id', jobId)
          .single();
        setJobMeta(jobRow ?? null);
      }
    })();
  }, [characterId, supabase]);

  if (!char) return <div className="p-6">Cargando...</div>;

  // Resolve sprite source: prefer unit.sprite_id, then job.sprite_path, then convention
  const spriteSrc = char.sprite_id
    ? `/assets/sprites/${char.sprite_id}.png`
    : jobMeta?.sprite_path
    ? jobMeta.sprite_path
    : spriteForJob(char.current_job_id || (char.job as string));

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-4 shadow-lg panel-elevated">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-full md:w-2/5">
            <SpriteDisplay job={char.current_job_id || (char.job as string)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">{char.name}</h2>
                <div className="text-xs text-slate-300 uppercase">{char.job}</div>
              </div>
              <div className="bg-amber-600 text-black px-3 py-1 rounded-full text-sm">{char.rarity}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <div className="flex flex-wrap gap-3 mt-2">
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
              <div className="flex flex-wrap gap-3 mt-2">
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
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                {(
                  // fallback: use jobMeta.alternative_jobs or char.evolutions
                  (jobMeta?.alternative_jobs && jobMeta.alternative_jobs.length > 0 && jobMeta.alternative_jobs) ||
                  char.evolutions || []
                ).map((job: string) => {
                  const evoSprite = jobMeta?.sprite_path ? spriteForJob(job, 'portrait') : spriteForJob(job);
                  return (
                    <div key={job} className="flex-1">
                      <button
                        onClick={async () => {
                          if (!char?.id) return;
                          setLoadingEvolve(true);
                          try {
                            // Llamar RPC que valida y realiza la evolución
                            await supabase.rpc('rpc_evolve_unit', { p_unit_id: char.id, p_target_job_id: job });
                            // Refrescar unidad
                            const { data: refreshed } = await supabase.from('units').select('*').eq('id', char.id).single();
                            setChar(refreshed as Character);
                            // Refresh job meta
                            const { data: newJob } = await supabase.from('jobs').select('id, display_name, sprite_path, evolution_requirements, alternative_jobs').eq('id', refreshed.current_job_id).single();
                            setJobMeta(newJob ?? null);
                          } catch (e) {
                            console.error('Evolución fallida', e);
                            alert('Evolución fallida: ' + ((e as any)?.message || 'error'));
                          } finally {
                            setLoadingEvolve(false);
                          }
                        }}
                        className="w-full bg-slate-700/50 rounded-lg p-2 flex items-center gap-2"
                        disabled={loadingEvolve}
                      >
                        <div className="w-14 h-14 relative">
                          <Image src={spriteForJob(job)} alt={job} width={56} height={56} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm text-white font-semibold">{job}</div>
                          <div className="text-xs text-slate-300">Ver requisitos</div>
                        </div>
                        <div className="text-slate-300">{loadingEvolve ? '...' : '›'}</div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
