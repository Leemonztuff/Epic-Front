import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { GachaState } from '../rpg-system/gacha-types';
import { gameDebugger } from '../debug';

export interface PullResult {
    item_id: string;
    item_name: string;
    rarity: string;
    item_type: string;
}

export class GachaService {
    /**
     * Performs a secure gacha pull using the database RPC.
     * Includes multi-pull logic and currency selection.
     * Pity is handled server-side: 10 pulls for SR, 50 pulls for UR.
     */
    static async pull(amount: number = 1, currencyType: 'soft' | 'premium' = 'soft'): Promise<PullResult[]> {
        if (!supabase) throw new Error("Supabase client not initialized");

        gameDebugger.info('gacha', `Starting pull: ${amount}x ${currencyType}`);

        const { data, error } = await supabase.rpc('rpc_pull_gacha', {
            p_amount: amount,
            p_currency_type: currencyType
        });

        if (error) {
            gameDebugger.error('gacha', 'RPC error', error);
            logger.error('error', "Gacha RPC Error:", error);
            throw error;
        }

        gameDebugger.info('gacha', `Pull completed, got ${(data || []).length} items`, data);

        return (data || []).map((item: any) => ({
            item_id: item.res_item_id,
            item_name: item.res_item_name,
            rarity: item.res_item_rarity,
            item_type: item.res_item_type,
        }));
    }

    /**
     * Helper for standard Multi pull (10 items)
     * Provides a 1-pull discount (10 for the price of 9).
     */
    static async pullMulti(currencyType: 'soft' | 'premium' = 'soft') {
        return this.pull(10, currencyType);
    }

    /**
     * Fetch current gacha pity state for the user
     */
    static async getGachaState(): Promise<GachaState | null> {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('gacha_state')
            .select('*')
            .eq('player_id', user.id)
            .single();

        if (error) return null;
        return data;
    }
}
