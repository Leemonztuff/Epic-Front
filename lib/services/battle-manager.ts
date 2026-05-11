import { CombatUnit, CombatState, SkillDefinition, SkillEffect, TargetType } from '../types/combat';
import { EffectEngine } from './effect-engine';
import { executeSkillWithModule, updateUnitStartTurnWithStatus, loadSkillModuleCached } from './skill-integration';
import type { EffectResult } from './effect-engine';
import { BattleService, BattleBet } from './battle-service';

export type BetLevel = 'safe' | 'balanced' | 'all-in';

export interface TurnBet {
  bet: BattleBet;
  energyCost: number;
}

export class BattleManager {
  /**
   * Calculates the turn order based on Agility (agi).
   * Units with higher agi go first.
   */
  static getTurnOrder(units: CombatUnit[]): CombatUnit[] {
    return [...units]
      .filter(u => !u.isDead)
      .sort((a, b) => b.stats.agi - a.stats.agi);
  }

  static getBetOptions(): { id: BetLevel; label: string; energyCost: number; damageMult: number; critChance: number; description: string }[] {
    return [
      { id: 'safe', label: '⚔️ Normal', energyCost: 0, damageMult: 1.0, critChance: 0, description: 'Daño estándar, sin riesgo' },
      { id: 'balanced', label: '🔥 Apostar 1', energyCost: 1, damageMult: 1.3, critChance: 0.1, description: '+30% daño, 10% crit' },
      { id: 'all-in', label: '💀 Todo o Nada', energyCost: 2, damageMult: 1.8, critChance: 0.25, description: '+80% daño, 25% crit' },
    ];
  }

  /**
   * Finds the best target(s) based on the targeting rules.
   * Logic:
   * 1. Check for Taunt (global)
   * 2. Target must pass Front Row if they are targeting Back Row (unless Ranged/Magic)
   */
  static getTargets(
    actor: CombatUnit,
    skill: SkillDefinition,
    allUnits: CombatUnit[],
    manualTargetId?: string
  ): CombatUnit[] {
    const enemies = allUnits.filter(u => u.side !== actor.side && !u.isDead);
    const allies = allUnits.filter(u => u.side === actor.side && !u.isDead);

    // Primary target logic for single target effects
    const getPrimaryEnemy = () => {
      // 1. Manual override
      if (manualTargetId) {
        const manual = enemies.find(e => e.id === manualTargetId);
        if (manual) return manual;
      }

      // 2. Check for Taunt
      const taunters = enemies.filter(e => e.statusEffects.some(s => s.id === 'taunt'));
      if (taunters.length > 0) {
        return taunters[Math.floor(Math.random() * taunters.length)];
      }

      // 3. Row logic: Back row units can only be targeted if front row is empty
      // EXCEPT if the skill is ranged/magic or the actor is ranged.
      // (For this BF-style demo, let's keep it simple: Front Row is priority for Melee)
      const frontRow = enemies.filter(e => e.row === 'front');
      const targetPool = frontRow.length > 0 ? frontRow : enemies;

      // 4. Fallback: Lowest HP%
      return [...targetPool].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
    };

    const firstEffect = skill.effects[0];
    if (!firstEffect) return [];

    switch (firstEffect.target) {
      case 'self':
        return [actor];
      case 'enemy':
      case 'random_enemy':
        const target = getPrimaryEnemy();
        return target ? [target] : [];
      case 'all_enemies':
        return enemies;
      case 'all_allies':
        return allies;
      case 'ally':
        return allies.filter(a => a.id !== actor.id).slice(0, 1);
      default:
        return [];
    }
  }

