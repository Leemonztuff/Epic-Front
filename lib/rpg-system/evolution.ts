import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { JobDefinition, UnitData } from './types';

/**
 * Service to handle Job Evolution business logic.
 * Evolution requirements (level, currency, materials, job cores)
 * are validated in Postgres RPC but we provide helper methods for the UI.
 */
export class EvolutionService {
    
    /**
     * Gets all potential next jobs for a unit based on its current job.
     */
    static async getAvailableEvolutions(unit: UnitData): Promise<JobDefinition[]> {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('parent_job_id', unit.current_job_id);

        if (error) {
            logger.error('error', 'Error fetching evolution paths:', error);
            return [];
        }

        return (jobs || []).map(j => ({
            id: j.id,
            version: j.version,
            name: j.name,
            tier: j.tier,
            parent_job_id: j.parent_job_id,
            stat_modifiers: j.stat_modifiers,
            allowed_weapons: j.allowed_weapons,
            skills_unlocked: j.skills_unlocked,
            passive_effects: j.passive_effects,
            evolution_requirements: j.evolution_requirements
        }));
    }

    /**
     * Checks if a unit meets the requirements for a specific evolution.
     * Returns a detailed status object for UI feedback.
     */
    static checkEvolutionRequirements(
        unit: UnitData,
        targetJob: JobDefinition,
        playerCurrency: number,
        playerInventory: any[]
    ) {
        const reqs = targetJob.evolution_requirements;
        const levelMet = unit.level >= reqs.minLevel;
        const currencyMet = playerCurrency >= reqs.currencyCost;

        const materialStatus = (reqs.materials || []).map(m => {
            const owned = playerInventory.find(inv => inv.item_id === m.itemId)?.quantity || 0;
            return {
                itemId: m.itemId,
                required: m.amount,
                owned: owned,
                met: owned >= m.amount
            };
        });

        // Check for specific Job Core
        const coreId = reqs.requiredJobCore;
        let coreMet = true;
        let coreStatus = null;

        if (coreId) {
            const ownedCore = playerInventory.find(inv => inv.item_id === coreId)?.quantity || 0;
            coreMet = ownedCore >= 1;
            coreStatus = {
                itemId: coreId,
                required: 1,
                owned: ownedCore,
                met: coreMet
            };
        }

        const allMaterialsMet = materialStatus.every(m => m.met) && coreMet;

        return {
            isMet: levelMet && currencyMet && allMaterialsMet,
            level: { required: reqs.minLevel, current: unit.level, met: levelMet },
            currency: { required: reqs.currencyCost, current: playerCurrency, met: currencyMet },
            materials: materialStatus,
            jobCore: coreStatus
        };
    }
}
