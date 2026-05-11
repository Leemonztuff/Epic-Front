import { CombatUnit, SkillDefinition } from '../types/combat';
import { EffectResult, EffectExecutionContext } from './skill-engine';
import { 
  Skill, 
  SkillEffect, 
  resolveSkill as resolveSkillEvent,
  resolveSkill,
  applyModifiers,
  loadSkillModule,
  loadModifiers,
  Modifier,
  AppliedModifiers,
  StatusSystem,
  EventType
} from './skill-engine';

const skillCache: Map<string, { skill: Skill; effects: SkillEffect[] }> = new Map();
const modifiersCache: Map<string, Modifier> = new Map();

export async function loadSkillModuleCached(skillId: string): Promise<{ skill: Skill; effects: SkillEffect[] } | null> {
  if (skillCache.has(skillId)) {
    return skillCache.get(skillId)!;
  }
  const loaded = await loadSkillModule(skillId);
  if (loaded) {
    skillCache.set(skillId, loaded);
  }
  return loaded;
}

export async function loadModifiersCached(modifierIds: string[]): Promise<Modifier[]> {
  const missing = modifierIds.filter(id => !modifiersCache.has(id));
  if (missing.length > 0) {
    const loaded = await loadModifiers(missing);
    for (const mod of loaded) {
      modifiersCache.set(mod.id, mod);
    }
  }
  return modifierIds.map(id => modifiersCache.get(id)).filter(Boolean) as Modifier[];
}

function convertSkillModuleToSkillDefinition(skillModule: Skill): SkillDefinition {
  return {
    id: skillModule.id,
    name: skillModule.name,
    type: 'active',
    cooldown: skillModule.cooldown,
    description: skillModule.description,
    effects: []
  };
}

export async function resolveSkillModule(
  skillId: string,
  source: CombatUnit,
  targets: CombatUnit[],
  event: EventType,
  contextExtra?: Partial<EffectExecutionContext>
): Promise<EffectResult[]> {
  const skillData = await loadSkillModuleCached(skillId);
  if (!skillData) return [];

  const modifiers = source.modifierIds ? await loadModifiersCached(source.modifierIds) : [];
  const applied = applyModifiers(skillData.skill, modifiers);

  const results: EffectResult[] = [];

  for (const target of targets) {
    const isCrit = Math.random() * 100 < (source.stats.agi / 10);
    const killedTarget = target.currentHp <= 0;

    const context: EffectExecutionContext = {
      source,
      target,
      skill: skillData.skill,
      event,
      isCrit,
      killedTarget,
      previousEffects: [],
      executionOrder: 0,
      ...contextExtra
    };

    const eventResults = resolveSkillEvent(skillData.skill, skillData.effects, context, modifiers);
    results.push(...eventResults);
  }

  return results;
}

