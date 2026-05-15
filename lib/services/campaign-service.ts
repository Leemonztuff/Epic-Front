import { supabase } from '@/lib/supabase';
import { Stage, PlayerStageProgress, StageReward, Chapter } from '../rpg-system/campaign-types';
import { gameDebugger } from '../debug';
import { logger } from '../logger';

export class CampaignService {
    private static chaptersCache: Chapter[] | null = null;

    static async getChapters(): Promise<Chapter[]> {
        if (this.chaptersCache) return this.chaptersCache;

        if (!supabase) {
            throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
        }
        
        gameDebugger.info('game-state', 'Loading chapters from database');

        try {
            const { data: chapters, error } = await supabase
                .from('chapters')
                .select('*, stages(*)')
                .order('index_num');

            if (error || !chapters || chapters.length === 0) {
                throw new Error('No chapters found in database. Please run supabase/01-schema.sql and supabase/04-seed.sql');
            }

            const processedChapters = chapters.map(ch => ({
                id: ch.id,
                name: ch.name,
                description: ch.description || '',
                index: ch.index_num,
                stages: (ch.stages || []).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description || '',
                    energy_cost: s.energy_cost,
                    chapter_id: s.chapter_id,
                    index: s.index_num,
                    rewards: s.rewards || { exp: 0, currency: 0, materials: [] },
                    enemies: s.enemies || [],
                    star_conditions: s.star_conditions || [],
                    first_clear_rewards: s.first_clear_rewards
                }))
            }));

            this.chaptersCache = processedChapters;
            gameDebugger.info('game-state', `Loaded ${processedChapters.length} chapters from DB`);
            return processedChapters;
        } catch (error) {
            gameDebugger.error('game-state', 'Error loading chapters from DB', error);
            throw error;
        }
    }

    static async getStageById(stageId: string): Promise<Stage | null> {
        // Direct query instead of loading all chapters (fixes N+1)
        try {
            const { data: stage, error } = await supabase
                .from('stages')
                .select('*, chapters!inner(id, index_num, name, description, unlock_requirements)')
                .eq('id', stageId)
                .single();

            if (error || !stage) {
                gameDebugger.warn('game-state', 'Stage not found', { stageId });
                return null;
            }

            return {
                id: stage.id,
                chapter_id: stage.chapters.id,
                index: stage.index_num,
                name: stage.name,
                description: stage.description || '',
                energy_cost: stage.energy_cost,
                enemies: stage.enemies || [],
                rewards: stage.rewards || { currency: 0, exp: 0, materials: [] },
                first_clear_rewards: stage.first_clear_rewards,
                star_conditions: stage.star_conditions || [],
                unlock_requirements: stage.unlock_requirements || null
            };
        } catch (e) {
            gameDebugger.error('game-state', 'Error loading stage', e);
            return null;
        }
    }

    static async getPlayerProgress(): Promise<PlayerStageProgress[]> {
        if (!supabase) return [];
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('campaign_progress')
            .select('*')
            .eq('player_id', user.id);

        if (error) {
            logger.error('error', 'Error fetching campaign progress', error);
            return [];
        }

        return (data || []).map(d => ({
            stage_id: d.stage_id,
            stars: d.stars,
            cleared: true,
            best_turns: d.best_turns
        }));
    }

    static async completeStage(stageId: string, stats: { turns: number, deaths: number }, participatingUnitIds?: string[]) {
        if (!supabase) return;
        
        // Validation: ensure stageId is a valid stage identifier (not enemy ID)
        if (stageId && (stageId.includes('slime') || stageId.includes('bat') || stageId.includes('goblin') || stageId.includes('skeleton') || stageId.includes('wolf'))) {
            gameDebugger.warn('campaign', 'Invalid stage ID detected (appears to be enemy ID)', { stageId });
            throw new Error("Invalid stage ID - please restart the battle");
        }
        
        const stage = await this.getStageById(stageId);
        if (!stage) throw new Error("Stage not found");

        let stars = 0;
        stage.star_conditions?.forEach(condition => {
            let met = false;
            switch (condition.type) {
                case 'win': met = true; break;
                case 'no_deaths':
                case 'all_survived': met = stats.deaths === 0; break;
                case 'turn_limit': met = stats.turns <= (condition.value || 999); break;
            }
            if (met) stars++;
        });

        const progress = await this.getPlayerProgress();
        // Server now calculates rewards - we just pass completion stats
        
        const rpcParams: any = {
            p_stage_id: stageId,
            p_stars: stars,
            p_turns: stats.turns
        };

        // Add participating units if provided
        if (participatingUnitIds && participatingUnitIds.length > 0) {
            rpcParams.p_participating_units = participatingUnitIds;
        }

        if (!supabase) {
            throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
        }

        const { data, error } = await supabase.rpc('rpc_complete_stage', rpcParams);

        if (error) throw error;

        const serverRewards = data || {};

        return {
            stars,
            isFirstClear: serverRewards.isFirstClear || false,
            rewards: {
                currency: serverRewards.currency || 0,
                exp: serverRewards.exp || 0,
                materials: serverRewards.materials || []
            },
            clearCount: serverRewards.clearCount || 1,
            diminishingReturns: serverRewards.diminishingReturns || false
        };
    }

    static async deductEnergy(amount: number) {
        if (!supabase) {
            throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase.rpc('rpc_deduct_energy', {
            p_cost: amount
        });

        if (error) {
            logger.error('api_call', 'Energy deduction failed', error);
            return false;
        }

        return Boolean(data);
    }

     static invalidateCache() {
         this.chaptersCache = null;
     }

static async refillEnergyWithGems(gemCost: number = 50): Promise<boolean> {
       if (!supabase) {
           throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
       }
       
       const { data, error } = await supabase.rpc('rpc_refill_energy_with_gems', {
           p_gem_cost: gemCost
       });

        if (error) {
            logger.error('api_call', 'Energy refill failed', error);
            return false;
        }

       return Boolean(data);
     }

static async getUnitProgress(unitId: string): Promise<{ level: number, exp: number, nextLevelExp: number, expPercentage: number } | null> {
        if (!supabase) return null;

        // Use units table directly instead of unit_progress VIEW
        // to avoid dependency issues
        const { data, error } = await supabase
            .from('units')
            .select('level, exp')
            .eq('id', unitId)
            .single();

        if (error || !data) {
            gameDebugger.warn('game-state', 'Failed to get unit progress', { unitId, error });
            return null;
        }

        // Calculate next level exp (simple formula)
        const nextLevelExp = data.level * 100; // 100 exp per level
        const expPercentage = Math.min(100, (data.exp / nextLevelExp) * 100);

        return {
            level: data.level,
            exp: data.exp,
            nextLevelExp,
            expPercentage
        };
    }
}