import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface DailyReward {
  day: number;
  currency: number;
  premium_currency: number;
  exp: number;
  message: string;
}

export class DailyRewardsService {
  /**
   * Get the current day streak and available rewards
   */
  static async getDailyRewardsStatus(): Promise<{
    currentStreak: number;
    canClaim: boolean;
    nextReward: DailyReward | null;
    rewards: DailyReward[];
  }> {
    if (!supabase) {
      return { currentStreak: 0, canClaim: false, nextReward: null, rewards: [] };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { currentStreak: 0, canClaim: false, nextReward: null, rewards: [] };

    // Get or create player daily rewards record
    const { data, error } = await supabase
      .from('player_daily_rewards')
      .select('*')
      .eq('player_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('error', 'Error fetching daily rewards:', error);
    }

    const rewards = this.getRewardsList();
    let currentStreak = data?.streak || 0;
    let lastClaimDate = data?.last_claim_date ? new Date(data.last_claim_date) : null;
    let canClaim = false;

    // Check if can claim today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastClaimDate) {
      canClaim = true;
    } else {
      const lastClaimDay = new Date(lastClaimDate);
      lastClaimDay.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastClaimDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        canClaim = true;
      } else if (diffDays === 0) {
        // Already claimed today
        canClaim = false;
      } else {
        // Streak broken
        currentStreak = 0;
        canClaim = true;
      }
    }

    const nextReward = rewards[currentStreak % rewards.length];

    return {
      currentStreak,
      canClaim,
      nextReward,
      rewards
    };
  }

  /**
   * Claim daily reward
   */
  static async claimDailyReward(): Promise<{ success: boolean; message: string; results?: any }> {
    if (!supabase) return { success: false, message: 'No supabase connection' };

    try {
      const status = await this.getDailyRewardsStatus();
      
      if (!status.canClaim) {
        return { success: false, message: 'Already claimed today' };
      }

      const reward = status.nextReward;
      if (!reward) return { success: false, message: 'No reward available' };

      // Use the new RPC to handle everything atomically
      const { data, error } = await supabase.rpc('rpc_claim_daily_reward', {
        p_reward_currency: reward.currency,
        p_reward_premium: reward.premium_currency,
        p_reward_exp: reward.exp
      });

      if (error) throw error;

      return { 
        success: true, 
        message: `¡Recompensa reclamada! +${reward.currency} oro, +${reward.premium_currency} gems`,
        results: data
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Get the list of rewards
   */
  static getRewardsList(): DailyReward[] {
    return [
      { day: 1, currency: 100, premium_currency: 10, exp: 50, message: 'Día 1' },
      { day: 2, currency: 150, premium_currency: 15, exp: 75, message: 'Día 2' },
      { day: 3, currency: 200, premium_currency: 20, exp: 100, message: 'Día 3' },
      { day: 4, currency: 250, premium_currency: 25, exp: 125, message: 'Día 4' },
      { day: 5, currency: 300, premium_currency: 30, exp: 150, message: 'Día 5' },
      { day: 6, currency: 400, premium_currency: 40, exp: 200, message: 'Día 6' },
      { day: 7, currency: 500, premium_currency: 50, exp: 300, message: '¡Día 7 - Bono especial!' }
    ];
  }
}