export async function executeSkillWithModule(
  skillId: string,
  source: CombatUnit,
  targets: CombatUnit[],
  allUnits: CombatUnit[],
  isBurst: boolean = false
): Promise<{ results: EffectResult[], updatedUnits: CombatUnit[] }> {
  const results: EffectResult[] = [];
  
  const baseDamageResults = await resolveSkillModule(skillId, source, targets, 'on_skill_use');
  results.push(...baseDamageResults);

  const updatedUnits = allUnits.map(u => ({
    ...u,
    statusEffects: [...u.statusEffects],
    cooldowns: { ...u.cooldowns }
  }));

  const actorInState = updatedUnits.find(u => u.id === source.id);

  if (actorInState) {
    const skillData = skillCache.get(skillId);
    if (skillData) {
      actorInState.cooldowns[skillId] = skillData.skill.cooldown;
    }
  }

  if (isBurst && actorInState) {
    actorInState.burst = 0;
  }

  for (const result of results) {
    const target = updatedUnits.find(u => u.id === result.targetId);
    if (!target) continue;

    if (isBurst && result.type === 'damage' && result.value) {
      result.value = Math.floor(result.value * 1.5);
    }

    if (result.type === 'damage' && result.value) {
      target.currentHp = Math.max(0, target.currentHp - result.value);
      if (target.currentHp <= 0) {
        target.isDead = true;
        resolveSkillModule(skillId, source, [target], 'on_kill').then(killResults => {
          for (const kr of killResults) {
            const killTarget = updatedUnits.find(u => u.id === kr.targetId);
            if (killTarget && kr.type === 'damage' && kr.value) {
              killTarget.currentHp = Math.max(0, killTarget.currentHp - kr.value);
            }
          }
        });
      }
      if (actorInState) actorInState.burst = Math.min(100, actorInState.burst + 10);
      target.burst = Math.min(100, target.burst + 5);
    } else if (result.type === 'heal' && result.value) {
      target.currentHp = Math.min(target.maxHp, target.currentHp + result.value);
    } else if (result.status) {
      target.statusEffects.push(result.status);
    }

    if (result.type === 'damage' && result.value && source) {
      resolveSkillModule(skillId, source, [target], 'on_hit').then(hitResults => {
        for (const hr of hitResults) {
          const hitTarget = updatedUnits.find(u => u.id === hr.targetId);
          if (hitTarget && hr.type === 'damage' && hr.value) {
            hitTarget.currentHp = Math.max(0, hitTarget.currentHp - hr.value);
          }
          if (hitTarget && hr.status) {
            hitTarget.statusEffects.push(hr.status);
          }
        }
      });

      if (result.value && Math.random() * 100 < (source.stats.agi / 10)) {
        resolveSkillModule(skillId, source, [target], 'on_crit').then(critResults => {
          for (const cr of critResults) {
            const critTarget = updatedUnits.find(u => u.id === cr.targetId);
            if (critTarget && cr.type === 'damage' && cr.value) {
              critTarget.currentHp = Math.max(0, critTarget.currentHp - cr.value);
            }
            if (critTarget && cr.status) {
              critTarget.statusEffects.push(cr.status);
            }
          }
        });
      }
    }
  }

  if (!isBurst && actorInState) {
    actorInState.burst = Math.min(100, actorInState.burst + 5);
  }

  return { results, updatedUnits };
}

export function updateUnitStartTurnWithStatus(unit: CombatUnit): CombatUnit {
  StatusSystem.tickDown(unit.id);

  const nextStatus = unit.statusEffects
    .map(s => ({ ...s, remainingTurns: s.remainingTurns - 1 }))
    .filter(s => s.remainingTurns > 0);

  const nextCooldowns = { ...unit.cooldowns };
  Object.keys(nextCooldowns).forEach(id => {
    nextCooldowns[id] = Math.max(0, nextCooldowns[id] - 1);
    if (nextCooldowns[id] === 0) delete nextCooldowns[id];
  });

  return {
    ...unit,
    statusEffects: nextStatus,
    cooldowns: nextCooldowns,
    isTaunting: nextStatus.some(s => s.id === 'taunt')
  };
}

export function setupUnitModifiers(unit: CombatUnit, modifierIds: string[]): CombatUnit {
  return {
    ...unit,
    modifierIds
  };
}

export async function preloadSkillModule(skillId: string): Promise<void> {
  await loadSkillModuleCached(skillId);
}

export function clearSkillCache(): void {
  skillCache.clear();
  modifiersCache.clear();
}

export interface UnitSkillBuild {
  skillIds: string[];
  modifierIds: string[];
}

export async function loadJobSkills(jobId: string): Promise<string[]> {
  const { supabase } = await import('../supabase');

  const { data, error } = await supabase
    .from('job_skill_modules')
    .select('skill_module_id')
    .eq('job_id', jobId)
    .order('slot_index', { ascending: true });

  if (error || !data) return [];
  return data.map(d => d.skill_module_id);
}

export async function loadGachaSkills(playerId: string): Promise<string[]> {
  const { supabase } = await import('../supabase');

  const { data: playerCards } = await supabase
    .from('player_cards')
    .select('card_id, is_equipped')
    .eq('player_id', playerId)
    .eq('is_equipped', true);

  if (!playerCards || playerCards.length === 0) return [];

  const { data: cards } = await supabase
    .from('cards')
    .select('effect_value')
    .in('id', playerCards.map(p => p.card_id));

  const skillIds: string[] = [];
  for (const card of cards || []) {
    if (card.effect_value?.linked_skill_module_id) {
      skillIds.push(card.effect_value.linked_skill_module_id);
    }
  }
  return skillIds;
}

