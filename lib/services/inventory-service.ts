// Inventory Service - Centralized inventory management
// Version: 2.0 - Sistema de equipamiento mejorado (Ragnarok/Brave Frontier)

import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { DefinitionsCache } from './definitions-cache';
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

export function invalidateCache(playerId: string) {
  inventoryCache.delete(getCacheKey(playerId));
  gameDebugger.info('inventory', 'Cache invalidated', { playerId });
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

const VALID_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

function normalizeRarity(rarity: string | null | undefined): Rarity {
  if (!rarity) return 'common';
  const normalized = rarity.toLowerCase();
  return VALID_RARITIES.includes(normalized as Rarity) ? normalized as Rarity : 'common';
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
   * Enrich inventory items with their definitions from cached static tables
   * Versión 3.0 - Uses DefinitionsCache (10min TTL) instead of 9 parallel queries
   */
  private static async enrichInventory(inventory: any[]): Promise<InventoryItem[]> {
    const setMap = new Map<string, EquipmentSet>();

    // Load all equipment sets (cached)
    const sets = await DefinitionsCache.getEquipmentSets();
    sets.forEach((s: any) => {
      setMap.set(s.id, s);
    });

    // Load each item's definition from cache
    const definitionMap = new Map<string, ItemDefinition>();

    for (const item of inventory) {
      const def = await DefinitionsCache.getDefinition(item.item_type, item.item_id);
      if (def) {
        // Enrich with set info
        if (def.set_id && setMap.has(def.set_id)) {
          const setInfo = setMap.get(def.set_id)!;
          def.set_name = setInfo.name;
        }
        definitionMap.set(item.item_id, def);
      }
    }

    // Merge definitions with inventory items
    return inventory.map(item => {
      const definition = definitionMap.get(item.item_id);

      if (!definition) {
        const fallback = getFallbackDefinition(item.item_id, item.item_type);
        if (fallback) {
          gameDebugger.info('inventory', 'Using fallback definition', {
            itemId: item.item_id,
            itemType: item.item_type,
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

      return { ...item, definition };
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

  /**
   * Get inventory item by item_id (for cards, skills, materials)
   * Unified way to find items in inventory
   */
  static async getItemByItemId(itemId: string, playerId?: string): Promise<InventoryItem | null> {
    if (!supabase) {
      gameDebugger.warn('inventory', 'Supabase not initialized');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const targetPlayerId = playerId || user?.id;
    
    if (!targetPlayerId) {
      return null;
    }

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('item_id', itemId)
      .eq('player_id', targetPlayerId)
      .single();

    if (error || !data) {
      gameDebugger.info('inventory', 'Item not found by item_id', { itemId, error });
      return null;
    }

    return data as InventoryItem;
  }

  /**
   * Get inventory item by inventory ID (for equipment)
   */
  static async getItemByInventoryId(inventoryId: string, playerId?: string): Promise<InventoryItem | null> {
    if (!supabase) {
      gameDebugger.warn('inventory', 'Supabase not initialized');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const targetPlayerId = playerId || user?.id;
    
    if (!targetPlayerId) {
      return null;
    }

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryId)
      .eq('player_id', targetPlayerId)
      .single();

    if (error || !data) {
      gameDebugger.info('inventory', 'Item not found by inventory id', { inventoryId, error });
      return null;
    }

    return data as InventoryItem;
  }

  /**
   * Unified function to get inventory item - tries both methods
   * For cards/skills: use item_id
   * For equipment: use inventory id
   */
  static async getInventoryItem(
    identifier: string, 
    type: 'item_id' | 'inventory_id', 
    playerId?: string
  ): Promise<InventoryItem | null> {
    if (type === 'item_id') {
      return this.getItemByItemId(identifier, playerId);
    } else {
      return this.getItemByInventoryId(identifier, playerId);
    }
  }

  /**
   * Validate item exists and has quantity > 0
   */
  static async validateItemForEquip(itemId: string, playerId?: string): Promise<{
    valid: boolean;
    item: InventoryItem | null;
    error?: string;
  }> {
    const item = await this.getItemByItemId(itemId, playerId);
    
    if (!item) {
      return { valid: false, item: null, error: 'Item no encontrado en inventario' };
    }

    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, item: null, error: 'No tienes cantidad suficiente de este item' };
    }

    return { valid: true, item };
  }
}