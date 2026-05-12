import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { AssetService } from './asset-service';

export interface JobSpriteEntry {
  job_id: string;
  sprite_file: string;
  icon_file?: string;
}

export class SpriteConfigService {
  /**
   * Get all job sprite configs from DB, fallback to hardcoded asset-service map
   */
  static async getConfigs(): Promise<JobSpriteEntry[]> {
    if (!supabase) return this.getDefaultConfigs();

    try {
      const { data, error } = await supabase
        .from('job_sprite_config')
        .select('*')
        .order('job_id');

      if (error || !data || data.length === 0) {
        return this.getDefaultConfigs();
      }

      return data.map((row: any) => ({
        job_id: row.job_id,
        sprite_file: row.sprite_file,
        icon_file: row.icon_file,
      }));
    } catch {
      return this.getDefaultConfigs();
    }
  }

  /**
   * Update a single job's sprite config
   */
  static async updateConfig(jobId: string, spriteFile: string, iconFile?: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('job_sprite_config')
      .upsert(
        { job_id: jobId, sprite_file: spriteFile, icon_file: iconFile },
        { onConflict: 'job_id' }
      );
    if (error) {
      gameDebugger.error('admin', 'Failed to update sprite config', error);
      return false;
    }
    return true;
  }

  /**
   * Reset all configs to hardcoded defaults (deletes DB rows)
   */
  static async resetToDefaults(): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('job_sprite_config').delete().neq('job_id', '');
    return !error;
  }

  /**
   * Get sprite URL for a job, checking DB config first, then fallback
   */
  static getSpriteUrl(jobId: string, configs?: JobSpriteEntry[]): string {
    if (configs) {
      const config = configs.find(c => c.job_id === jobId);
      if (config?.sprite_file) {
        return `${AssetService.getSpriteUrl(config.sprite_file)}`;
      }
    }
    return AssetService.getSpriteUrl(jobId);
  }

  private static getDefaultConfigs(): JobSpriteEntry[] {
    const jobs = ['novice', 'swordman', 'mage', 'ranger', 'archer', 'acolyte', 'knight', 'wizard', 'priest'];
    return jobs.map(jobId => ({
      job_id: jobId,
      sprite_file: AssetService.getJobSpriteId(jobId),
      icon_file: AssetService.getJobIconId(jobId),
    }));
  }
}
