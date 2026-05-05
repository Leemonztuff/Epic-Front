import { BaseStats, WeaponCategory } from './types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GachaItemType = 'card' | 'weapon' | 'job_core' | 'skill_fragment' | 'cosmetic';

export interface BaseGachaItem {
    id: string;
    name: string;
    description: string;
    type: GachaItemType;
    rarity: Rarity;
    version: string;
}

// ==== CARDS ====
export type CardEffectType = 'statBoost' | 'conditionalEffect' | 'skillModifier';
export interface CardItem extends BaseGachaItem {
    type: 'card';
    effectType: CardEffectType;
    effectTarget: string; // e.g., 'atk', 'hp', 'bleed_chance', 'crit_rate'
    effectValue: number; // e.g., 0.20 for +20%
    applicableJobs: string[]; // e.g., ['swordman', 'knight'] or ['ALL']
}

// ==== WEAPONS ====
export interface WeaponItem extends BaseGachaItem {
    type: 'weapon';
    weaponCategory: WeaponCategory;
    statBonuses: Partial<BaseStats>;
    specialEffect?: string; // Optional unique passive modifier
}

// Skills now come from job_skill_modules only - not from gacha/inventory
// SkillItem kept for legacy reference but not used
// export interface SkillItem extends BaseGachaItem { ... }

// ==== JOB CORES ====
export interface JobCoreItem extends BaseGachaItem {
    type: 'job_core';
    unlocksJobId: string;
}

// ==== SKILL FRAGMENTS (Crafting) ====
export interface SkillFragmentItem extends BaseGachaItem {
    type: 'skill_fragment';
    pieceCount: number;
    skillModuleId: string;
}

export type AnyGachaItem = CardItem | WeaponItem | JobCoreItem | SkillFragmentItem;
export interface GachaState {
    player_id: string;
    pulls_since_epic: number;
    pulls_since_legendary: number;
    last_pull_at: string;
}
