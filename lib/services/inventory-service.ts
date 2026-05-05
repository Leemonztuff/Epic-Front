// Inventory Service - Centralized inventory management
// Version: 1.0.0

import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';

export type ItemType = 'weapon' | 'card' | 'material' | 'job_core' | 'skill_fragment' | 'consumable';

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
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  // Weapon specific
  weapon_type?: string;
  stat_bonuses?: Record<string, number>;
  special_effects?: Record<string, any>;
  // Card specific
  effect_type?: string;
  effect_value?: Record<string, any>;
  applicable_jobs?: string[];
  // Skill Fragment specific
  piece_count?: number;
  skill_module_id?: string;
  // Common
  version?: string;
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
   */
  private static async enrichInventory(inventory: any[]): Promise<InventoryItem[]> {
    // Group by type for batch queries
    const itemsByType = {
      weapon: inventory.filter(i => i.item_type === 'weapon'),
      card: inventory.filter(i => i.item_type === 'card'),
      skill_fragment: inventory.filter(i => i.item_type === 'skill_fragment'),
      material: inventory.filter(i => i.item_type === 'material'),
      job_core: inventory.filter(i => i.item_type === 'job_core'),
      consumable: inventory.filter(i => i.item_type === 'consumable'),
    };

    // Fetch definitions in parallel
    const [weapons, cards, fragments, materials, jobs] = await Promise.all([
      itemsByType.weapon.length > 0 
        ? supabase.from('weapons').select('*').in('id', itemsByType.weapon.map(i => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.card.length > 0 
        ? supabase.from('cards').select('*').in('id', itemsByType.card.map(i => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.skill_fragment.length > 0
        ? supabase.from('skill_fragments').select('*').in('id', itemsByType.skill_fragment.map(i => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.material.length > 0 
        ? supabase.from('materials').select('*').in('id', itemsByType.material.map(i => i.item_id))
        : Promise.resolve({ data: [] }),
      itemsByType.job_core.length > 0 
        ? supabase.from('job_cores').select('*').in('id', itemsByType.job_core.map(i => i.item_id))
        : Promise.resolve({ data: [] }),
    ]);

    // Create lookup maps
    const definitionMap = new Map<string, ItemDefinition>();
    
    (weapons.data || []).forEach((w: any) => {
      definitionMap.set(w.id, {
        id: w.id,
        name: w.name,
        weapon_type: w.weapon_type,
        stat_bonuses: w.stat_bonuses,
        special_effects: w.special_effects,
        rarity: w.rarity as any,
        version: w.version,
      });
    });

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

    (materials.data || []).forEach((m: any) => {
      definitionMap.set(m.id, {
        id: m.id,
        name: m.name,
        rarity: m.rarity as any,
        description: m.description,
        version: m.version,
      });
    });

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
        gameDebugger.warn('inventory', 'Item definition not found', { 
          itemId: item.item_id, 
          itemType: item.item_type 
        });
      }

      return {
        ...item,
        definition: definition || {
          id: item.item_id,
          name: 'Item Desconocido',
          rarity: 'common' as const,
        },
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