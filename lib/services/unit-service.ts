import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { calculateFinalStats } from './build-calculator';

export class UnitService {
  static async getPlayerRoster() {
    if (!supabase) return [];
    const { data, error } = await supabase.from('units').select('*').order('created_at', { ascending: true });
    if (error) return [];
    return data;
  }

  static async getUnitDetails(unitId: string) {
    if (!supabase) throw new Error("Database connection unavailable");

    try {
        const { data: unit, error: unitError } = await supabase.from('units').select('*').eq('id', unitId).single();
        if (unitError || !unit) throw new Error("Unit not found");

        const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', unit.current_job_id).single();
        if (jobError || !job) throw new Error("Job definition missing");

        let weapon = null;
        if (unit.equipped_weapon_instance_id) {
            const { data: invItem } = await supabase.from('inventory').select('*').eq('id', unit.equipped_weapon_instance_id).single();
            if (invItem) {
                const { data: weaponDef } = await supabase.from('weapons').select('*').eq('id', invItem.item_id).single();
                weapon = { ...invItem, ...weaponDef };
            }
        }

        let cards: any[] = [];
        if (unit.equipped_card_instance_ids && unit.equipped_card_instance_ids.length > 0) {
            const { data: invItems } = await supabase.from('inventory').select('*').in('id', unit.equipped_card_instance_ids);
            if (invItems) {
                const cardIds = invItems.map(i => i.item_id);
                const { data: cardDefs } = await supabase.from('cards').select('*').in('id', cardIds);
                cards = invItems.map(inv => ({ ...inv, ...(cardDefs?.find(d => d.id === inv.item_id) || {}) }));
            }
        }

        let skills: any[] = [];
        if (unit.equipped_skill_instance_ids && unit.equipped_skill_instance_ids.length > 0) {
            const { data: invItems } = await supabase.from('inventory').select('*').in('id', unit.equipped_skill_instance_ids);
            if (invItems) {
                const skillIds = invItems.map(i => i.item_id);
                const { data: skillDefs } = await supabase.from('skills').select('*').in('id', skillIds);
                skills = invItems.map(inv => ({ ...inv, ...(skillDefs?.find(d => d.id === inv.item_id) || {}) }));
            }
        }

        const finalStats = calculateFinalStats(unit, job, weapon, cards);

        return { unit, job, weapon, cards, skills, finalStats };
    } catch (e) {
        logger.error('error', 'getUnitDetails failed', e as Error);
        throw e;
    }
  }

  static async evolveUnit(unitId: string, targetJobId: string) {
    if (!supabase) throw new Error("Action unavailable in demo mode");
    const { error } = await supabase.rpc('rpc_evolve_unit', {
      p_unit_id: unitId,
      p_target_job_id: targetJobId
    });
    if (error) throw error;
    return { success: true };
  }

  static async getNextJobs(jobId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase.from('jobs').select('*').eq('parent_job_id', jobId);
    if (error) return [];
    return data || [];
  }

  static async releaseUnit(unitId: string) {
    if (!supabase) return;
    await supabase.from('units').delete().eq('id', unitId);
  }
}
