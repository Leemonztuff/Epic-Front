'use client';

import { ATLAS_CONFIG } from '../config/sprite-atlas-config';

export type AssetArchetype = 'melee' | 'magic' | 'ranged' | 'support' | 'neutral';
export type ItemType = 'weapon' | 'card' | 'armor' | 'accessory';
export type BackgroundKey = 'home' | 'party' | 'gacha' | 'battle' | 'campaign' | 'tavern' | 'inventory' | 'quest';

export class AssetService {
  private static LOCAL_BASE = '/assets';

  private static SPRITE_PATH = `${this.LOCAL_BASE}/sprites`;
  private static UI_PATH = `${this.LOCAL_BASE}/ui`;
  static SPRITE_ATLAS_PATH = ATLAS_CONFIG.imagePath;
  static SPRITE_SIZE = ATLAS_CONFIG.spriteSize;
  static ATLAS_COLS = ATLAS_CONFIG.columns;
  private static BG_PATH = `${this.LOCAL_BASE}/bg`;
  private static ITEMS_PATH = `${this.LOCAL_BASE}/items`;

  // Sprite mappings (follows naming convention: sprite_[name]_idle_64.png)
  private static JOB_SPRITE_MAP: Record<string, string> = {
    'novice': 'sprite_novice_idle_64.png',
    'swordman': 'sprite_knight_idle_64.png',
    'mage': 'sprite_mage_idle_64.png',
    'ranger': 'sprite_archer_idle_64.png',
    'archer': 'sprite_archer_idle_64.png',
    'acolyte': 'sprite_acolyte_idle_64.png',
    'knight': 'sprite_knight_idle_64.png',
    'wizard': 'sprite_wizard_idle_64.png',
    'priest': 'sprite_priest_idle_64.png'
  };

  private static ARCHETYPE_SPRITE_MAP: Record<AssetArchetype, string> = {
    melee: 'sprite_warrior_idle_64.png',
    magic: 'sprite_mage_idle_64.png',
    ranged: 'sprite_ranger_idle_64.png',
    support: 'sprite_priest_idle_64.png',
    neutral: 'sprite_novice_idle_64.png'
  };

  // UI Icon mappings (follows naming convention: ui_icon_[name]_64.png)
  private static JOB_ICON_MAP: Record<string, string> = {
    'novice': 'ui_icon_novice_64.png',
    'swordman': 'ui_icon_swordman_64.png',
    'mage': 'ui_icon_mage_64.png',
    'ranger': 'ui_icon_ranger_64.png',
    'archer': 'ui_icon_archer_64.png',
    'acolyte': 'ui_icon_acolyte_64.png',
    'knight': 'ui_icon_knight_64.png',
    'wizard': 'ui_icon_wizard_64.png',
    'priest': 'ui_icon_priest_64.png'
  };

  private static UI_ICON_MAP: Record<string, string> = {
    'currency_gold': 'currency_gold_icon.png',
    'currency_gem': 'currency_gem_icon.png',
    'tab_party': 'tab_icon_party.png',
    'tab_guild': 'tab_icon_guild.png',
    'world': 'world_button_base.png',
    'logo': 'logo.png'
  };

  // Background mappings (follows naming convention: bg_[name]_1920.jpg)
  private static BACKGROUND_MAP: Record<BackgroundKey, string> = {
    'home': 'bg_home_1920.jpg',
    'party': 'bg_party_1920.jpg',
    'gacha': 'bg_home_1920.jpg',
    'battle': 'bg_battle_scenic_1920.jpg',
    'campaign': 'bg_home_1920.jpg',
    'tavern': 'bg_home_1920.jpg',
    'inventory': 'bg_home_1920.jpg',
    'quest': 'bg_home_1920.jpg'
  };

  // Weapon icons
  private static WEAPON_MAP: Record<string, string> = {
    'sword': 'weapon_sword.png',
    'staff': 'weapon_staff.png',
    'bow': 'weapon_bow.png',
    'hammer': 'weapon_hammer.png',
    'spear': 'weapon_spear.png',
    'dagger': 'weapon_dagger.png'
  };

  // Skill icons
  private static SKILL_MAP: Record<string, string> = {
    'attack': 'skill_attack.png',
    'defense': 'skill_defense.png',
    'magic': 'skill_magic.png',
    'heal': 'skill_heal.png',
    'buff': 'skill_buff.png',
    'debuff': 'skill_debuff.png'
  };

  // Sprite state suffixes
  private static SPRITE_STATES = ['idle', 'attack', 'hit', 'dead', 'walk'] as const;

