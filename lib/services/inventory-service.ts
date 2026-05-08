// Inventory Service - Centralized inventory management
// Version: 2.0 - Sistema de equipamiento mejorado (Ragnarok/Brave Frontier)

import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import type { Element, EquipmentStats } from '@/lib/types/game-types';

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill' | 'material' | 'job_core' | 'skill_fragment' | 'consumable';

export interface InventoryItem {
  id: string;
  player_id: string;
  item_id: string;
  item_type: ItemType;
  quantity: number;
  metadata?: Record<string, any>;
  created_at?: string;
  // Enriched fields
  definition?: ItemDefinition;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  
  // Equipment common
  element?: Element;
  level_required?: number;
  set_id?: string;
  set_name?: string;
  sell_price?: number;
  
  // Weapon specific
  weapon_type?: string;
  stat_bonuses?: EquipmentStats;
  special_effects?: Record<string, any>;
  
  // Armor specific
  armor_type?: string;
  
  // Accessory specific
  accessory_type?: string;
  
  // Boots specific
  boot_type?: string;
  
  // Card specific
  effect_type?: string;
  effect_value?: Record<string, any>;
  applicable_jobs?: string[];
  
  // Skill Fragment specific
  piece_count?: number;
  skill_module_id?: string;
  cooldown?: number;
  
  // Common
  version?: string;
}

interface EquipmentSet {
  id: string;
  name: string;
  set_bonus_2pc?: EquipmentStats;
  set_bonus_3pc?: EquipmentStats;
  set_bonus_4pc?: EquipmentStats;
  set_bonus_5pc?: EquipmentStats;
}

