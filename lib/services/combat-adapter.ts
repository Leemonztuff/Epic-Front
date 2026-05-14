import { supabase } from '../supabase';
import { UnitService } from './unit-service';
import { CombatUnit, SkillDefinition, StatKey } from '../types/combat';
import { MAX_GACHA_SKILLS, MAX_JOB_SKILLS } from '../rpg-system/types';
import { ENEMY_SKILL_DEFINITIONS } from '../rpg-system/enemy-skills';
import { AssetService } from './asset-service';

export class CombatAdapter {
  static async dbUnitToCombatUnit(
    unitId: string,
    side: 'player' | 'enemy',
    position: number
  ): Promise<CombatUnit> {
    const details = await UnitService.getUnitDetails(unitId);
    const stats = {
      hp: details.finalStats.hp,
      atk: details.finalStats.atk,
      def: details.finalStats.def,
      matk: details.finalStats.matk,
      mdef: details.finalStats.mdef,
      agi: details.finalStats.agi,
    };
    const jobSkills: SkillDefinition[] = (details.job.skills_unlocked || [])
      .slice(0, MAX_JOB_SKILLS)
      .map((s: any, idx: number) => ({
        id: s.id || s.skill_id || `job_skill_${idx}`,
        name: s.name || 'Habilidad de Clase',
        skillType: (s.type === 'ultimate' || s.type === 'burst') ? 'bb' : 'normal',
        type: (s.type === 'ultimate' || s.type === 'burst') ? 'burst' : 'active',
        cooldown: s.cooldown || 0,
        effects: s.effects || [{
          type: 'damage',
          scaling: details.unit.affinity === 'magic' ? 'matk' : 'atk',
          power: s.powerMod || 1.0,
          target: 'enemy'
        }],
        description: s.description
      }));
    const gachaSkills: SkillDefinition[] = (details.equipment?.skills || [])
      .slice(0, MAX_GACHA_SKILLS)
      .map((s: any, idx: number) => ({
        id: s.id || s.item_id || `gacha_skill_${idx}`,
        name: s.name || 'Habilidad',
        skillType: s.skillType === 'burst' ? 'bb' : 'normal',
        type: s.skillType === 'burst' ? 'burst' : 'active',
        cooldown: s.cooldown || 0,
        effects: s.effects || [{
          type: 'damage',
          scaling: s.scaling?.stat || 'atk',
          power: s.scaling?.multiplier || 1.0,
          target: 'enemy'
        }],
        description: s.description
      }));
    const skills = [...jobSkills, ...gachaSkills];
    if (skills.length === 0) {
      skills.push({
        id: 'basic_attack',
        name: 'Ataque Básico',
        type: 'active',
        cooldown: 0,
        effects: [{ type: 'damage', scaling: 'atk', power: 1.0, target: 'enemy' }]
      });
    }
    const unitElement = (((details.finalStats as any).elements)?.[0] as any) || 'none';
    return {
      id: unitId,
      instanceId: unitId,
      name: details.unit.name,
      side,
      position,
      row: position < 3 ? 'front' : 'back',
      element: unitElement,
      stats,
      currentHp: stats.hp,
      maxHp: stats.hp,
      burst: 0,
      bbUses: 0,
      bbLevel: 1,
      hasUsedUBB: false,
      skills,
      cooldowns: {},
      statusEffects: [],
      spriteId: details.unit.sprite_id,
      iconId: details.unit.icon_id,
      jobId: details.unit.current_job_id,
      isDead: false,
      isStunned: false,
      isTaunting: false,
      sprite_id: details.unit.sprite_id,
      icon_id: details.unit.icon_id,
      level: details.unit.level || 1,
    };
  }

  static createFromUnit(unit: any, position: number): CombatUnit {
    const stats = {
      hp: unit.base_stats?.hp || unit.baseStats?.hp || 100,
      atk: unit.base_stats?.atk || unit.baseStats?.atk || 10,
      def: unit.base_stats?.def || unit.baseStats?.def || 10,
      matk: unit.base_stats?.matk || unit.baseStats?.matk || 10,
      mdef: unit.base_stats?.mdef || unit.baseStats?.mdef || 10,
      agi: unit.base_stats?.agi || unit.baseStats?.agi || 10,
    };
    return {
      id: unit.id || `u-${position}`,
      instanceId: unit.id || `u-${position}`,
      name: unit.name || 'Héroe',
      side: 'player',
      position,
      row: position < 3 ? 'front' : 'back',
      element: unit.element || 'none',
      stats,
      currentHp: stats.hp,
      maxHp: stats.hp,
      burst: 0,
      bbUses: 0,
      bbLevel: 1,
      hasUsedUBB: false,
      skills: unit.skills || [{ id: 'basic_attack', name: 'Ataque Básico', type: 'active', skillType: 'normal', cooldown: 0, effects: [{ type: 'damage', scaling: 'atk', power: 1.0, target: 'enemy' }] }],
      cooldowns: {},
      statusEffects: [],
      spriteId: unit.sprite_id || unit.spriteId,
      iconId: unit.icon_id || unit.iconId,
      jobId: unit.current_job_id || unit.currentJobId,
      isDead: false,
      isStunned: false,
      isTaunting: false,
      level: unit.level || 1,
    };
  }

  static createEnemy(id: string, name: string, level: number, position: number, skillIds: string[] = [], element: string = 'none'): CombatUnit {
    const base_stats = {
      hp: Math.floor(60 + (level * 12)),
      atk: Math.floor(6 + (level * 1.5)),
      def: Math.floor(4 + (level * 1.2)),
      matk: Math.floor(4 + (level * 1.2)),
      mdef: Math.floor(4 + (level * 1.2)),
      agi: Math.floor(4 + (level * 0.8))
    };

    const skills: SkillDefinition[] = (skillIds || []).map(sid => ENEMY_SKILL_DEFINITIONS[sid]).filter(Boolean);
    if (skills.length === 0) {
      skills.push(ENEMY_SKILL_DEFINITIONS['basic_attack']);
    }

    return {
      id,
      instanceId: id,
      name,
      side: 'enemy',
      position,
      row: position < 3 ? 'front' : 'back',
      element: element as any,
      stats: base_stats,
      currentHp: base_stats.hp,
      maxHp: base_stats.hp,
      burst: 0,
      bbUses: 0,
      bbLevel: 1,
      hasUsedUBB: false,
      skills,
      cooldowns: {},
      statusEffects: [],
      isDead: false,
      isStunned: false,
      isTaunting: false,
      level,
      sprite_id: AssetService.getRandomSpriteId('melee'),
      icon_id: AssetService.getJobIconId('swordman')
    };
  }
}