export async function loadUnitSkillBuild(
  jobId: string,
  playerId: string
): Promise<UnitSkillBuild> {
  const [jobSkillIds, gachaSkillIds, gachaModifierIds] = await Promise.all([
    loadJobSkills(jobId),
    loadGachaSkills(playerId),
    loadGachaModifiers(playerId)
  ]);

  return {
    skillIds: [...jobSkillIds, ...gachaSkillIds],
    modifierIds: gachaModifierIds
  };
}

export async function loadGachaModifiers(playerId: string): Promise<string[]> {
  const { supabase } = await import('../supabase');

  const { data: playerCards } = await supabase
    .from('player_cards')
    .select('card_id, is_equipped')
    .eq('player_id', playerId)
    .eq('is_equipped', true);

  if (!playerCards || playerCards.length === 0) return [];

  const { data: cards } = await supabase
    .from('cards')
    .select('effect_value')
    .in('id', playerCards.map(p => p.card_id));

  const modifierIds: string[] = [];
  for (const card of cards || []) {
    if (card.effect_value?.linked_modifier_id) {
      modifierIds.push(card.effect_value.linked_modifier_id);
    }
  }
  return modifierIds;
}

export async function setupUnitWithSkillBuild(
  unit: CombatUnit,
  jobId: string,
  playerId: string,
  extraModifierIds: string[] = []
): Promise<CombatUnit> {
  const build = await loadUnitSkillBuild(jobId, playerId);
  
  for (const skillId of build.skillIds) {
    await preloadSkillModule(skillId);
  }

  const { data: playerCards } = await import('../supabase').then(async ({ supabase }) => {
    return await supabase
      .from('player_cards')
      .select('card_id, is_equipped')
      .eq('player_id', playerId)
      .eq('is_equipped', true);
  });

  const modifierIds: string[] = [...extraModifierIds];
  
  if (playerCards) {
    const cardIds = playerCards.map(p => p.card_id);
    const { data: cards } = await import('../supabase').then(async ({ supabase }) => {
      return await supabase
        .from('cards')
        .select('effect_value')
        .in('id', cardIds);
    });

    for (const card of cards || []) {
      if (card.effect_value?.linked_modifier_id) {
        modifierIds.push(card.effect_value.linked_modifier_id);
      }
    }
  }

  return {
    ...unit,
    skills: build.skillIds.map(id => ({
      id,
      name: 'Skill',
      type: 'active' as const,
      cooldown: 0,
      effects: []
    })),
    modifierIds
  };
}

export async function getSkillIdsForJob(jobId: string): Promise<string[]> {
  return loadJobSkills(jobId);
}

export interface CombatResult {
  totalDamage: number;
  turns: number;
  killed: boolean;
  logs: string[];
  combos: string[];
  statusApplied: string[];
}

export interface PlayerBuildData {
  jobId: string;
  playerId: string;
  skillModules: { skill: Skill; effects: SkillEffect[] }[];
  modifiers: Modifier[];
}

export async function loadPlayerBuild(
  jobId: string,
  playerId: string
): Promise<PlayerBuildData> {
  const build = await loadUnitSkillBuild(jobId, playerId);

  const skillModules: { skill: Skill; effects: SkillEffect[] }[] = [];
  for (const skillId of build.skillIds) {
    const skillData = await loadSkillModuleCached(skillId);
    if (skillData) {
      skillModules.push(skillData);
    }
  }

  const modifiers = await loadModifiersCached(build.modifierIds);

  return {
    jobId,
    playerId,
    skillModules,
    modifiers
  };
}

