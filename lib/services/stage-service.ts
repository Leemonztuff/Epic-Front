import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';

export interface StageReward {
  currency: number;
  exp: number;
  premium_currency?: number;
  materials?: Array<{ itemId: string; amount: number; chance: number }>;
}

export class StageService {
  /**
   * Get stage rewards data
   */
  static async getStageRewards(stageId: string): Promise<StageReward | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('rewards, first_clear_rewards')
        .eq('id', stageId)
        .single();
      if (error) throw error;
      return data?.rewards || null;
    } catch (e) {
      gameDebugger.error('campaign', 'Failed to load stage rewards', e);
      return null;
    }
  }
}
