import { supabase } from '@/lib/supabase';

interface CacheEntry<T> {
  data: Map<string, T>;
  timestamp: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (static data rarely changes)

const cache = new Map<string, CacheEntry<any>>();

async function fetchTable(table: string): Promise<Map<string, any>> {
  const now = Date.now();
  const cached = cache.get(table);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  if (!supabase) return new Map();

  const { data, error } = await supabase.from(table).select('*');
  if (error || !data) return new Map();

  const map = new Map<string, any>();
  data.forEach((item: any) => map.set(item.id, item));

  cache.set(table, { data: map, timestamp: now });
  return map;
}

function buildItemDefinition(id: string, item: any): any {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    rarity: normalizeRarity(item.rarity),
    element: item.element || 'none',
    level_required: item.level_required || 1,
    set_id: item.set_id,
    set_name: item.set_name,
    weapon_type: item.weapon_type,
    armor_type: item.armor_type,
    accessory_type: item.accessory_type,
    boot_type: item.boot_type,
    stat_bonuses: item.stat_bonuses,
    special_effects: item.special_effects,
    sell_price: item.sell_price,
    effect_type: item.effect_type,
    effect_value: item.effect_value,
    applicable_jobs: item.applicable_jobs,
    piece_count: item.piece_count,
    skill_module_id: item.skill_module_id,
    cooldown: item.cooldown,
    version: item.version,
  };
}

function normalizeRarity(rarity: string | null | undefined): string {
  if (!rarity) return 'common';
  const map: Record<string, string> = {
    c: 'common', r: 'rare', sr: 'super_rare', ur: 'ultra_rare', mr: 'mythic',
    common: 'common', rare: 'rare', epic: 'super_rare', legendary: 'ultra_rare',
  };
  return map[rarity.toLowerCase()] || 'common';
}

export class DefinitionsCache {
  static async getWeapon(id: string) {
    const map = await fetchTable('weapons');
    return buildItemDefinition(id, map.get(id));
  }

  static async getArmor(id: string) {
    const map = await fetchTable('armors');
    return buildItemDefinition(id, map.get(id));
  }

  static async getAccessory(id: string) {
    const map = await fetchTable('accessories');
    return buildItemDefinition(id, map.get(id));
  }

  static async getBoot(id: string) {
    const map = await fetchTable('boots');
    return buildItemDefinition(id, map.get(id));
  }

  static async getCard(id: string) {
    const map = await fetchTable('cards');
    return buildItemDefinition(id, map.get(id));
  }

  static async getMaterial(id: string) {
    const map = await fetchTable('materials');
    return buildItemDefinition(id, map.get(id));
  }

  static async getJobCore(id: string) {
    const map = await fetchTable('job_cores');
    return buildItemDefinition(id, map.get(id));
  }

  static async getSkillFragment(id: string) {
    const map = await fetchTable('skill_fragments');
    return buildItemDefinition(id, map.get(id));
  }

  static async getEquipmentSets(): Promise<Map<string, any>> {
    return fetchTable('equipment_sets');
  }

  static async getDefinition(itemType: string, itemId: string): Promise<any | null> {
    switch (itemType) {
      case 'weapon': return this.getWeapon(itemId);
      case 'armor': return this.getArmor(itemId);
      case 'accessory': return this.getAccessory(itemId);
      case 'boots': return this.getBoot(itemId);
      case 'card': return this.getCard(itemId);
      case 'material': return this.getMaterial(itemId);
      case 'job_core': return this.getJobCore(itemId);
      case 'skill_fragment': return this.getSkillFragment(itemId);
      case 'consumable': return this.getMaterial(itemId);
      default: return null;
    }
  }

  static invalidate(table?: string) {
    if (table) {
      cache.delete(table);
    } else {
      cache.clear();
    }
  }
}