  /**
   * Processes a full turn for a unit using a specific skill.
   * When isBurst is true, applies 1.5x damage multiplier and resets burst to 0.
   * bet applies risk/reward: higher energy wager = more damage + crit chance
   */
  static executeTurn(
    actor: CombatUnit,
    skill: SkillDefinition,
    allUnits: CombatUnit[],
    manualTargetId?: string,
    isBurst: boolean = false,
    bet?: BattleBet
  ): { results: EffectResult[], updatedUnits: CombatUnit[], bonusExp: number } {
    const targets = this.getTargets(actor, skill, allUnits, manualTargetId);
    const results = EffectEngine.processSkill(skill, actor, targets);

    const totalBonusExp = 0;

    // Create a new state of units based on results
    let updatedUnits = allUnits.map(u => ({
      ...u,
      statusEffects: [...u.statusEffects],
      cooldowns: { ...u.cooldowns }
    }));

    const actorInState = updatedUnits.find(u => u.id === actor.id);

    // Set cooldown
    if (actorInState && skill.cooldown > 0) {
      actorInState.cooldowns[skill.id] = skill.cooldown;
    }

    // Apply burst effect: 1.5x damage multiplier, reset burst to 0
    if (isBurst && actorInState) {
      actorInState.burst = 0;
    }

    let bonusExp = 0;

    for (const result of results) {
      const target = updatedUnits.find(u => u.id === result.targetId);
      if (!target) continue;

      // Apply bet multiplier to damage (risk/reward system)
      if (bet && result.type === 'damage' && result.value) {
        result.value = Math.floor(result.value * bet.multiplier);

        // Crit check for bet
        if (Math.random() < bet.critChance) {
          result.value *= 2;
          result.isCrit = true;
          bonusExp += Math.floor(result.value * 0.1);
        }
      }

      // Apply burst damage multiplier
      if (isBurst && result.type === 'damage' && result.value) {
        result.value = Math.floor(result.value * 1.5);
      }

      if (result.type === 'damage' && result.value) {
        target.currentHp = Math.max(0, target.currentHp - result.value);
        if (target.currentHp <= 0) {
          target.isDead = true;
          bonusExp += 20;
        }

        // Burst Charging: Damage dealt adds 10%, damage taken adds 5%
        if (actorInState) actorInState.burst = Math.min(100, actorInState.burst + 10);
        target.burst = Math.min(100, target.burst + 5);
      } else if (result.type === 'heal' && result.value) {
        target.currentHp = Math.min(target.maxHp, target.currentHp + result.value);
      } else if (result.status) {
        if (result.type === 'taunt') {
           if (actorInState) {
             actorInState.statusEffects.push(result.status);
             actorInState.isTaunting = true;
           }
        } else {
           target.statusEffects.push(result.status);
        }
      }
    }

    // Flat turn gain (only if not burst, burst already resets to 0)
    if (!isBurst && actorInState) actorInState.burst = Math.min(100, actorInState.burst + 5);

    return { results, updatedUnits, bonusExp };
  }

  /**
   * Calculates spark damage multiplier.
   * sparkCount = number of player units that hit the same target this round.
   * Formula: 1 + (sparkCount - 1) * 0.05 per extra hit (5% per spark).
   */
  static calculateSparkBonus(sparkCount: number): number {
    if (sparkCount <= 1) return 1;
    return 1 + (sparkCount - 1) * 0.05;
  }

  /**
   * Normal attack: deals damage and generates BB gauge (BC) for all alive player units.
   * sparkCount = number of sparks accumulated this round for bonus damage.
   */
  static executeNormalAttack(
    actor: CombatUnit,
    skill: SkillDefinition,
    allUnits: CombatUnit[],
    manualTargetId?: string,
    bet?: BattleBet,
    sparkCount: number = 0
  ): { results: EffectResult[], updatedUnits: CombatUnit[], bonusExp: number } {
    const result = this.executeTurn(actor, skill, allUnits, manualTargetId, false, bet);

    // Apply spark bonus to damage results
    const sparkMult = this.calculateSparkBonus(sparkCount);
    if (sparkMult > 1) {
      result.results.forEach(r => {
        if (r.type === 'damage' && r.value) {
          r.value = Math.floor(r.value * sparkMult);
          r.isSpark = true;
          r.sparkCount = sparkCount;
        }
      });
    }

    const bcGain = 15;

    const updatedUnits = result.updatedUnits.map(u => {
      if (u.side === 'player' && !u.isDead) {
        return { ...u, burst: Math.min(100, u.burst + bcGain) };
      }
      return u;
    });

    return { ...result, updatedUnits };
  }

