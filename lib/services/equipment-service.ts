// Equipment Service - Sistema de equipamiento profesional
// Version: 2.0 - Similar a Ragnarok Online / Brave Frontier
// Version: 2.2 - Usa player-auth-utils compartido

import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { getCurrentPlayerId, getPlayerIdWithValidation } from './player-auth-utils';
import { InventoryService, invalidateCache } from './inventory-service';
import { DefinitionsCache } from './definitions-cache';
import type { EquipmentSlot } from '@/lib/types/game-types';
import type { JobDefinition } from '../rpg-system/types';

// Límites de equipamiento (como RPGs profesionales)
const MAX_CARDS = 3;
const MAX_GACHA_SKILLS = 2;
const MAX_JOB_SKILLS = 3;

export interface EquipValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export class EquipmentService {
  /**
   * Valida si un item puede ser equipado en una ranura específica
   * Incluye: level requirement, job restrictions, slot compatibility
   * Version 2.1 - Validación de ownership
   */
  static async validateEquip(
    unitId: string, 
    itemInstanceId: string, 
    targetSlot: EquipmentSlot,
    playerId?: string
  ): Promise<EquipValidationResult> {
    if (!supabase) {
      return { valid: false, error: 'Supabase no inicializado' };
    }

    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);

    // 1. Get unit data with player ownership check
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('id', unitId)
      .eq('player_id', resolvedPlayerId)
      .single();

    if (unitError || !unit) {
      return { valid: false, error: 'Unidad no encontrada o acceso denegado' };
    }

    // Get job info separately
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', unit.current_job_id)
      .single();

// Validate item belongs to same player using unified helper
    const isCardOrSkill = targetSlot === 'card' || targetSlot === 'skill';
    const searchType = isCardOrSkill ? 'item_id' : 'inventory_id';
    
    const inventoryItem = await InventoryService.getInventoryItem(
      itemInstanceId,
      searchType,
      resolvedPlayerId
    );

    if (!inventoryItem) {
      return { valid: false, error: 'Item no encontrado en inventario o acceso denegado' };
    }

    // Validate quantity
    if (!inventoryItem.quantity || inventoryItem.quantity <= 0) {
      return { valid: false, error: 'No tienes suficiente cantidad de este item' };
    }

    if (!inventoryItem) {
      return { valid: false, error: 'Item no encontrado en inventario o acceso denegado' };
    }

    // 3. Get item definition based on type
    const itemDef = await this.getItemDefinition(inventoryItem.item_id, inventoryItem.item_type);
    if (!itemDef) {
      return { valid: false, error: 'Definición del item no encontrada' };
    }

    // 4. Validate level requirement
    if (itemDef.level_required && itemDef.level_required > unit.level) {
      return { 
        valid: false, 
        error: `Nivel mínimo requerido: ${itemDef.level_required}. Tu nivel: ${unit.level}` 
      };
    }

    // 5. Validate job restrictions for weapons
    if (targetSlot === 'weapon' && itemDef.weapon_type && job) {
      if (job.allowed_weapons) {
        const allowedWeapons = job.allowed_weapons as unknown as string[];
        if (!allowedWeapons.includes(itemDef.weapon_type)) {
          return { 
            valid: false, 
            error: `Job ${job.name} no puede usar ${itemDef.weapon_type}` 
          };
        }
      }
    }

    // 6. Validate slot compatibility
    const compatibleSlots = this.getCompatibleSlots(inventoryItem.item_type);
    if (!compatibleSlots.includes(targetSlot)) {
      return { 
        valid: false, 
        error: `Este item no puede equiparse en ranura ${targetSlot}` 
      };
    }

    // 7. Check slot capacity
    const currentEquipped = unit.equipped_items || {};
    
    if (targetSlot === 'card') {
      const cards = currentEquipped.cards || [];
      if (cards.length >= MAX_CARDS) {
        return { valid: false, error: `Máximo ${MAX_CARDS} cartas equipadas` };
      }
    }
    
    if (targetSlot === 'skill') {
      const skills = currentEquipped.skills || [];
      if (skills.length >= MAX_GACHA_SKILLS) {
        return { valid: false, error: `Máximo ${MAX_GACHA_SKILLS} habilidades equipadas` };
      }
    }

    // 8. Warnings (optional but helpful)
    const warnings: string[] = [];
    
    if (itemDef.element && itemDef.element !== 'none') {
      warnings.push(`Item tiene elemento ${itemDef.element}`);
    }
    
    if (itemDef.set_id) {
      warnings.push(`Parte del set: ${itemDef.set_name}`);
    }