  // Sprite getters
  static getRandomSpriteId(archetype: AssetArchetype): string {
    return this.ARCHETYPE_SPRITE_MAP[archetype] || this.ARCHETYPE_SPRITE_MAP.neutral;
  }

  static getJobSpriteId(jobId: string): string {
    const spriteName = this.JOB_SPRITE_MAP[jobId.toLowerCase()];
    if (spriteName) return spriteName;
    return this.getRandomSpriteId('neutral');
  }

  static getSpriteUrl(spriteId: string): string {
    if (!spriteId) {
      return `${this.SPRITE_PATH}/sprite_novice_idle_64.png`;
    }

    const normalized = spriteId.toLowerCase();
    if (normalized === 'novice' || normalized === 'novice_idle' || normalized === 'sprite_novice_idle_64.png') {
      return `${this.SPRITE_PATH}/sprite_novice_idle_64.png`;
    }

    if (spriteId.startsWith('http') || spriteId.startsWith('/')) {
      return spriteId;
    }

    const fileName = spriteId.endsWith('.png') ? spriteId : `${spriteId}.png`;
    return `${this.SPRITE_PATH}/${fileName}`;
  }

  static getSpriteWithState(jobId: string, state: 'idle' | 'attack' | 'hit' | 'dead' | 'walk' = 'idle'): string {
    const baseName = this.JOB_SPRITE_MAP[jobId.toLowerCase()] || 'sprite_novice_idle_64.png';
    const fileName = baseName.replace('_idle_64.png', `_${state}_64.png`);
    return `${this.SPRITE_PATH}/${fileName}`;
  }

  // Icon getters
  static getJobIconId(jobId: string): string {
    const iconName = this.JOB_ICON_MAP[jobId.toLowerCase()];
    if (iconName) return iconName;
    return 'ui_icon_novice_64.png';
  }

  static getIconUrl(iconId: string): string {
    if (!iconId) {
      return `${this.UI_PATH}/ui_icon_novice_64.png`;
    }
    if (iconId.startsWith('http') || iconId.startsWith('/')) {
      return iconId;
    }
    const fileName = iconId.endsWith('.png') ? iconId : `${iconId}.png`;
    const withPrefix = fileName.includes('ui_') ? fileName : `ui_${fileName}`;
    return `${this.UI_PATH}/${withPrefix}`;
  }

  static getUIUrl(uiKey: string): string {
    const fileName = this.UI_ICON_MAP[uiKey];
    if (fileName) return `${this.UI_PATH}/${fileName}`;
    return '';
  }

  // Sprite Atlas methods (64x64 grid)
  static getSpriteAtlasUrl(): string {
    return this.SPRITE_ATLAS_PATH;
  }

  static getSpriteAtlasConfig() {
    return ATLAS_CONFIG;
  }

  static getSpriteAtlasPosition(index: number): { x: number; y: number } {
    const col = index % this.ATLAS_COLS;
    const row = Math.floor(index / this.ATLAS_COLS);
    return { x: col * this.SPRITE_SIZE, y: row * this.SPRITE_SIZE };
  }

  static getSpriteAtlasStyle(index: number): React.CSSProperties {
    const pos = this.getSpriteAtlasPosition(index);
    return {
      backgroundImage: `url('${this.SPRITE_ATLAS_PATH}')`,
      backgroundPosition: `-${pos.x}px -${pos.y}px`,
      backgroundRepeat: 'no-repeat',
      width: `${this.SPRITE_SIZE}px`,
      height: `${this.SPRITE_SIZE}px`,
      display: 'inline-block',
    };
  }

  // Get sprite atlas index for item types
  static getItemSpriteIndex(itemType: ItemType, itemId: string): number | null {
    const mapping: Record<string, number> = {
      // Weapons (starting at row 1, col 0 = index 16)
      'weapon_sword': 16,
      'weapon_axe': 17,
      'weapon_spear': 18,
      'weapon_bow': 19,
      'weapon_staff': 20,

      // Skills (starting at row 7, col 0 = index 112)
      'skill_attack': 112,
      'skill_fire': 113,
      'skill_ice': 114,
      'skill_lightning': 115,
      'skill_heal': 116,

      // Cards (starting at row 8, col 0 = index 128)
      'card_001': 128,
      'card_002': 129,

      // Armor
      'armor_helmet': 32,
      'armor_chest': 33,
      'armor_boots': 34,

      // Accessories
      'accessory_ring': 48,
      'accessory_necklace': 49,
    };

    const key = `${itemType}_${itemId}`;
    return mapping[key] || null;
  }

