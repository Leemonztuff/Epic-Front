import { CombatUnit, SkillEffect, StatusEffect, StatKey, EffectType, SkillDefinition, Element } from '../types/combat';
import { calculateElementalBonus } from './build-calculator';

export interface EffectResult {
  targetId: string;
  type: EffectType | 'apply_status_fail' | 'none';
  value?: number;
  status?: StatusEffect;
  log: string;
  isCrit?: boolean;
  isSpark?: boolean;
  sparkCount?: number;
  elementMultiplier?: number;
  isEffective?: boolean;
  isResisted?: boolean;
}

export class EffectEngine {
  /**
   * Processes all effects of a skill sequentially.
   */
  static processSkill(
    skill: SkillDefinition,
    source: CombatUnit,
    targets: CombatUnit[]
  ): EffectResult[] {
    const results: EffectResult[] = [];

    for (const effect of skill.effects) {
      // Determine targets for this specific effect
      const effectTargets = this.getTargetsForEffect(effect, source, targets);

      for (const target of effectTargets) {
        const result = this.processEffect(effect, source, target);
        results.push(result);
      }
    }

    return results;
  }

  private static getTargetsForEffect(
    effect: SkillEffect,
    source: CombatUnit,
    potentialTargets: CombatUnit[]
  ): CombatUnit[] {
    switch (effect.target) {
      case 'self':
        return [source];
      case 'enemy':
      case 'random_enemy':
        // For simplicity, if multiple targets provided, we pick the first one or a random one
        // In a real battle, the target would be selected by targeting logic before this
        return potentialTargets.length > 0 ? [potentialTargets[0]] : [];
      case 'all_enemies':
        return potentialTargets.filter(u => u.side !== source.side);
      case 'all_allies':
        return potentialTargets.filter(u => u.side === source.side);
      case 'ally':
        return potentialTargets.filter(u => u.side === source.side && u.id !== source.id).slice(0, 1);
      default:
        return [];
    }
  }

  static processEffect(
    effect: SkillEffect,
    source: CombatUnit,
    target: CombatUnit
  ): EffectResult {
    switch (effect.type) {
      case 'damage':
        return this.handleDamage(effect, source, target);
      case 'heal':
        return this.handleHeal(effect, source, target);
      case 'dot':
      case 'buff':
      case 'debuff':
      case 'apply_status':
        return this.handleStatusEffect(effect, source, target);
      case 'taunt':
        return this.handleTaunt(effect, source, target);
      default:
        return {
          targetId: target.id,
          type: 'none',
          log: `No se reconoce el efecto ${effect.type}`
        };
    }
  }

  private static handleDamage(
    effect: SkillEffect,
    source: CombatUnit,
    target: CombatUnit
  ): EffectResult {
    const scalingStat: StatKey = effect.scaling || 'atk';
    const attackerStat = source.stats[scalingStat] || 0;
    const power = effect.power || 1.0;

    const defenseStat: StatKey = scalingStat === 'matk' ? 'mdef' : 'def';
    const defenderDef = target.stats[defenseStat] || 0;

    // Formula: damage = atk * skillPower * (100 / (100 + def))
    let damage = Math.floor(
      attackerStat * power * (100 / (100 + defenderDef))
    );

    // Elemental bonus
    let elementMultiplier = 1;
    if (source.element !== 'none') {
      elementMultiplier = calculateElementalBonus(source.element, [target.element]);
    }
    damage = Math.floor(damage * elementMultiplier);

    const finalDamage = Math.max(1, damage);

    return {
      targetId: target.id,
      type: 'damage',
      value: finalDamage,
      elementMultiplier,
      isEffective: elementMultiplier > 1,
      isResisted: elementMultiplier < 1,
      log: `${source.name} inflige ${finalDamage} de daño a ${target.name}.${elementMultiplier !== 1 ? ` (x${elementMultiplier.toFixed(1)} elemento)` : ''}`
    };
  }

  private static handleHeal(
    effect: SkillEffect,
    source: CombatUnit,
    target: CombatUnit
  ): EffectResult {
    const scalingStat: StatKey = effect.scaling || 'matk';
    const statValue = source.stats[scalingStat] || 0;
    const power = effect.power || 1.0;

    const healAmount = Math.floor(statValue * power);

    return {
      targetId: target.id,
      type: 'heal',
      value: healAmount,
      log: `${source.name} sana a ${target.name} por ${healAmount} HP.`
    };
  }

  private static handleStatusEffect(
    effect: SkillEffect,
    source: CombatUnit,
    target: CombatUnit
  ): EffectResult {
    if (effect.chance && Math.random() > effect.chance) {
      return {
        targetId: target.id,
        type: 'apply_status_fail',
        log: `${target.name} resistió el efecto ${effect.status || effect.type}.`
      };
    }

    const duration = effect.duration || 3;
    const statusType = (effect.type === 'apply_status' ? 'buff' : effect.type) as 'buff' | 'debuff' | 'dot';

    const status: StatusEffect = {
      id: effect.status || `${effect.type}_${Date.now()}`,
      name: effect.status || effect.type,
      type: statusType,
      stat: effect.scaling,
      multiplier: effect.power,
      flatBonus: effect.value,
      duration: duration,
      remainingTurns: duration,
      appliedById: source.id
    };

    return {
      targetId: target.id,
      type: effect.type,
      status,
      log: `${target.name} es afectado por ${status.name} (${duration} turnos).`
    };
  }

  private static handleTaunt(
    effect: SkillEffect,
    source: CombatUnit,
    target: CombatUnit
  ): EffectResult {
    const duration = effect.duration || 2;
    const status: StatusEffect = {
      id: 'taunt',
      name: 'Provocación',
      type: 'buff',
      duration: duration,
      remainingTurns: duration,
      appliedById: source.id
    };

    return {
      targetId: source.id,
      type: 'taunt',
      status,
      log: `${source.name} está provocando a los enemigos.`
    };
  }
}
