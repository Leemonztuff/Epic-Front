import { CardItem, WeaponItem, JobCoreItem, SkillFragmentItem, AnyGachaItem } from './gacha-types';

export type { SkillFragmentItem };

export const GACHA_DATABASE: Record<string, AnyGachaItem> = {
    // ============================================
    // CARDS (10 Examples)
    // ============================================
    'card_goblin': {
        id: 'card_goblin', name: 'Goblin Card', type: 'card', rarity: 'common', version: 'v1.0',
        description: 'Increases physical damage by 10%.',
        effectType: 'statBoost', effectTarget: 'atk', effectValue: 0.10, applicableJobs: ['ALL']
    },
    'card_zombie': {
        id: 'card_zombie', name: 'Zombie Card', type: 'card', rarity: 'common', version: 'v1.0',
        description: 'Increases Max HP by 15%.',
        effectType: 'statBoost', effectTarget: 'hp', effectValue: 0.15, applicableJobs: ['ALL']
    },
    'card_skeleton': {
        id: 'card_skeleton', name: 'Skeleton Worker Card', type: 'card', rarity: 'rare', version: 'v1.0',
        description: 'Increases physical damage against medium targets by 20%.',
        effectType: 'conditionalEffect', effectTarget: 'damage_medium', effectValue: 0.20, applicableJobs: ['swordman', 'knight', 'rune_knight']
    },
    'card_ghost': {
        id: 'card_ghost', name: 'Ghostring Card', type: 'card', rarity: 'epic', version: 'v1.0',
        description: 'Chance to evade physical attacks (15%).',
        effectType: 'conditionalEffect', effectTarget: 'evasion', effectValue: 0.15, applicableJobs: ['ALL']
    },
    'card_baphomet': {
        id: 'card_baphomet', name: 'Baphomet Card', type: 'card', rarity: 'legendary', version: 'v1.0',
        description: 'Basic attacks hit all enemies in a 3x3 area.',
        effectType: 'skillModifier', effectTarget: 'basic_attack_aoe', effectValue: 1, applicableJobs: ['ALL']
    },
    'card_elder_willow': {
        id: 'card_elder_willow', name: 'Elder Willow Card', type: 'card', rarity: 'common', version: 'v1.0',
        description: 'Magic Attack +10%.',
        effectType: 'statBoost', effectTarget: 'matk', effectValue: 0.10, applicableJobs: ['mage', 'wizard', 'warlock']
    },
    'card_pecopeco': {
        id: 'card_pecopeco', name: 'Peco Peco Card', type: 'card', rarity: 'rare', version: 'v1.0',
        description: 'HP +25%.',
        effectType: 'statBoost', effectTarget: 'hp', effectValue: 0.25, applicableJobs: ['ALL']
    },
    'card_vampire': {
        id: 'card_vampire', name: 'Vampire Bat Card', type: 'card', rarity: 'rare', version: 'v1.0',
        description: '10% chance to drain 5% HP on basic attacks.',
        effectType: 'conditionalEffect', effectTarget: 'lifesteal_chance', effectValue: 0.10, applicableJobs: ['ALL']
    },
    'card_hydra': {
        id: 'card_hydra', name: 'Hydra Card', type: 'card', rarity: 'epic', version: 'v1.0',
        description: 'Damage to Demihuman targets +20%.',
        effectType: 'conditionalEffect', effectTarget: 'damage_demihuman', effectValue: 0.20, applicableJobs: ['ALL']
    },
    'card_valkyrie': {
        id: 'card_valkyrie', name: 'Valkyrie Randgris Card', type: 'card', rarity: 'legendary', version: 'v1.0',
        description: 'Physical Attack +10%, makes attacks un-interruptible.',
        effectType: 'skillModifier', effectTarget: 'uninterruptible', effectValue: 1, applicableJobs: ['ALL']
    },

    // ============================================
    // WEAPONS (5 Examples)
    // ============================================
    'wpn_blade': {
        id: 'wpn_blade', name: 'Iron Blade', type: 'weapon', rarity: 'common', version: 'v1.0',
        description: 'A standard iron sword.', weaponCategory: 'sword',
        statBonuses: { atk: 50, def: 5 }
    },
    'wpn_wand': {
        id: 'wpn_wand', name: 'Apprentice Wand', type: 'weapon', rarity: 'common', version: 'v1.0',
        description: 'A magical wooden catalyst.', weaponCategory: 'staff',
        statBonuses: { matk: 60, mdef: 10 }
    },
    'wpn_crimson_bow': {
        id: 'wpn_crimson_bow', name: 'Crimson Bow', type: 'weapon', rarity: 'rare', version: 'v1.0',
        description: 'A bow burning with fire element.', weaponCategory: 'bow',
        statBonuses: { atk: 120, agi: 20 }, specialEffect: 'Fire Element attacks'
    },
    'wpn_murasame': {
        id: 'wpn_murasame', name: 'Murasame', type: 'weapon', rarity: 'epic', version: 'v1.0',
        description: 'A cursed katana that causes bleeding.', weaponCategory: 'sword',
        statBonuses: { atk: 250, agi: 40 }, specialEffect: 'Attacks have a 25% chance to cause Bleed.'
    },
    'wpn_staff_of_destruction': {
        id: 'wpn_staff_of_destruction', name: 'Staff of Destruction', type: 'weapon', rarity: 'legendary', version: 'v1.0',
        description: 'A staff containing chaotic magic.', weaponCategory: 'staff',
        statBonuses: { matk: 400 }, specialEffect: 'Reduces cast time of Burst skills by 50%.'
    },

    // Skills now come from job_skill_modules only - no longer from gacha
    // Skills are determined by the player's job, not by items
    // 'skill_heal': {... removed ...},

    // ============================================
    // JOB CORES (Examples)
    // ============================================
    'core_dark_knight': {
        id: 'core_dark_knight', name: 'Heart of the Abyss', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the secret Dark Knight evolution path for Knights.',
        unlocksJobId: 'dark_knight'
    },
    // Tier 3 Job Cores (Level 70+)
    'core_paladin': {
        id: 'core_paladin', name: 'Paladin Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the Paladin evolution path for Knights.',
        unlocksJobId: 'paladin'
    },
    'core_crusader': {
        id: 'core_crusader', name: 'Crusader Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the Crusader evolution path for Knights.',
        unlocksJobId: 'crusader'
    },
    'core_sage': {
        id: 'core_sage', name: 'Sage Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the Sage evolution path for Wizards.',
        unlocksJobId: 'sage'
    },
    'core_archmage': {
        id: 'core_archmage', name: 'Archmage Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the Archmage evolution path for Wizards.',
        unlocksJobId: 'archmage'
    },
    // Tier 4 Job Cores (Level 90+ Endgame)
    'core_arch_paladin': {
        id: 'core_arch_paladin', name: 'Arch Paladin Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the ultimate Arch Paladin evolution path.',
        unlocksJobId: 'arch_paladin'
    },
    'core_grand_archmage': {
        id: 'core_grand_archmage', name: 'Grand Archmage Core', type: 'job_core', rarity: 'legendary', version: 'v1.0',
        description: 'Unlocks the ultimate Grand Archmage evolution path.',
        unlocksJobId: 'grand_archmage'
    },

    // ============================================
    // SKILL FRAGMENTS (Crafting System)
    // ============================================
    // Common (3 pieces) - basic skills
    'frag_basic_attack': {
        id: 'frag_basic_attack', name: 'Fragmento: Ataque Básico', type: 'skill_fragment', rarity: 'common', version: 'v1.0',
        description: '3 piezas para crear Ataque Básico', pieceCount: 3, skillModuleId: 'basic_attack'
    },
    // Rare (5 pieces)
    'frag_shield_bash': {
        id: 'frag_shield_bash', name: 'Fragmento: Escudo Triturador', type: 'skill_fragment', rarity: 'rare', version: 'v1.0',
        description: '5 piezas para crear Escudo Triturador', pieceCount: 5, skillModuleId: 'shield_bash'
    },
    'frag_fire_strike': {
        id: 'frag_fire_strike', name: 'Fragmento: Golpe de Fuego', type: 'skill_fragment', rarity: 'rare', version: 'v1.0',
        description: '5 piezas para crear Golpe de Fuego', pieceCount: 5, skillModuleId: 'fire_strike'
    },
    'frag_healing_light': {
        id: 'frag_healing_light', name: 'Fragmento: Luz Curativa', type: 'skill_fragment', rarity: 'rare', version: 'v1.0',
        description: '5 piezas para crear Luz Curativa', pieceCount: 5, skillModuleId: 'healing_light'
    },
    'frag_ice_spike': {
        id: 'frag_ice_spike', name: 'Fragmento: Espada de Hielo', type: 'skill_fragment', rarity: 'rare', version: 'v1.0',
        description: '5 piezas para crear Espada de Hielo', pieceCount: 5, skillModuleId: 'ice_spike'
    },
    // Epic (8 pieces)
    'frag_holy_smite': {
        id: 'frag_holy_smite', name: 'Fragmento: Santuario', type: 'skill_fragment', rarity: 'epic', version: 'v1.0',
        description: '8 piezas para crear Santuario', pieceCount: 8, skillModuleId: 'holy_smite'
    },
    'frag_thunder': {
        id: 'frag_thunder', name: 'Fragmento: Trueno', type: 'skill_fragment', rarity: 'epic', version: 'v1.0',
        description: '8 piezas para crear Trueno', pieceCount: 8, skillModuleId: 'thunder'
    },
    'frag_chain_lightning': {
        id: 'frag_chain_lightning', name: 'Fragmento: Cadena de Rayos', type: 'skill_fragment', rarity: 'epic', version: 'v1.0',
        description: '8 piezas para crear Cadena de Rayos', pieceCount: 8, skillModuleId: 'chain_lightning'
    },
    'frag_berserk': {
        id: 'frag_berserk', name: 'Fragmento: Berserker', type: 'skill_fragment', rarity: 'epic', version: 'v1.0',
        description: '8 piezas para crear Berserker', pieceCount: 8, skillModuleId: 'berserk'
    },
    'frag_vampire_bite': {
        id: 'frag_vampire_bite', name: 'Fragmento: Mordida de Vampiro', type: 'skill_fragment', rarity: 'epic', version: 'v1.0',
        description: '8 piezas para crear Mordida de Vampiro', pieceCount: 8, skillModuleId: 'vampire_bite'
    },
    // Legendary (12 pieces)
    'frag_meteor': {
        id: 'frag_meteor', name: 'Fragmento: Meteorito', type: 'skill_fragment', rarity: 'legendary', version: 'v1.0',
        description: '12 piezas para crear Meteorito', pieceCount: 12, skillModuleId: 'meteor'
    },
    'frag_focus_shot': {
        id: 'frag_focus_shot', name: 'Fragmento: Tiro Focus', type: 'skill_fragment', rarity: 'legendary', version: 'v1.0',
        description: '12 piezas para crear Tiro Focus', pieceCount: 12, skillModuleId: 'focus_shot'
    },
    'frag_assassinate': {
        id: 'frag_assassinate', name: 'Fragmento: Asesina', type: 'skill_fragment', rarity: 'legendary', version: 'v1.0',
        description: '12 piezas para crear Asesina', pieceCount: 12, skillModuleId: 'assassinate'
    }
};

// Help lists for logic filtering
export const GACHA_ITEMS = Object.values(GACHA_DATABASE);