// Cache for inventory data
const inventoryCache = new Map<string, { data: InventoryItem[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(playerId: string): string {
  return `inventory_${playerId}`;
}

function getCachedInventory(playerId: string): InventoryItem[] | null {
  const cached = inventoryCache.get(getCacheKey(playerId));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    gameDebugger.info('inventory', 'Using cached inventory', { count: cached.data.length });
    return cached.data;
  }
  return null;
}

function setCachedInventory(playerId: string, data: InventoryItem[]) {
  inventoryCache.set(getCacheKey(playerId), { data, timestamp: Date.now() });
}

function invalidateCache(playerId: string) {
  inventoryCache.delete(getCacheKey(playerId));
  gameDebugger.info('inventory', 'Cache invalidated', { playerId });
}

// Fallback definitions when DB tables are empty
const FALLBACK_DEFINITIONS: Record<string, Record<string, ItemDefinition>> = {
  weapon: {
    'weapon_sword': { id: 'weapon_sword', name: 'Espada Básica', description: 'Una espada simple pero confiable', weapon_type: 'sword', element: 'none', level_required: 1, rarity: 'common', sell_price: 10 },
    'weapon_staff': { id: 'weapon_staff', name: 'Bastón Básico', description: 'Un bastón para principiantes', weapon_type: 'staff', element: 'none', level_required: 1, rarity: 'common', sell_price: 10 },
    'weapon_bow': { id: 'weapon_bow', name: 'Arco Básico', description: 'Un arco simple', weapon_type: 'bow', element: 'none', level_required: 1, rarity: 'common', sell_price: 10 },
  },
  card: {
    'card_light_heal': { id: 'card_light_heal', name: 'Card Curación', description: 'Card de habilidad curativa', rarity: 'common' },
    'card_power_up': { id: 'card_power_up', name: 'Card Poder', description: 'Card de buff de ataque', rarity: 'uncommon' },
    'card_ice_shield': { id: 'card_ice_shield', name: 'Card Escudo de Hielo', description: 'Card de defensa mágica', rarity: 'rare' },
  },
  skill: {
    'skill_basic_attack': { id: 'skill_basic_attack', name: 'Ataque Básico', description: 'Ataque estándar', rarity: 'common', cooldown: 0 },
    'skill_light_heal': { id: 'skill_light_heal', name: 'Curación Ligera', description: 'Restaura HP', rarity: 'common', cooldown: 3 },
    'skill_power_up': { id: 'skill_power_up', name: 'Potenciar', description: 'Aumenta ataque', rarity: 'uncommon', cooldown: 5 },
  },
  material: {
    'material_herb': { id: 'material_herb', name: 'Hierba Medicinal', description: 'Material básico', rarity: 'common' },
    'material_ore': { id: 'material_ore', name: 'Mineral de Hierro', description: 'Material de forja', rarity: 'common' },
  },
};

function getFallbackDefinition(itemId: string, itemType: string): ItemDefinition | null {
  const typeMap: Record<string, string> = {
    'skill_scroll': 'skill',
    'skill_fragment': 'skill',
  };
  const mappedType = typeMap[itemType] || itemType;
  const def = FALLBACK_DEFINITIONS[mappedType]?.[itemId];
  if (def) {
    gameDebugger.info('inventory', 'Using fallback definition', { itemId, itemType });
  }
  return def || null;
}

export class InventoryService {
  /**
   * Get player inventory - returns cached if available
   * Returns empty array if no player ID (graceful fallback)
   */
  static async getInventory(playerId?: string): Promise<InventoryItem[]> {
    if (!supabase) {
      gameDebugger.warn('inventory', 'Supabase not initialized');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    const targetPlayerId = playerId || user?.id;
    
    if (!targetPlayerId) {
      gameDebugger.warn('inventory', 'No player ID, returning empty inventory');
      return [];
    }

    // Check cache first
    const cached = getCachedInventory(targetPlayerId);
    if (cached) return cached;

    // Get basic inventory items
    gameDebugger.info('inventory', 'Loading from DB', { playerId: targetPlayerId });
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('player_id', targetPlayerId)
      .order('created_at', { ascending: false });

    if (error) {
      gameDebugger.error('inventory', 'Failed to load inventory', error);
      throw error;
    }

    gameDebugger.info('inventory', 'Raw query result', { 
      count: inventory?.length || 0, 
      items: inventory 
    });

    if (!inventory || inventory.length === 0) {
      gameDebugger.info('inventory', 'Empty inventory - trying to add starter items');
      
      // Try to add starter items
      try {
        const { error: insertError } = await supabase.rpc('rpc_add_starter_inventory');
        if (insertError) {
          gameDebugger.error('inventory', 'Failed to add starter items', insertError);
        } else {
          gameDebugger.info('inventory', 'Starter items added, reloading...');
          // Reload
          return this.getInventory(targetPlayerId);
        }
      } catch (e) {
        gameDebugger.error('inventory', 'Error adding starter items', e);
      }
      
      return [];
    }

    // Enrich with definitions
    const enriched = await this.enrichInventory(inventory);
    
    // Cache the result
    setCachedInventory(targetPlayerId, enriched);
    
    gameDebugger.info('inventory', 'Inventory loaded', { count: enriched.length });
    return enriched;
  }

  /**
   * Enrich inventory items with their definitions from respective tables
   * Versión 2.0 - Soporta armors, accessories, boots y equipment sets
   */
  private static async enrichInventory(inventory: any[]): Promise<InventoryItem[]> {
    // Group by type for batch queries
    const itemsByType = {
      weapon: inventory.filter(i => i.item_type === 'weapon'),
      armor: inventory.filter(i => i.item_type === 'armor'),
      accessory: inventory.filter(i => i.item_type === 'accessory'),
      boots: inventory.filter(i => i.item_type === 'boots'),
      card: inventory.filter(i => i.item_type === 'card'),
      skill_fragment: inventory.filter(i => i.item_type === 'skill_fragment'),
      material: inventory.filter(i => i.item_type === 'material'),
      job_core: inventory.filter(i => i.item_type === 'job_core'),
      consumable: inventory.filter(i => i.item_type === 'consumable'),
    };

    // Collect set_ids for equipment lookup
    const setIds = new Set<string>();
    ['weapon', 'armor', 'accessory', 'boots'].forEach(type => {
      itemsByType[type as keyof typeof itemsByType].forEach((item: any) => {
        // We'll need to get set_ids after fetching definitions
      });
    });

    // Fetch definitions in parallel
    const [weapons, armors, accessories, boots, cards, fragments, materials, jobs, sets] = await Promise.all([
      itemsByType.weapon.length > 0 
        ? supabase.from('weapons').select('*').in('id', itemsByType.weapon.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.armor.length > 0 
        ? supabase.from('armors').select('*').in('id', itemsByType.armor.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.accessory.length > 0 
        ? supabase.from('accessories').select('*').in('id', itemsByType.accessory.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.boots.length > 0 
        ? supabase.from('boots').select('*').in('id', itemsByType.boots.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.card.length > 0 
        ? supabase.from('cards').select('*').in('id', itemsByType.card.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.skill_fragment.length > 0
        ? supabase.from('skill_fragments').select('*').in('id', itemsByType.skill_fragment.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.material.length > 0 
        ? supabase.from('materials').select('*').in('id', itemsByType.material.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.job_core.length > 0 
        ? supabase.from('job_cores').select('*').in('id', itemsByType.job_core.map((i: any) => i.item_id))
        : Promise.resolve({ data: [] }),
      // Fetch all equipment sets
      supabase.from('equipment_sets').select('*'),
    ]);

    // Create lookup maps
    const definitionMap = new Map<string, ItemDefinition>();
    const setMap = new Map<string, EquipmentSet>();
    
    // Index sets by ID
    (sets.data || []).forEach((s: any) => {
      setMap.set(s.id, {
        id: s.id,
        name: s.name,
        set_bonus_2pc: s.set_bonus_2pc,
        set_bonus_3pc: s.set_bonus_3pc,
        set_bonus_4pc: s.set_bonus_4pc,
        set_bonus_5pc: s.set_bonus_5pc,
      });
    });

    // Weapons
    (weapons.data || []).forEach((w: any) => {
      const setInfo = w.set_id ? setMap.get(w.set_id) : null;
      definitionMap.set(w.id, {
        id: w.id,
        name: w.name,
        description: w.description,
        weapon_type: w.weapon_type,
        element: w.element || 'none',
        level_required: w.level_required || 1,
        set_id: w.set_id,
        set_name: setInfo?.name,
        stat_bonuses: w.stat_bonuses,
        special_effects: w.special_effects,
        rarity: w.rarity as any,
        sell_price: w.sell_price,
        version: w.version,
      });
    });

    // Armors
    (armors.data || []).forEach((a: any) => {
      const setInfo = a.set_id ? setMap.get(a.set_id) : null;
      definitionMap.set(a.id, {
        id: a.id,
        name: a.name,
        description: a.description,
        armor_type: a.armor_type,
        element: a.element || 'none',
        level_required: a.level_required || 1,
        set_id: a.set_id,
        set_name: setInfo?.name,
        stat_bonuses: a.stat_bonuses,
        special_effects: a.special_effects,
        rarity: a.rarity as any,
        sell_price: a.sell_price,
        version: a.version,
      });
    });

    // Accessories
    (accessories.data || []).forEach((a: any) => {
      const setInfo = a.set_id ? setMap.get(a.set_id) : null;
      definitionMap.set(a.id, {
        id: a.id,
        name: a.name,
        description: a.description,
        accessory_type: a.accessory_type,
        element: a.element || 'none',
        level_required: a.level_required || 1,
        set_id: a.set_id,
        set_name: setInfo?.name,
        stat_bonuses: a.stat_bonuses,
        special_effects: a.special_effects,
        rarity: a.rarity as any,
        sell_price: a.sell_price,
        version: a.version,
      });
    });

    // Boots
    (boots.data || []).forEach((b: any) => {
      const setInfo = b.set_id ? setMap.get(b.set_id) : null;
      definitionMap.set(b.id, {
        id: b.id,
        name: b.name,
        description: b.description,
        boot_type: b.boot_type,
        element: b.element || 'none',
        level_required: b.level_required || 1,
        set_id: b.set_id,
        set_name: setInfo?.name,
        stat_bonuses: b.stat_bonuses,
        special_effects: b.special_effects,
        rarity: b.rarity as any,
        sell_price: b.sell_price,
        version: b.version,
      });
    });

    // Cards
    (cards.data || []).forEach((c: any) => {
      definitionMap.set(c.id, {
        id: c.id,
        name: c.name,
        rarity: c.rarity as any,
        effect_type: c.effect_type,
        effect_value: c.effect_value,
        applicable_jobs: c.applicable_jobs,
        version: c.version,
      });
    });

    // Skill Fragments
    (fragments.data || []).forEach((s: any) => {
      definitionMap.set(s.id, {
        id: s.id,
        name: s.name,
        description: s.description,
        rarity: s.rarity as any,
        piece_count: s.piece_count,
        skill_module_id: s.skill_module_id,
        version: s.version,
      });
    });

    // Materials
    (materials.data || []).forEach((m: any) => {
      definitionMap.set(m.id, {
        id: m.id,
        name: m.name,
        rarity: m.rarity as any,
        description: m.description,
        version: m.version,
      });
    });

    // Job Cores
    (jobs.data || []).forEach((j: any) => {
      definitionMap.set(j.id, {
        id: j.id,
        name: j.name,
        rarity: j.rarity as any,
        version: j.version,
      });
    });

    // Merge definitions with inventory items
    return inventory.map(item => {
      const definition = definitionMap.get(item.item_id);
      
      if (!definition) {
        // Try fallback from memory
        const fallback = getFallbackDefinition(item.item_id, item.item_type);
        if (fallback) {
          gameDebugger.info('inventory', 'Using fallback definition', { 
            itemId: item.item_id, 
            itemType: item.item_type 
          });
        }
        return {
          ...item,
          definition: fallback || {
            id: item.item_id,
            name: item.item_id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            rarity: 'common' as const,
          },
        };
      }

      return {
        ...item,
        definition,
      };
    });
  }

  /**
   * Add item to inventory
   */
  static async addItem(itemId: string, itemType: ItemType, quantity: number = 1): Promise<InventoryItem> {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    gameDebugger.info('inventory', 'Adding item', { itemId, itemType, quantity });

    const { data, error } = await supabase
      .from('inventory')
      .upsert({
        player_id: user.id,
        item_id: itemId,
        item_type: itemType,
        quantity,
      }, {
        onConflict: 'player_id,item_id',
      })
      .select()
      .single();

    if (error) {
      gameDebugger.error('inventory', 'Failed to add item', error);
      throw error;
    }

    // Invalidate cache
    invalidateCache(user.id);
    
    // Return the full inventory with the new item
    return this.getInventory().then(inv => inv.find(i => i.item_id === itemId) || data);
  }

  /**
   * Remove item from inventory (decrease quantity)
   */
  static async removeItem(itemId: string, quantity: number = 1): Promise<void> {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    gameDebugger.info('inventory', 'Removing item', { itemId, quantity });

    // Get current quantity
    const { data: current } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('player_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (!current) {
      gameDebugger.warn('inventory', 'Item not found in inventory', { itemId });
      return;
    }

    if (current.quantity <= quantity) {
      // Remove entirely
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('player_id', user.id)
        .eq('item_id', itemId);

      if (error) {
        gameDebugger.error('inventory', 'Failed to delete item', error);
        throw error;
      }
    } else {
      // Decrease quantity
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: current.quantity - quantity })
        .eq('player_id', user.id)
        .eq('item_id', itemId);

      if (error) {
        gameDebugger.error('inventory', 'Failed to update quantity', error);
        throw error;
      }
    }

    invalidateCache(user.id);
  }

  /**
   * Discard item entirely from inventory
   */
  static async discardItem(inventoryItemId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    gameDebugger.info('inventory', 'Discarding item', { inventoryItemId });

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', inventoryItemId)
      .eq('player_id', user.id);

    if (error) {
      gameDebugger.error('inventory', 'Failed to discard item', error);
      throw error;
    }

    invalidateCache(user.id);
  }

  /**
   * Get single item definition
   */
  static async getItemDefinition(itemId: string, itemType: ItemType): Promise<ItemDefinition | null> {
    let table = 'cards';
    if (itemType === 'weapon') table = 'weapons';
    if (itemType === 'material') table = 'materials';
    if (itemType === 'job_core') table = 'job_cores';
    if (itemType === 'skill_fragment') table = 'skill_fragments';
    if (itemType === 'skill') table = 'skills';
    if (itemType === 'armor') table = 'armors';
    if (itemType === 'accessory') table = 'accessories';
    if (itemType === 'boots') table = 'boots';

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      gameDebugger.warn('inventory', `Item not found in ${table}`, { itemId });
      return null;
    }

    return data as ItemDefinition;
  }

  /**
   * Force refresh inventory (bypass cache)
   */
  static async refreshInventory(playerId?: string): Promise<InventoryItem[]> {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data: { user } } = await supabase.auth.getUser();
    const targetPlayerId = playerId || user?.id;
    
    if (!targetPlayerId) throw new Error("No player ID");

    invalidateCache(targetPlayerId);
    return this.getInventory(targetPlayerId);
  }

  /**
   * Get inventory filtered by type
   */
  static async getInventoryByType(type: ItemType): Promise<InventoryItem[]> {
    const all = await this.getInventory();
    return all.filter(item => item.item_type === type);
  }

  /**
   * Check if player has specific item
   */
  static async hasItem(itemId: string): Promise<boolean> {
    const all = await this.getInventory();
    return all.some(item => item.item_id === itemId);
  }

  /**
   * Get item count
   */
  static async getItemCount(itemId: string): Promise<number> {
    const all = await this.getInventory();
    const item = all.find(i => i.item_id === itemId);
    return item?.quantity || 0;
  }
}