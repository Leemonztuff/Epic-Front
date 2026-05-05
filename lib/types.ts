export type ItemType = 'weapon' | 'armor' | 'accessory' | 'card' | 'material' | 'job_core' | 'consumable' | 'skill_fragment' | 'learned_skill';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  sprite: { col: number; row: number; className?: string };
  rarity: string; // Changed to string (C, UC, R, SR, SSR, UR)
  stats?: { hp: number; atk: number; def: number; rec: number };
  description: string;
  effects?: string[];
  quantity?: number;
}

export interface Card extends Item {
  type: 'card';
  artUrl?: string;
  passiveBonus: { hp?: number; atk?: number; def?: number; rec?: number };
}

export interface Material extends Item {
  type: 'material';
}

export interface CharacterSkill {
  id: string;
  type: string;
  title: string;
  description: string;
  cost?: number | string;
  iconType?: string;
  level: number;
  maxLevel: number;
  upgradeCost: number;
}

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  element: 'Water' | 'Fire' | 'Earth' | 'Dark' | 'Thunder';
  rarity: string;
  level: number;
  maxLevel: number;
  exp: number;
  maxExp: number;
  cost: number;
  baseStats: { hp: number; atk: number; def: number; rec: number };
  spriteUrl: string;
  cssFilter: string;
  skills: CharacterSkill[];
  energy?: number;
  maxEnergy?: number;
}

export type CharEquipment = { 
  weapon: Item | null; 
  armor: Item | null; 
  accessory: Item | null;
  card: Card | null;
};
