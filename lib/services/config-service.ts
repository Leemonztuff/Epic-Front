import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export class ConfigService {
    private static activeVersion: string | null = null;
    private static cache: Record<string, any> = {};

    /**
     * Fetches the latest active game configuration.
     * This is used for "Balance Patches" without full deploys.
     */
    static async syncConfig() {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('game_configs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            logger.error('error', 'Error syncing config', error);
            return;
        }

        const latestConfig = data?.[0];
        if (!latestConfig) return;

        this.activeVersion = latestConfig.version;
        this.cache = latestConfig.config_data || {};
        logger.info('game_event', `Game Config Synced: v${this.activeVersion}`);
    }

    static getActiveVersion() {
        return this.activeVersion;
    }

    static getSetting(key: string) {
        return this.cache[key];
    }
}