  // Background getters
  static getBgUrl(bgKey: BackgroundKey | string): string {
    const fileName = this.BACKGROUND_MAP[bgKey as BackgroundKey] || bgKey;
    if (fileName.startsWith('http') || fileName.startsWith('/')) {
      return fileName;
    }
    const fullName = fileName.includes('.') ? fileName : `${fileName}.jpg`;
    return `${this.BG_PATH}/${fullName}`;
  }

  // Item getters
  static getWeaponIconUrl(weaponId: string): string {
    const fileName = this.WEAPON_MAP[weaponId.toLowerCase()] || 'weapon_sword.png';
    return `${this.ITEMS_PATH}/${fileName}`;
  }

  static getSkillIconUrl(skillId: string): string {
    const fileName = this.SKILL_MAP[skillId.toLowerCase()] || 'skill_attack.png';
    return `${this.ITEMS_PATH}/${fileName}`;
  }

  static getCardUrl(cardId: string): string {
    const id = cardId.toLowerCase();
    
    // Check for specific UI card assets
    if (id.includes('goblin')) return `${this.UI_PATH}/ui_card_goblin_256.png`;
    if (id.includes('zombie')) return `${this.UI_PATH}/ui_card_zombie_256.gif`;
    if (id.includes('baphomet')) return `${this.UI_PATH}/ui_baphomet_256.png`;
    if (id.includes('banshee')) return `${this.UI_PATH}/ui_card_banshee_256.png`;
    if (id.includes('lamia')) return `${this.UI_PATH}/ui_card_lamia_queen_256.png`;

    // Remove 'card_' prefix if present to avoid 'card_card_xxx'
    const cleanId = id.replace(/^card_/, '');
    return `${this.ITEMS_PATH}/card_${cleanId}.png`;
  }

  // Get fallback PNG URL for any card
  static getCardUrlFallback(cardId: string): string {
    const id = cardId.toLowerCase();
    
    // Check for specific UI card assets - use PNG
    if (id.includes('goblin')) return `${this.UI_PATH}/ui_card_goblin_256.png`;
    if (id.includes('zombie')) return `${this.UI_PATH}/ui_card_zombie_256.png`;
    if (id.includes('baphomet')) return `${this.UI_PATH}/ui_baphomet_256.png`;
    if (id.includes('banshee')) return `${this.UI_PATH}/ui_card_banshee_256.png`;
    if (id.includes('lamia')) return `${this.UI_PATH}/ui_card_lamia_queen_256.png`;
    
    const cleanId = id.replace(/^card_/, '');
    return `${this.ITEMS_PATH}/card_${cleanId}.png`;
  }

  static getArmorIconUrl(armorId: string): string {
    return `${this.ITEMS_PATH}/armor_${armorId}.png`;
  }

  static getAccessoryIconUrl(accessoryId: string): string {
    return `${this.ITEMS_PATH}/accessory_${accessoryId}.png`;
  }

  // Enemy card images (follows naming convention: ui_card_[name]_256.png)
  static getEnemyCardUrl(enemyName: string): string {
    const normalized = enemyName.toLowerCase().replace(/\s+/g, '_');
    return `${this.UI_PATH}/ui_card_${normalized}_256.png`;
  }

  static getItemIconUrl(itemType: ItemType, itemId: string): string {
    switch (itemType) {
      case 'weapon':
        return this.getWeaponIconUrl(itemId);
      case 'card':
        return this.getCardUrl(itemId);
      case 'armor':
        return this.getArmorIconUrl(itemId);
      case 'accessory':
        return this.getAccessoryIconUrl(itemId);
      default:
        return `${this.ITEMS_PATH}/card_frame.png`;
    }
  }

  static getParallaxLayerUrl(layer: 1 | 2 | 3): string {
    return `${this.BG_PATH}/parallax_layer_${layer}.png`;
  }

  // Utility methods
  static getAffinityArchetype(affinity: string): AssetArchetype {
    switch (affinity.toLowerCase()) {
      case 'physical': return 'melee';
      case 'magic': return 'magic';
      case 'ranged': return 'ranged';
      case 'support': return 'support';
      default: return 'neutral';
    }
  }

  static isValidBackground(bgKey: string): boolean {
    return Object.keys(this.BACKGROUND_MAP).includes(bgKey);
  }

  static isValidWeapon(weaponId: string): boolean {
    return Object.keys(this.WEAPON_MAP).includes(weaponId.toLowerCase());
  }

  static isValidSkill(skillId: string): boolean {
    return Object.keys(this.SKILL_MAP).includes(skillId.toLowerCase());
  }
}