    return {
      valid: true,
      warning: warnings.length > 0 ? warnings.join(', ') : undefined
    };
  }

  /**
   * Obtiene las ranuras compatibles para un tipo de item
   */
  private static getCompatibleSlots(itemType: string): EquipmentSlot[] {
    const slotMap: Record<string, EquipmentSlot[]> = {
      weapon: ['weapon'],
      armor: ['armor'],
      accessory: ['accessory'],
      boots: ['boots'],
      card: ['card'],
      skill: ['skill'],
      material: [],
      job_core: [],
      skill_fragment: [],
      consumable: [],
    };
    return slotMap[itemType] || [];
  }

  /**
   * Obtiene la definición de un item según su tipo
   */
  private static async getItemDefinition(itemId: string, itemType: string): Promise<any> {
    if (!supabase) return null;

    const tableMap: Record<string, string> = {
      weapon: 'weapons',
      armor: 'armors',
      accessory: 'accessories',
      boots: 'boots',
      card: 'cards',
      skill: 'skills',
      material: 'materials',
      job_core: 'job_cores',
      skill_fragment: 'skill_fragments',
      consumable: 'materials',
    };

    const table = tableMap[itemType];
    if (!table) return null;

    const { data } = await supabase.from(table).select('*').eq('id', itemId).single();
    return data;
  }

/**
   * Equipa un item a una unidad
   * Sistema flexible basado en JSONB (como Brave Frontier)
   * Version 2.1 - Validación de ownership
   */
  static async equipItem(
    unitId: string, 
    itemInstanceId: string, 
    targetSlot: EquipmentSlot,
    playerId?: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase no inicializado' };
    }

    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);

    // Validate first
    const validation = await this.validateEquip(unitId, itemInstanceId, targetSlot, resolvedPlayerId);
    if (!validation.valid) {
      gameDebugger.warn('unit', 'Equip validation failed', { error: validation.error });
      return { success: false, message: validation.error };
    }

    if (validation.warning) {
      gameDebugger.info('unit', 'Equip warning', { warning: validation.warning });
    }

    // Get current equipped items
    const { data: unit } = await supabase
      .from('units')
      .select('equipped_items')
      .eq('id', unitId)
      .single();

    const currentEquipped = unit?.equipped_items || {};
    let newEquipped = { ...currentEquipped };

    // Handle different slot types
    if (targetSlot === 'weapon' || targetSlot === 'armor' || targetSlot === 'accessory' || targetSlot === 'boots') {
      // Single slot equipment - replace existing
      newEquipped[targetSlot] = itemInstanceId;
    } else if (targetSlot === 'card') {
      // Multiple items
      const cards = [...(currentEquipped.cards || [])];
      cards.push(itemInstanceId);
      newEquipped.cards = cards;
    } else if (targetSlot === 'skill') {
      // Multiple items (gacha skills)
      const skills = [...(currentEquipped.skills || [])];
      skills.push(itemInstanceId);
      newEquipped.skills = skills;
    }

    // Update unit
    const { error } = await supabase
      .from('units')
      .update({ equipped_items: newEquipped })
      .eq('id', unitId);

    if (error) {
      gameDebugger.error('unit', 'Failed to equip item', error);
      return { success: false, message: 'Error al equipar: ' + error.message };
    }

    gameDebugger.info('unit', 'Item equipped successfully', { 
      unitId, 
      itemInstanceId, 
      slot: targetSlot 
    });