  /**
   * Returns the appropriate burst skill definition based on the unit's bbLevel.
   */
  static getBurstSkillForUnit(unit: CombatUnit): SkillDefinition {
    const bbMultiplier = unit.bbLevel >= 3 ? 3.0 : unit.bbLevel >= 2 ? 2.0 : 1.5;
    const targetAll = unit.bbLevel >= 2;
    const name = unit.bbLevel >= 3 ? 'Ultimate Brave Burst' : unit.bbLevel >= 2 ? 'Super Brave Burst' : 'Brave Burst';
    const id = unit.bbLevel >= 3 ? 'ubb' : unit.bbLevel >= 2 ? 'sbb' : 'bb';

    const effects: SkillEffect[] = [
      { type: 'damage', scaling: 'atk', power: bbMultiplier, target: targetAll ? 'all_enemies' : 'enemy' },
    ];

    if (unit.bbLevel >= 2) {
      effects.push({ type: 'buff', target: 'self', status: 'atk_up', scaling: 'atk', power: 1.2, duration: 3 });
    }

    return {
      id,
      name,
      skillType: unit.bbLevel >= 3 ? 'ubb' : unit.bbLevel >= 2 ? 'sbb' : 'bb',
      type: 'burst',
      cooldown: 0,
      effects,
    };
  }

  /**
   * Brave Burst: consumes gauge, applies damage, increments bbUses.
   * Scales with bbLevel: BB=1.5x single, SBB=2x AOE+buff, UBB=3x AOE+buff+ally burst fill.
   */
  static executeBurstSkill(
    actor: CombatUnit,
    skill: SkillDefinition,
    allUnits: CombatUnit[],
    manualTargetId?: string,
    bet?: BattleBet
  ): { results: EffectResult[], updatedUnits: CombatUnit[], bonusExp: number } {
    const isUBB = actor.bbLevel >= 3 && !actor.hasUsedUBB;
    const result = this.executeTurn(actor, skill, allUnits, manualTargetId, true, bet);

    const updatedUnits = result.updatedUnits.map(u => {
      if (u.id === actor.id) {
        return { ...u, bbUses: u.bbUses + 1, hasUsedUBB: isUBB ? true : u.hasUsedUBB };
      }
      if (isUBB && u.side === 'player' && !u.isDead) {
        return { ...u, burst: Math.min(100, u.burst + 50) };
      }
      return u;
    });

    return { ...result, updatedUnits };
  }

/**
    * Updates status effects and cooldowns for a unit.
    */
  static updateUnitStartTurn(unit: CombatUnit): CombatUnit {
    return updateUnitStartTurnWithStatus(unit);
  }

  /**
   * Executes turn using the modular skill system (skill_modules).
   * Falls back to legacy system if skill not found in DB.
   */
  static async executeTurnWithModules(
    actor: CombatUnit,
    skill: SkillDefinition,
    allUnits: CombatUnit[],
    manualTargetId?: string,
    isBurst: boolean = false
  ): Promise<{ results: EffectResult[], updatedUnits: CombatUnit[] }> {
    const targets = this.getTargets(actor, skill, allUnits, manualTargetId);

    const moduleData = await loadSkillModuleCached(skill.id);
    if (moduleData) {
      const result = await executeSkillWithModule(skill.id, actor, targets, allUnits, isBurst);
      return { 
        results: result.results as EffectResult[], 
        updatedUnits: result.updatedUnits 
      };
    }

    return this.executeTurn(actor, skill, allUnits, manualTargetId, isBurst);
  }
}
