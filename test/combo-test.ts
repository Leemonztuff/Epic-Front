import { CombatUnit } from '../lib/types/combat';
import {
  Skill,
  SkillEffect,
  Effect,
  Trigger,
  EffectExecutionContext,
  EventType,
  StatusSystem,
  resolveEvent,
  checkCondition,
  applyEffect,
  applyModifiers,
  Modifier
} from '../lib/services/skill-engine';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

function log(msg: string, color = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

function divider() {
  log('─'.repeat(60), YELLOW);
}

function createMockUnit(id: string, name: string, agi: number = 50): CombatUnit {
  return {
    id,
    instanceId: id,
    name,
    side: 'player',
    position: 1,
    row: 'front',
    stats: { hp: 100, atk: 30, def: 10, matk: 20, mdef: 10, agi },
    currentHp: 100,
    maxHp: 100,
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

function createMockSkill(
  name: string,
  effects: { trigger: string; effect: Effect; condition: Record<string, unknown> }[]
): { skill: Skill; skillEffects: SkillEffect[] } {
  const triggers: Record<string, Trigger> = {
    on_hit: { id: 'trigger-on-hit', name: 'on_hit' },
    on_crit: { id: 'trigger-on-crit', name: 'on_crit' },
    on_kill: { id: 'trigger-on-kill', name: 'on_kill' },
    on_skill_use: { id: 'trigger-on-skill-use', name: 'on_skill_use' }
  };

  const skill: Skill = {
    id: `skill-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    description: `Test skill: ${name}`,
    basePower: 10,
    cooldown: 0,
    tags: ['burn']
  };

  const skillEffects: SkillEffect[] = effects.map((e, i) => ({
    id: `se-${i}`,
    skillId: skill.id,
    triggerId: triggers[e.trigger].id,
    trigger: triggers[e.trigger],
    effect: e.effect,
    condition: e.condition,
    orderIndex: i
  }));

  return { skill, skillEffects };
}

async function runComboTest() {
  log('\n🧪 COMBO TEST: on_crit → burn → explode (burn >= 3)', CYAN);
  divider();

  log('\n📋 Setup: Creating Fire Hit skill with combo effects...\n', BLUE);

  const burnEffect: Effect = {
    id: 'effect-burn',
    type: 'apply_status',
    value: null,
    duration: 3,
    extra: { status: 'burn', duration: 3 }
  };

  const explodeEffect: Effect = {
    id: 'effect-explode',
    type: 'explode',
    value: 50,
    duration: null,
    extra: { radius: 2 }
  };

  const { skill, skillEffects } = createMockSkill('Fire Hit', [
    { trigger: 'on_crit', effect: burnEffect, condition: {} },
    { trigger: 'on_hit', effect: explodeEffect, condition: { target_has_status: 'burn', target_status_count: 3 } }
  ]);

  log(`Skill: ${skill.name}`, GREEN);
  log(`Tags: ${skill.tags.join(', ')}`, GREEN);
  log(`Effects: ${skillEffects.length}`, GREEN);

  const source = createMockUnit('player-1', 'Hero', 50);
  let target = createMockUnit('enemy-1', 'Goblin', 30);
  let explodeTriggered = false;

  log(`\n⚔️ Units:`, BLUE);
  log(`  Source: ${source.name} (AGI: ${source.stats.agi})`, RESET);
  log(`  Target: ${target.name} (HP: ${target.currentHp})`, RESET);

  const modifier: Modifier = {
    id: 'mod-crit-fire',
    name: 'Criticando Llamas',
    description: 'Fire skills can crit',
    appliesToTag: 'burn',
    effect: { allow_crit: true, crit_chance_bonus: 30 }
  };

  log(`\n🎴 Modifier: ${modifier.name}`, YELLOW);
  log(`  Applied to tag: ${modifier.appliesToTag}`, RESET);
  log(`  Allow crit: ${modifier.effect.allow_crit}`, RESET);
  log(`  Crit chance bonus: +${modifier.effect.crit_chance_bonus}%`, RESET);

  divider();
  log('\n📖 SIMULATION START\n', CYAN);

  const applied = applyModifiers(skill, [modifier]);
  log(`Applied modifiers:`, BLUE);
  log(`  Allow crit: ${applied.allowCrit}`, RESET);
  log(`  Crit chance bonus: +${applied.critChanceBonus}%`, RESET);

  const critChance = (source.stats.agi / 10) + applied.critChanceBonus;
  log(`\n🎯 Base crit chance: ${source.stats.agi / 10}%`, RESET);
  log(`🎯 With modifier: ${critChance}%`, YELLOW);

  const hits = [
    { hitNum: 1, isCrit: true },
    { hitNum: 2, isCrit: true },
    { hitNum: 3, isCrit: true },
    { hitNum: 4, isCrit: false },
  ];

  for (const hit of hits) {
    log(`\n${'─'.repeat(40)}`, YELLOW);
    log(`HIT #${hit.hitNum} ${hit.isCrit ? '(CRITICAL!)' : ''}`, GREEN);

    const event: EventType = hit.isCrit ? 'on_crit' : 'on_hit';
    const context: EffectExecutionContext = {
      source,
      target,
      skill,
      event,
      isCrit: hit.isCrit,
      killedTarget: false,
      previousEffects: [],
      executionOrder: 0
    };

    log(`Event: ${event}`, BLUE);

    const results = resolveEvent(skillEffects, context, applied);

    for (const result of results) {
      log(`  Result: ${result.type} - ${result.log}`, RESET);
      
      if (result.status) {
        log(`    Status applied: ${result.status.name} (${result.status.duration} turns)`, YELLOW);
        target.statusEffects.push(result.status);
      }
      if (result.value) {
        log(`    Damage: ${result.value}`, RED);
        target.currentHp = Math.max(0, target.currentHp - result.value);
        if (result.type === 'explode') {
          explodeTriggered = true;
        }
      }
    }

    log(`\nTarget HP after hit: ${target.currentHp}`, YELLOW);
    log(`Target status effects: ${target.statusEffects.map(s => s.name).join(', ') || 'none'}`, BLUE);

    const burnStacks = StatusSystem.getStacks(target.id, 'burn');
    log(`Burn stacks: ${burnStacks}`, RED);
  }

  divider();
  log('\n📊 FINAL STATE:', CYAN);
  log(`  Target HP: ${target.currentHp}/${target.maxHp}`, YELLOW);
  log(`  Target Dead: ${target.isDead}`, RED);
  log(`  Status Effects:`, BLUE);
  for (const status of StatusSystem.getAllStatuses(target.id)) {
    log(`    - ${status.name}: ${status.remainingTurns} turns remaining`, RESET);
  }

  const finalBurnStacks = StatusSystem.getStacks(target.id, 'burn');

  divider();
  log('\n✅ TEST RESULTS:', GREEN);
  log(`  Burn applied: ${finalBurnStacks > 0 ? 'YES' : 'NO'}`, RESET);
  log(`  Explode triggered: ${explodeTriggered ? 'YES' : 'NO'}`, RESET);
  
  if (finalBurnStacks >= 3 && explodeTriggered) {
    log('\n🎉 COMBO WORKING: burn >= 3 triggered explode!', GREEN);
  } else if (finalBurnStacks > 0) {
    log(`\n⚠️ Need ${3 - finalBurnStacks} more burn stack(s) to trigger explode`, YELLOW);
  } else {
    log('\n❌ COMBO FAILED', RED);
  }

  log('\n' + '═'.repeat(60), CYAN);
}

runComboTest().catch(console.error);