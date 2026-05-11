export type StatKey = 'hp' | 'atk' | 'def' | 'matk' | 'mdef' | 'agi';
export type Affinity = 'physical' | 'magic' | 'support' | 'ranged';
export type EffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'dot' | 'taunt' | 'shield' | 'apply_status';
export type TargetType = 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_allies' | 'random_enemy';
export type Element = 'none' | 'fire' | 'water' | 'earth' | 'thunder' | 'light' | 'dark';
export type SkillType = 'normal' | 'bb' | 'sbb' | 'ubb';

export interface SkillEffect {
  type: EffectType;
  scaling?: StatKey;
  power?: number;
  target: TargetType;
  status?: string;
  chance?: number;
  duration?: number;
  value?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  skillType?: SkillType;
  type: 'active' | 'passive' | 'burst';
  cooldown: number;
  effects: SkillEffect[];
  description?: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'dot';
  stat?: StatKey;
  multiplier?: number;
  flatBonus?: number;
  duration: number;
  remainingTurns: number;
  appliedById: string;
}

export interface CombatUnit {
  id: string;
  instanceId: string;
  name: string;
  side: 'player' | 'enemy';
  position: number;
  row: 'front' | 'back';
  element: Element;
  stats: Record<StatKey, number>;
  currentHp: number;
  maxHp: number;
  burst: number;
  skills: SkillDefinition[];
  bbUses: number;
  bbLevel: 1 | 2 | 3;
  hasUsedUBB: boolean;
  cooldowns: Record<string, number>;
  statusEffects: StatusEffect[];
  spriteId?: string;
  iconId?: string;
  jobId?: string;
  isDead: boolean;
  isStunned: boolean;
  isTaunting: boolean;
  sprite_id?: string;
  icon_id?: string;
  modifierIds?: string[];
}

export interface CombatState {
  turn: number;
  round: number;
  units: CombatUnit[];
  activeUnitId: string | null;
  log: string[];
  isBattleOver: boolean;
  winner: 'player' | 'enemy' | null;
}