export async function executePlayerCombat(
  build: PlayerBuildData,
  attacker: CombatUnit,
  target: CombatUnit,
  maxTurns: number = 20
): Promise<CombatResult> {
  const result: CombatResult = {
    totalDamage: 0,
    turns: 0,
    killed: false,
    logs: [],
    combos: [],
    statusApplied: []
  };

  let currentAttacker = { ...attacker };
  let currentTarget = { ...target };
  const applied = applyModifiers(
    { id: 'build', name: 'Player Build', description: '', basePower: 0, cooldown: 0, tags: build.skillModules.flatMap(s => s.skill.tags) },
    build.modifiers
  );

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (currentTarget.isDead) {
      result.killed = true;
      break;
    }

    const skillData = build.skillModules[Math.floor(Math.random() * build.skillModules.length)];
    if (!skillData) break;

    const skill = skillData.skill;
    const effects = skillData.effects;
    const isCrit = Math.random() * 100 < (currentAttacker.stats.agi / 10 + applied.critChanceBonus);
    const event: EventType = isCrit ? 'on_crit' : 'on_hit';

    const context: EffectExecutionContext = {
      source: currentAttacker,
      target: currentTarget,
      skill,
      event,
      isCrit,
      killedTarget: false,
      previousEffects: [],
      executionOrder: 0
    };

    const eventResults = resolveSkill(skill, effects, context, build.modifiers);

    let turnDamage = 0;
    for (const r of eventResults) {
      result.logs.push(`[${turn}] ${event} → ${r.log}`);

      if (r.status) {
        const statusKey = `${r.status.name} (${r.status.duration}t)`;
        if (!result.statusApplied.includes(statusKey)) {
          result.statusApplied.push(statusKey);
        }
        if (r.status.name === 'burn') {
          result.combos.push(`🔥 Burn: ${r.status.duration}t`);
        } else if (r.status.name === 'poison') {
          result.combos.push(`🧪 Poison: ${r.status.duration}t`);
        }
      }

      if (r.value && (r.type === 'explode' || r.type === 'damage_per_stack' || r.type === 'consume_status')) {
        turnDamage += r.value;
        currentTarget.currentHp = Math.max(0, currentTarget.currentHp - r.value);
        if (r.type === 'explode') {
          result.combos.push(`💥 EXPLODE: ${r.value} dmg`);
        }
      }
    }

    if (currentTarget.currentHp <= 0) {
      currentTarget.isDead = true;
      result.killed = true;

      const killContext: EffectExecutionContext = {
        ...context,
        event: 'on_kill',
        killedTarget: true
      };
      const killResults = resolveSkill(skill, effects, killContext, build.modifiers);
      for (const kr of killResults) {
        if (kr.value) {
          result.logs.push(`[${turn}] on_kill → ${kr.log}`);
          turnDamage += kr.value;
          result.combos.push(`💀 ON_KILL: ${kr.value} dmg`);
        }
      }
    }

    result.totalDamage += turnDamage;
    result.turns = turn;
    currentAttacker.currentHp = attacker.currentHp;
    currentTarget.currentHp = currentTarget.currentHp;
  }

  return result;
}

export async function runCombatFromDatabase(
  jobId: string,
  playerId: string,
  attackerStats: { atk: number; agi: number; def: number },
  targetHp: number
): Promise<CombatResult> {
  const build = await loadPlayerBuild(jobId, playerId);

  const attacker: CombatUnit = {
    id: 'player',
    instanceId: 'player-instance',
    name: 'Player',
    side: 'player',
    position: 1,
    row: 'front',
    stats: { hp: 100, atk: attackerStats.atk, def: attackerStats.def, matk: attackerStats.atk, mdef: attackerStats.def, agi: attackerStats.agi },
    currentHp: 100,
    maxHp: 100,
    burst: 0,
    element: 'none',
    bbUses: 0,
      bbLevel: 1,
      hasUsedUBB: false,
    skills: build.skillModules.map(s => ({
      id: s.skill.id,
      name: s.skill.name,
      type: 'active' as const,
      cooldown: s.skill.cooldown,
      effects: []
    })),
    cooldowns: {},
    statusEffects: [],
    isDead: false,
    isStunned: false,
    isTaunting: false,
    modifierIds: build.modifiers.map(m => m.id)
  };

  const target: CombatUnit = {
    id: 'enemy',
    instanceId: 'enemy-instance',
    name: 'Enemy',
    side: 'enemy',
    position: 1,
    row: 'front',
    element: 'none',
    stats: { hp: targetHp, atk: 20, def: 10, matk: 15, mdef: 10, agi: 25 },
    currentHp: targetHp,
    maxHp: targetHp,
    burst: 0,
    bbUses: 0,
      bbLevel: 1,
      hasUsedUBB: false,
    skills: [],
    cooldowns: {},
    statusEffects: [],
    isDead: false,
    isStunned: false,
    isTaunting: false,
    modifierIds: []
  };

  return executePlayerCombat(build, attacker, target, 20);
}