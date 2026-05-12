import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';

export class PlayerService {
  /**
   * Update player username
   */
  static async updateUsername(userId: string, username: string): Promise<{ success: boolean; message?: string }> {
    if (!supabase) return { success: false, message: 'Supabase no inicializado' };

    const { error } = await supabase
      .from('players')
      .update({ username: username.trim() })
      .eq('id', userId);

    if (error) {
      gameDebugger.error('auth', 'Failed to update username', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }
}
