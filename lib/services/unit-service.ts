// Unit Service - Gestión de unidades y equipamiento
// Version: 2.0 - Sistema de equipamiento expandido
// Version: 2.2 - Usa player-auth-utils compartido

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { gameDebugger } from '@/lib/debug';
import { calculateFinalStats, getEmptyEquipment, type FinalStatsResult } from './build-calculator';
import { EquipmentService } from './equipment-service';
import { InventoryService } from './inventory-service';
import { getCurrentPlayerId, getPlayerIdWithValidation } from './player-auth-utils';
import type { EquipmentSlot } from '@/lib/types/game-types';

interface EquipmentData {
  weapon: any | null;
  armor: any | null;
  accessory: any | null;
  boots: any | null;
  cards: any[];
  skills: any[];
}

export class UnitService {
  static async getPlayerRoster(playerId?: string) {
    if (!supabase) return [];
    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('player_id', resolvedPlayerId)
      .order('created_at', { ascending: true });
    if (error) {
      gameDebugger.error('unit', 'getPlayerRoster failed', error);
      return [];
    }
    return data || [];
  }

  /**
   * Obtiene los detalles de una unidad incluyendo equipamiento
   * Sistema v2 - Usa JSONB equipped_items
   * Version 2.1 - Validación de ownership
   */
  static async getUnitDetails(unitId: string, playerId?: string): Promise<{
    unit: any;
    job: any;
    equipment: EquipmentData;
    setBonus: any;
    finalStats: any;
  }> {
    if (!supabase) throw new Error("Database connection unavailable");

    try {
        const resolvedPlayerId = await getPlayerIdWithValidation(playerId);
        
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select('*')
          .eq('id', unitId)
          .eq('player_id', resolvedPlayerId)
          .single();
        if (unitError || !unit) throw new Error("Unit not found or access denied");

        const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', unit.current_job_id).single();
        if (jobError || !job) throw new Error("Job definition missing");

        // Get equipped items from new JSONB structure
        const equippedItems = unit.equipped_items || {};
        
        // Helper to load item with definition
        const loadEquippedItem = async (instanceId: string | null, itemType: string): Promise<any | null> => {
            if (!instanceId) return null;
            const invItem = await InventoryService.getInventoryItem(instanceId, 'inventory_id', unit.player_id);
            if (!invItem) return null;
            
            // Get definition based on type
            const tableMap: Record<string, string> = {
                weapon: 'weapons',
                armor: 'armors',
                accessory: 'accessories',
                boots: 'boots',
                card: 'cards',
                skill: 'skills',
            };
            const table = tableMap[itemType];
            if (table) {
                const { data: def } = await supabase.from(table).select('*').eq('id', invItem.item_id).single();
                if (def) return { ...invItem, ...def };
            }
            return { ...invItem, item_type: itemType };
        };

        // Load all equipment
        const [weapon, armor, accessory, boots] = await Promise.all([
            loadEquippedItem(equippedItems.weapon, 'weapon'),
            loadEquippedItem(equippedItems.armor, 'armor'),
            loadEquippedItem(equippedItems.accessory, 'accessory'),
            loadEquippedItem(equippedItems.boots, 'boots'),
        ]);

        // Load cards (up to 3)
        const cardIds = equippedItems.cards || [];
        let cards: any[] = [];
        if (cardIds.length > 0) {
            const { data: invItems } = await supabase.from('inventory').select('*').in('id', cardIds);
            if (invItems) {
                const cardIdsList = invItems.map(i => i.item_id);
                const { data: cardDefs } = await supabase.from('cards').select('*').in('id', cardIdsList);
                cards = invItems.map(inv => ({ 
                    ...inv, 
                    ...(cardDefs?.find(d => d.id === inv.item_id) || {}),
                    item_type: 'card'
                }));
            }
        }

        // Load skills (gacha skills, up to 2)
        const skillIds = equippedItems.skills || [];
        let skills: any[] = [];
        if (skillIds.length > 0) {
            const { data: invItems } = await supabase.from('inventory').select('*').in('id', skillIds);
            if (invItems) {
                const skillIdsList = invItems.map(i => i.item_id);
                const { data: skillDefs } = await supabase.from('skills').select('*').in('id', skillIdsList);
                skills = invItems.map(inv => ({ 
                    ...inv, 
                    ...(skillDefs?.find(d => d.id === inv.item_id) || {}),
                    item_type: 'skill'
                }));
            }
        }

        const equipmentData = { weapon, armor, accessory, boots, cards, skills };

        // Get active set bonus
        const setBonusResult = await EquipmentService.getActiveSetBonus(unitId);

        // Calculate final stats with new calculator
        const finalStatsResult = calculateFinalStats(unit, job, equipmentData, setBonusResult);

        return { 
            unit, 
            job, 
            equipment: equipmentData,
            setBonus: setBonusResult,
            finalStats: finalStatsResult.stats
        };
    } catch (e) {
        logger.error('error', 'getUnitDetails failed', e as Error);
        throw e;
    }
  }

  /**
   * Legacy support - mantiene compatibilidad con código existente
   * Convierte la nueva estructura a la antigua para backward compatibility
   */
  static async getUnitDetailsLegacy(unitId: string): Promise<{
    unit: any;
    job: any;
    weapon: any;
    cards: any[];
    skills: any[];
    finalStats: any;
  }> {
    const newData = await this.getUnitDetails(unitId);
    return {
        unit: newData.unit,
        job: newData.job,
        weapon: newData.equipment.weapon,
        cards: newData.equipment.cards,
        skills: newData.equipment.skills,
        finalStats: newData.finalStats
    };
  }

  static async evolveUnit(unitId: string, targetJobId: string, playerId?: string) {
    if (!supabase) throw new Error("Action unavailable in demo mode");
    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);
    
    const { data: unit } = await supabase.from('units').select('player_id').eq('id', unitId).single();
    if (!unit || unit.player_id !== resolvedPlayerId) {
      throw new Error("Unit not found or access denied");
    }
    
    const { error } = await supabase.rpc('rpc_evolve_unit', {
      p_unit_id: unitId,
      p_target_job_id: targetJobId
    });
    if (error) throw error;
    return { success: true };
  }

  static async getNextJobs(jobId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase.from('jobs').select('*').eq('parent_job_id', jobId);
    if (error) return [];
    return data || [];
  }

  static async releaseUnit(unitId: string, playerId?: string) {
    if (!supabase) return;
    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);
    const { data: unit } = await supabase.from('units').select('player_id').eq('id', unitId).single();
    if (!unit || unit.player_id !== resolvedPlayerId) {
      throw new Error("Unit not found or access denied");
    }
    await supabase.from('units').delete().eq('id', unitId);
  }
}