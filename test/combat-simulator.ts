import { CombatUnit, StatusEffect as CombatStatusEffect } from '../lib/types/combat';
import {
  Skill,
  SkillEffect,
  Effect,
  Trigger,
  EffectExecutionContext,
  EventType,
  StatusSystem,
  resolveSkill,
  applyModifiers,
  Modifier,
  loadSkillModule,
  loadModifiers
} from '../lib/services/skill-engine';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const WHITE = '\x1b[37m';

function log(msg: string, color = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

function header(title: string) {
  log(`\n${'='.repeat(70)}`, MAGENTA);
  log(`  ${title}`, MAGENTA);
  log('='.repeat(70), MAGENTA);
}

function subheader(title: string) {
  log(`\n── ${title}`, CYAN);
  log('─'.repeat(50), YELLOW);
}

const T: Record<string, Trigger> = {
  on_hit: { id: 't-on-hit', name: 'on_hit' as EventType },
  on_crit: { id: 't-on-crit', name: 'on_crit' as EventType },
  on_kill: { id: 't-on-kill', name: 'on_kill' as EventType },
  on_skill_use: { id: 't-on-skill-use', name: 'on_skill_use' as EventType },
  on_damage_taken: { id: 't-on-damage-taken', name: 'on_damage_taken' as EventType }
};

interface Build {
  name: string;
  skills: { skill: Skill; effects: SkillEffect[] }[];
  modifiers: Modifier[];
  description: string;
}

function createUnit(name: string, agi: number, atk: number): CombatUnit {
  return {
    id: `unit-${name}`,
    instanceId: `instance-${name}`,
    name,
    side: 'player',
    position: 1,
    row: 'front',
    stats: { hp: 500, atk, def: 20, matk: 30, mdef: 15, agi },
    currentHp: 500,
    maxHp: 500,
    burst: 0,
    element: 'none',
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
}

function createEnemy(name: string, hp: number): CombatUnit {
  return {
    id: `enemy-${name}`,
    instanceId: `enemy-instance-${name}`,
    name,
    side: 'enemy',
    position: 1,
    row: 'front',
    stats: { hp: hp, atk: 20, def: 10, matk: 15, mdef: 10, agi: 25 },
    currentHp: hp,
    maxHp: hp,
    burst: 0,
    element: 'none',
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
}

function createSkillEffect(
  id: string,
  trigger: EventType,
  effect: Effect,
  condition: Record<string, unknown> = {},
  orderIndex: number = 0
): SkillEffect {
  return {
    id,
    skillId: 'skill',
    triggerId: `trigger-${trigger}`,
    trigger: T[trigger] || { id: `t-${trigger}`, name: trigger },
    effect,
    condition,
    orderIndex
  };
}

function buildFire(): Build {
  const ignitionEffect = createSkillEffect(
    'eff-ignition',
    'on_crit',
    { id: 'burn', type: 'apply_status', value: null, duration: 3, extra: { status: 'burn', duration: 3, stacks: 1 } }
  );

  const criticalBurnEffect = createSkillEffect(
    'eff-crit-burn',
    'on_hit',
    { id: 'burn-crit', type: 'apply_status', value: null, duration: 4, extra: { status: 'burn', duration: 4, stacks: 2 } },
    { target_has_status: 'burn', target_status_count: 1 },
    1
  );

  const flameBurstEffect = createSkillEffect(
    'eff-flame-burst',
    'on_hit',
    { id: 'explode', type: 'explode', value: 50, duration: null, extra: { radius: 2 } },
    { target_has_status: 'burn', target_status_count: 3 },
    2
  );

  const fireStrike: Skill = { id: 'fire-strike', name: 'Fire Strike', description: 'Fire attack', basePower: 15, cooldown: 2, tags: ['burn'] };
  const ignition: Skill = { id: 'ignition', name: 'Ignition', description: 'Ignite', basePower: 10, cooldown: 1, tags: ['burn', 'aoe'] };
  const flameBurst: Skill = { id: 'flame-burst', name: 'Flame Burst', description: 'Explosive burst', basePower: 25, cooldown: 3, tags: ['burn', 'aoe'] };

  const fireModifier: Modifier = {
    id: 'mod-fire-crit',
    name: 'Ignición Crítica',
    description: 'Fire skills can crit and explode',
    appliesToTag: 'burn',
    effect: { allow_crit: true, crit_chance_bonus: 25, damage_multiplier: 1.5, extend_duration: 1, duplicate_on_crit: true }
  };

  const aoeModifier: Modifier = {
    id: 'mod-aoe-burst',
    name: 'Explosión Mejorada',
    description: 'AOE skills deal more damage',
    appliesToTag: 'aoe',
    effect: { damage_multiplier: 1.3 }
  };

  return {
    name: '🔥 Fire Build',
    description: 'Burn stacks → Explode when 3+ stacks',
    skills: [
      { skill: fireStrike, effects: [ignitionEffect, flameBurstEffect] },
      { skill: ignition, effects: [createSkillEffect('eff-ign-1', 'on_hit', { id: 'burn2', type: 'apply_status', value: null, duration: 2, extra: { status: 'burn', duration: 2 } })] },
      { skill: flameBurst, effects: [createSkillEffect('eff-fb-1', 'on_hit', { id: 'explode2', type: 'explode', value: 75, duration: null, extra: { radius: 3 } })] }
    ],
    modifiers: [fireModifier, aoeModifier]
  };
}

function buildPoison(): Build {
  const venomTouchEffect = createSkillEffect(
    'eff-venom',
    'on_hit',
    { id: 'poison', type: 'apply_status', value: null, duration: 4, extra: { status: 'poison', duration: 4 } }
  );

  const poisonStackEffect = createSkillEffect(
    'eff-venom-stack',
    'on_hit',
    { id: 'poison-stack', type: 'apply_status', value: null, duration: 3, extra: { status: 'poison', duration: 3, stacks: 2 } }
  );

  const venomExplosionEffect = createSkillEffect(
    'eff-venom-explode',
    'on_hit',
    { id: 'poison-dmg', type: 'damage_per_stack', value: 12, duration: null, extra: { status: 'poison' } },
    { target_has_status: 'poison' }
  );

  const toxicCloudEffect = createSkillEffect(
    'eff-toxic',
    'on_crit',
    { id: 'poison-crit', type: 'apply_status', value: null, duration: 5, extra: { status: 'poison', duration: 5, stacks: 3 } }
  );

  const venomStrike: Skill = { id: 'venom-strike', name: 'Venom Strike', description: 'Poison edge', basePower: 12, cooldown: 1, tags: ['poison'] };
  const toxicBurst: Skill = { id: 'toxic-burst', name: 'Toxic Burst', description: 'Poison explosion', basePower: 20, cooldown: 3, tags: ['poison', 'aoe'] };
  const poisonDagger: Skill = { id: 'poison-dagger', name: 'Poison Dagger', description: 'Poison blade', basePower: 10, cooldown: 2, tags: ['poison', 'debuff'] };

  const poisonModifier: Modifier = {
    id: 'mod-poison-amplify',
    name: 'Potencia Venenosa',
    description: 'Poison is more potent',
    appliesToTag: 'poison',
    effect: { damage_multiplier: 1.8, extend_duration: 2, modify_value: 30 }
  };

  const poisonCritModifier: Modifier = {
    id: 'mod-poison-crit',
    name: 'Veneno Crítico',
    description: 'Poison can crit',
    appliesToTag: 'poison',
    effect: { allow_crit: true, crit_chance_bonus: 20 }
  };

  return {
    name: '🧪 Poison Build',
    description: 'Poison stacks → Consume for damage',
    skills: [
      { skill: venomStrike, effects: [venomTouchEffect, poisonStackEffect] },
      { skill: toxicBurst, effects: [toxicCloudEffect, venomExplosionEffect] },
      { skill: poisonDagger, effects: [venomTouchEffect] }
    ],
    modifiers: [poisonModifier, poisonCritModifier]
  };
}

function buildCritLoop(): Build {
  const basicStrikeEffect = createSkillEffect(
    'eff-basic',
    'on_hit',
    { id: 'dmg-basic', type: 'explode', value: 25, duration: null, extra: { radius: 1 } }
  );

  const critBonusEffect = createSkillEffect(
    'eff-crit-bonus',
    'on_crit',
    { id: 'crit-dmg', type: 'explode', value: 40, duration: null, extra: { radius: 1 } }
  );

  const adrenalineEffect = createSkillEffect(
    'eff-adrenaline',
    'on_crit',
    { id: 'reduce-cd', type: 'reduce_cooldown', value: -2, duration: null, extra: {} }
  );

  const infiniteLoopEffect = createSkillEffect(
    'eff-loop',
    'on_kill',
    { id: 'repeat', type: 'repeat_skill', value: 2, duration: null, extra: { chance: 1.0, max_times: 1 } }
  );

  const critSurgeEffect = createSkillEffect(
    'eff-crit-surge',
    'on_crit',
    { id: 'crit-boost', type: 'apply_status', value: null, duration: 1, extra: { status: 'adrenaline', duration: 1 } }
  );

  const basicStrike: Skill = { id: 'basic-strike', name: 'Basic Strike', description: 'Basic attack', basePower: 15, cooldown: 0, tags: ['crit'] };
  const adrenalineSlash: Skill = { id: 'adrenaline-slash', name: 'Adrenaline Slash', description: 'Crit boost', basePower: 20, cooldown: 2, tags: ['crit', 'self_buff'] };
  const infiniteCore: Skill = { id: 'infinite-core', name: 'Infinite Core', description: 'Loop of death', basePower: 30, cooldown: 4, tags: ['crit', 'chain'] };

  const critModifier: Modifier = {
    id: 'mod-crit-master',
    name: 'Maestro del Crítico',
    description: 'Maximize crit potential',
    appliesToTag: 'crit',
    effect: { allow_crit: true, crit_chance_bonus: 40, damage_multiplier: 2.0, duplicate_on_crit: true }
  };

  const chainModifier: Modifier = {
    id: 'mod-chain-crit',
    name: 'Cadena Crítica',
    description: 'Chain attacks can crit',
    appliesToTag: 'chain',
    effect: { allow_crit: true, damage_multiplier: 1.5 }
  };

  return {
    name: '⚡ Crit Loop Build',
    description: 'High crit chance → Repeat on kill → Infinite loop',
    skills: [
      { skill: basicStrike, effects: [basicStrikeEffect, critBonusEffect] },
      { skill: adrenalineSlash, effects: [adrenalineEffect, critSurgeEffect] },
      { skill: infiniteCore, effects: [basicStrikeEffect, infiniteLoopEffect] }
    ],
    modifiers: [critModifier, chainModifier]
  };
}

interface CombatLog {
  turn: number;
  attacker: string;
  skill: string;
  event: EventType;
  results: string[];
  damage: number;
}

async function runCombatSimulation() {
  header('COMBAT SIMULATOR - BUILD TESTING');

  const builds: Build[] = [buildFire(), buildPoison(), buildCritLoop()];

  for (const build of builds) {
    subheader(build.name);
    log(`Description: ${build.description}`, WHITE);
    log(`Modifiers: ${build.modifiers.map(m => m.name).join(', ')}`, YELLOW);

    let enemy = createEnemy('Training Dummy', 300);
    const attacker = createUnit('Hero', 50, 40);
    
    const allEffects = build.skills.flatMap(s => s.effects);

    const applied = applyModifiers(build.skills[0].skill, build.modifiers);
    log(`\nApplied modifiers: crit=${applied.allowCrit}, critBonus=+${applied.critChanceBonus}%, dmgMult=x${applied.damageMultiplier}`, BLUE);

    const logs: CombatLog[] = [];
    let totalDamage = 0;
    let combos: string[] = [];

    for (let turn = 1; turn <= 15; turn++) {
      if (enemy.isDead) break;

      const skillData = build.skills[Math.floor(Math.random() * build.skills.length)];
      const skill = skillData.skill;
      const skillEffects = skillData.effects;

      const isCrit = Math.random() * 100 < (attacker.stats.agi / 10 + applied.critChanceBonus);
      const event: EventType = isCrit ? 'on_crit' : 'on_hit';

      const context: EffectExecutionContext = {
        source: attacker,
        target: enemy,
        skill,
        event,
        isCrit,
        killedTarget: false,
        previousEffects: [],
        executionOrder: 0
      };

      const results = resolveSkill(skill, skillEffects, context, build.modifiers);

      const turnResults: string[] = [];
      let turnDamage = 0;

      for (const result of results) {
        turnResults.push(result.log);

        if (result.status) {
          if (result.status.name === 'burn') {
            combos.push(`🔥 Burn applied (${result.status.duration}t)`);
          } else if (result.status.name === 'poison') {
            combos.push(`🧪 Poison applied (${result.status.duration}t)`);
          } else if (result.status.name === 'adrenaline') {
            combos.push(`⚡ Adrenaline boost`);
          }
        }

        if (result.type === 'explode' || result.type === 'damage_per_stack' || result.type === 'consume_status') {
          if (result.value) {
            turnDamage += result.value;
            enemy.currentHp = Math.max(0, enemy.currentHp - result.value);
            if (result.type === 'explode') {
              combos.push(`💥 EXPLODE! ${result.value} dmg`);
            }
          }
        }
      }

      if (enemy.currentHp <= 0) {
        enemy.isDead = true;
        const killEvent: EventType = 'on_kill';
        const killContext: EffectExecutionContext = {
          ...context,
          event: killEvent,
          killedTarget: true
        };
        const killResults = resolveSkill(skill, skillEffects, killContext, build.modifiers);
        for (const kr of killResults) {
          if (kr.value) {
            turnDamage += kr.value;
            turnResults.push(`[ON_KILL] ${kr.log}`);
          }
        }
      }

      totalDamage += turnDamage;
      logs.push({ turn, attacker: attacker.name, skill: skill.name, event, results: turnResults, damage: turnDamage });
    }

    log(`\n⚔️ COMBAT LOG:`, RED);
    for (const l of logs) {
      const critFlag = l.event === 'on_crit' ? '💥' : '  ';
      log(`${critFlag} Turn ${l.turn}: ${l.skill} → ${l.damage > 0 ? `DMG: ${l.damage}` : 'no damage'}`, RESET);
      for (const r of l.results.slice(0, 2)) {
        log(`    ${r}`, YELLOW);
      }
    }

    subheader('COMBOS ACTIVATED');
    const uniqueCombos = [...new Set(combos)];
    for (const c of uniqueCombos) {
      log(`  ${c}`, GREEN);
    }

    subheader('FINAL STATS');
    log(`  Total Damage: ${totalDamage}`, RED);
    log(`  Enemy HP: ${enemy.currentHp}/${enemy.maxHp}`, enemy.isDead ? GREEN : YELLOW);
    log(`  Enemy Status: ${enemy.isDead ? 'DEAD 💀' : 'ALIVE'}`, enemy.isDead ? RED : GREEN);
    log(`  Turns: ${logs.length}`, BLUE);
    log(`  DPS: ${(totalDamage / logs.length).toFixed(1)}`, CYAN);
  }

  header('SIMULATION COMPLETE');
  log('\n🎯 Build Summary:', WHITE);
  log('  🔥 Fire: Burn stacks → Explode at 3+ stacks', YELLOW);
  log('  🧪 Poison: Stack poison → Consume for DoT damage', YELLOW);
  log('  ⚡ Crit Loop: High crit → Kill triggers repeat', YELLOW);
  log('\n✅ Combat simulator ready for testing!', GREEN);
}

runCombatSimulation().catch(console.error);