// Invalidate inventory cache
    invalidateCache(resolvedPlayerId);
    
    return { 
      success: true, 
      message: validation.warning || 'Item equipado correctamente' 
    };
  }

  /**
   * Swap - Intercambia un item equipado con uno del inventario
   * Más fluido que unequip + equip
   * Version 2.1 - Validación de ownership
   */
  static async swapItem(
    unitId: string,
    equippedItemId: string,
    newItemId: string,
    slot: EquipmentSlot,
    playerId?: string
  ): Promise<{ success: boolean; message?: string }> {
    // First unequip
    const unequipResult = await this.unequipItem(unitId, equippedItemId, slot, playerId);
    if (!unequipResult.success) {
      return unequipResult;
    }

    // Then equip new item
    const equipResult = await this.equipItem(unitId, newItemId, slot, playerId);
    return {
      success: equipResult.success,
      message: equipResult.success 
        ? `Intercambiado: ${equipResult.message}`
        : `Error en intercambio: ${equipResult.message}`
    };
  }

  /**
   * Des-equipa un item de una unidad
   * Version 2.1 - Validación de ownership
   */
  static async unequipItem(
    unitId: string,
    itemInstanceId: string,
    slot: EquipmentSlot,
    playerId?: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase no inicializado' };
    }

    const resolvedPlayerId = await getPlayerIdWithValidation(playerId);

    // Verify ownership
    const { data: unit } = await supabase
      .from('units')
      .select('equipped_items')
      .eq('id', unitId)
      .eq('player_id', resolvedPlayerId)
      .single();

    if (!unit) {
      return { success: false, message: 'Unidad no encontrada o acceso denegado' };
    }

    const currentEquipped = unit.equipped_items || {};
    let newEquipped = { ...currentEquipped };

    // Handle different slot types
    if (slot === 'card') {
      const cards = [...(currentEquipped.cards || [])];
      const idx = cards.indexOf(itemInstanceId);
      if (idx > -1) cards.splice(idx, 1);
      newEquipped.cards = cards;
    } else if (slot === 'skill') {
      const skills = [...(currentEquipped.skills || [])];
      const idx = skills.indexOf(itemInstanceId);
      if (idx > -1) skills.splice(idx, 1);
      newEquipped.skills = skills;
    } else {
      delete newEquipped[slot];
    }

    await supabase
      .from('units')
      .update({ equipped_items: newEquipped })
      .eq('id', unitId);

    // Invalidate inventory cache
    invalidateCache(resolvedPlayerId);

    return { success: true, message: 'Item des-equipado correctamente' };
  }

  /**
   * Obtiene todos los items equipados de una unidad
   */
  static async getEquippedItems(unitId: string): Promise<Record<string, any>> {
    if (!supabase) return {};

    const { data: unit } = await supabase
      .from('units')
      .select('equipped_items')
      .eq('id', unitId)
      .single();

    return unit?.equipped_items || {};
  }

  /**
   * Gets the active set bonus for a unit using cached definitions
   * Version 2.0 - Uses DefinitionsCache instead of per-item DB queries
   */
  static async getActiveSetBonus(unitId: string): Promise<{ setName: string; bonus: any; pieceCount: number } | null> {
    if (!supabase) return null;

    const { data: unit } = await supabase
      .from('units')
      .select('equipped_items')
      .eq('id', unitId)
      .single();

    const equippedItems = unit?.equipped_items || {};
    const itemIds = [
      equippedItems.weapon,
      equippedItems.armor,
      equippedItems.accessory,
      equippedItems.boots,
      ...(equippedItems.cards || []),
    ].filter(Boolean);

    if (itemIds.length === 0) return null;

    // Get inventory items (1 query)
    const { data: inventoryItems } = await supabase
      .from('inventory')
      .select('item_id, item_type')
      .in('id', itemIds);

    if (!inventoryItems || inventoryItems.length === 0) return null;

    // Use DefinitionsCache for set_id lookups (0 DB queries on cache hit)
    const setCounts = new Map<string, number>();

    for (const invItem of inventoryItems) {
      const def = await DefinitionsCache.getDefinition(invItem.item_type, invItem.item_id);
      if (def?.set_id) {
        setCounts.set(def.set_id, (setCounts.get(def.set_id) || 0) + 1);
      }
    }

    // Find the set with most pieces
    let maxSet: string | null = null;
    let maxCount = 0;

    setCounts.forEach((count, setId) => {
      if (count > maxCount) { maxCount = count; maxSet = setId; }
    });

    if (!maxSet || maxCount < 2) return null;

    // Get set definition from cache (0 queries)
    const sets = await DefinitionsCache.getEquipmentSets();
    const setDef = sets.get(maxSet);
    if (!setDef) return null;

    // Determine which bonus applies
    let bonus: any = null;
    if (maxCount >= 5 && setDef.set_bonus_5pc) bonus = setDef.set_bonus_5pc;
    else if (maxCount >= 4 && setDef.set_bonus_4pc) bonus = setDef.set_bonus_4pc;
    else if (maxCount >= 3 && setDef.set_bonus_3pc) bonus = setDef.set_bonus_3pc;
    else if (maxCount >= 2 && setDef.set_bonus_2pc) bonus = setDef.set_bonus_2pc;

    if (!bonus) return null;

    return { setName: setDef.name, bonus, pieceCount: maxCount };
  }

  /**
   * Valida todos los equipos de una unidad
   * Útil para debug o validación completa
   */
  static async validateAllEquipment(unitId: string): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    if (!supabase) {
      return { valid: false, issues: ['Supabase no inicializado'], warnings: [] };
    }

    const { data: unit } = await supabase
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single();

    if (!unit) {
      return { valid: false, issues: ['Unidad no encontrada'], warnings: [] };
    }

    const issues: string[] = [];
    const warnings: string[] = [];
    const equippedItems = unit.equipped_items || {};

    // Collect all equipped item IDs
    const itemIds = [
      equippedItems.weapon,
      equippedItems.armor,
      equippedItems.accessory,
      equippedItems.boots,
      ...(equippedItems.cards || []),
      ...(equippedItems.skills || []),
    ].filter(Boolean);

    if (itemIds.length === 0) {
      return { valid: true, issues: [], warnings: ['Sin equipo equipado'] };
    }

    // Validate each item
    for (const itemId of itemIds) {
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!inventoryItem) {
        issues.push(`Item ${itemId} no encontrado en inventario`);
        continue;
      }

      // Check level requirement
      const itemDef = await this.getItemDefinition(inventoryItem.item_id, inventoryItem.item_type);
      if (itemDef?.level_required && itemDef.level_required > unit.level) {
        issues.push(`${itemDef.name}: requiere nivel ${itemDef.level_required}`);
      }

      // Check job restriction for weapon
      if (inventoryItem.item_type === 'weapon' && itemDef?.weapon_type) {
        const { data: job } = await supabase
          .from('jobs')
          .select('allowed_weapons')
          .eq('id', unit.current_job_id)
          .single();

        if (job?.allowed_weapons && !job.allowed_weapons.includes(itemDef.weapon_type)) {
          issues.push(`${itemDef.name}: job ${unit.current_job_id} no puede usar ${itemDef.weapon_type}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }
}