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
    const defaults = this.getDefaultConfigs();
    if (!supabase) return defaults;

    try {
      const { data, error } = await supabase
        .from('job_sprite_config')
        .select('*')
        .order('job_id');

      if (error || !data) return defaults;

      // Merge DB configs with defaults, DB overrides win
      const dbMap = new Map(data.map((r: any) => [r.job_id, r]));
      return defaults.map(def => {
        const db = dbMap.get(def.job_id);
        return db ? {
          job_id: db.job_id,
          sprite_file: db.sprite_file,
          icon_file: db.icon_file || def.icon_file,
        } : def;
      });
    } catch {
      return defaults;
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

  private static configCache: JobSpriteEntry[] | null = null;
  private static cachePromise: Promise<void> | null = null;

  /**
   * Load configs into cache (called once, then cached)
   */
  static async loadCache(): Promise<void> {
    if (this.configCache) return;
    if (this.cachePromise) return this.cachePromise;
    this.cachePromise = this.getConfigs().then(c => { this.configCache = c; });
    return this.cachePromise;
  }

  /**
   * Get sprite URL for a job, checking cached config first
   */
  static getJobSpriteUrl(jobId: string): string {
    if (this.configCache) {
      const config = this.configCache.find(c => c.job_id === jobId);
      if (config?.sprite_file?.startsWith('http')) return config.sprite_file;
    }
    return AssetService.getSpriteUrl(jobId);
  }

  /**
   * Get icon URL for a job, checking cached config first
   */
  static getJobIconUrl(jobId: string): string {
    if (this.configCache) {
      const config = this.configCache.find(c => c.job_id === jobId);
      if (config?.icon_file) return AssetService.getIconUrl(config.icon_file);
    }
    return AssetService.getIconUrl(jobId);
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
