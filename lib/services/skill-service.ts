import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { logger } from '@/lib/logger';

export class SkillService {
  /**
   * Get all available skills, optionally filtered by job
   */
  static async getAvailableSkills(jobId?: string): Promise<any[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('skills').select('*').order('rarity', { ascending: true });
      if (jobId) {
        query = query.eq('job_id', jobId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      gameDebugger.error('unit', 'Failed to load available skills', e);
      logger.error('error', 'SkillService.getAvailableSkills failed', e as Error);
      return [];
    }
  }

  /**
   * Learn a skill for a unit via RPC
   */
  static async learnSkill(unitId: string, skill: any): Promise<{ success: boolean; message?: string }> {
    if (!supabase) return { success: false, message: 'Supabase no inicializado' };

    try {
      const { error } = await supabase.rpc('rpc_learn_skill', {
        p_unit_id: unitId,
        p_skill_id: skill.id,
        p_skill_data: {
          id: skill.id,
          name: skill.name,
          type: 'active',
          cooldown: skill.cooldown || 2,
          description: skill.description || '',
        },
      });

      if (error) throw error;

      gameDebugger.info('unit', 'Skill learned', { unitId, skillId: skill.id });
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al aprender habilidad';
      gameDebugger.error('unit', 'Failed to learn skill', e);
      return { success: false, message };
    }
  }
}
