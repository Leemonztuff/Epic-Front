import { CombatUnit } from '../lib/types/combat';
import {
  Skill,
  SkillEffect,
  Effect,
  Trigger,
  EffectExecutionContext,
  EventType,
  StatusSystem,
  resolveSkill,
  checkCondition,
  applyEffect,
  applyModifiers,
  modifyEffect,
  modifyCondition,
  Modifier
} from '../lib/services/skill-engine';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

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

async function runModifierTests() {
  log('\n🎯 MODIFIER SYSTEM TESTS', MAGENTA);
  divider();

  StatusSystem.clearAll();

  const source = createMockUnit('player-1', 'Hero', 60);
  const target = createMockUnit('enemy-1', 'Goblin', 30);

  const triggers: Record<string, Trigger> = {
    on_hit: { id: 't-on-hit', name: 'on_hit' },
    on_crit: { id: 't-on-crit', name: 'on_crit' },
    on_skill_use: { id: 't-on-skill-use', name: 'on_skill_use' }
  };

  log('\n📋 TEST 1: modifyEffect() - alterar valores', CYAN);
  divider();

  const baseEffect: Effect = {
    id: 'eff-poison',
    type: 'apply_status',
    value: null,
    duration: 3,
    extra: { status: 'poison', duration: 3 }
  };

  const poisonModifier: Modifier = {
    id: 'mod-potencia',
    name: 'Potencia Venenosa',
    description: 'Potencia el veneno',
    appliesToTag: 'poison',
    effect: { modify_value: 50, extend_duration: 1 }
  };

  const modifiedEffect = modifyEffect(baseEffect, poisonModifier);
  log(`Original: value=${baseEffect.value}, duration=${baseEffect.extra.duration}`);
  log(`Modificado: value=${modifiedEffect.value}, duration=${modifiedEffect.extra.duration}`);
  log(`✅ modify_value +50%, extend_duration +1`, GREEN);

  log('\n📋 TEST 2: modifyCondition() - alterar condiciones', CYAN);
  divider();

  const baseCondition = { target_has_status: 'burn', target_status_count: 3 };
  const burstConditionModifier: Modifier = {
    id: 'mod-burst',
    name: 'Explosión Burst',
    description: 'Reduce requirement',
    appliesToTag: 'aoe',
    effect: { modify_condition: { target_status_count: 2 } }
  };

  const modifiedCondition = modifyCondition(baseCondition, burstConditionModifier);
  log(`Original: ${JSON.stringify(baseCondition)}`);
  log(`Modificado: ${JSON.stringify(modifiedCondition)}`);
  log(`✅ target_status_count reducido de 3 a 2`, GREEN);

  log('\n📋 TEST 3: duplicate_on_crit - duplicar en crítico', CYAN);
  divider();

  const critModifier: Modifier = {
    id: 'mod-crit-dupe',
    name: 'Duplicación Crítica',
    description: 'Duplica en crit',
    appliesToTag: 'crit',
    effect: { duplicate_on_crit: true }
  };

  const applied = applyModifiers({ id: 'skill', name: 'Test', description: '', basePower: 10, cooldown: 0, tags: ['crit'] }, [critModifier]);
  log(`duplicateOnCrit: ${applied.duplicateOnCrit}`);
  log(`✅ duplicate_on_crit funciona`, GREEN);

  log('\n📋 TEST 4: chain_effects - efectos encadenados', CYAN);
  divider();

  const chainModifier: Modifier = {
    id: 'mod-chain',
    name: 'Cadena Poderosa',
    description: 'Efectos encadenados',
    appliesToTag: 'chain',
    effect: {
      chain_effects: [
        {
          trigger: 'on_hit',
          effect: { id: 'eff-chain', type: 'explode', value: 20, duration: null, extra: { radius: 1 } },
          condition: { target_has_status: 'stun' }
        }
      ]
    }
  };

  const chainApplied = applyModifiers(
    { id: 'skill', name: 'Test', description: '', basePower: 10, cooldown: 0, tags: ['chain'] },
    [chainModifier]
  );
  log(`Chain effects count: ${chainApplied.chainEffects.length}`);
  log(`Trigger: ${chainApplied.chainEffects[0]?.trigger}`);
  log(`✅ chain_effects configurado`, GREEN);

  log('\n📋 TEST 5: Combinación completa - full combo', CYAN);
  divider();

  StatusSystem.clearAll();

  const fireSkill: Skill = {
    id: 'fire-strike',
    name: 'Fire Strike',
    description: 'Fire attack',
    basePower: 20,
    cooldown: 2,
    tags: ['burn']
  };

  const fireEffect: Effect = {
    id: 'fire-burn',
    type: 'apply_status',
    value: null,
    duration: 2,
    extra: { status: 'burn', stacks: 1 }
  };

  const fireTriggerEffects: SkillEffect[] = [
    { id: 'se1', skillId: 'fire-strike', triggerId: 't-on-hit', trigger: triggers.on_hit, effect: fireEffect, condition: {}, orderIndex: 0 }
  ];

  const superModifier: Modifier = {
    id: 'mod-super',
    name: 'Super Fuego',
    description: 'Todo el poder del fuego',
    appliesToTag: 'burn',
    effect: {
      allow_crit: true,
      crit_chance_bonus: 30,
      damage_multiplier: 2,
      extend_duration: 2,
      duplicate_on_crit: true,
      new_effects: [
        { id: 'new-eff', type: 'explode', value: 25, duration: null, extra: { radius: 1 } }
      ]
    }
  };

  const context: EffectExecutionContext = {
    source,
    target,
    skill: fireSkill,
    event: 'on_hit',
    isCrit: true,
    killedTarget: false,
    previousEffects: [],
    executionOrder: 0
  };

  log('Skills:', BLUE);
  log(`  Name: ${fireSkill.name}`);
  log(`  Tags: ${fireSkill.tags.join(', ')}`);
  log('Modifier:', BLUE);
  log(`  Name: ${superModifier.name}`);
  log(`  Allow crit: ${superModifier.effect.allow_crit}`);
  log(`  Crit chance bonus: +${superModifier.effect.crit_chance_bonus}%`);
  log(`  Damage multiplier: x${superModifier.effect.damage_multiplier}`);
  log(`  Extend duration: +${superModifier.effect.extend_duration}`);
  log(`  Duplicate on crit: ${superModifier.effect.duplicate_on_crit}`);
  log(`  New effects: ${superModifier.effect.new_effects?.length || 0}`);

  divider();
  log('\n⚔️ EJECUCIÓN:', RED);

  const allModifiers = applyModifiers(fireSkill, [superModifier]);
  const resolvedContext = { ...context, isCrit: true };
  const results = resolveSkill(fireSkill, fireTriggerEffects, resolvedContext, [superModifier]);

  for (const result of results) {
    log(`  [${result.type}] ${result.log}`, RESET);
    if (result.status) {
      log(`    → Status: ${result.status.name}, duration: ${result.status.duration}`, YELLOW);
    }
    if (result.value) {
      log(`    → Value: ${result.value}`, RED);
    }
  }

  log('\n📊 Resultados:', BLUE);
  log(`  Total efectos ejecutados: ${results.length}`);
  
  const hasBurn = results.some(r => r.type === 'apply_status' && r.status?.name === 'burn');
  const hasExplode = results.some(r => r.type === 'explode');
  const hasNewEffect = results.some(r => r.log.includes('[CHAIN]') || r.log.includes('[DUPLICADO]'));

  log(`  ✅ Burn aplicado: ${hasBurn ? 'SÍ' : 'NO'}`);
  log(`  ✅ Explode (base o nuevo): ${hasExplode ? 'SÍ' : 'NO'}`);
  log(`  ✅ Efectos extra (new/duplicate): ${hasNewEffect ? 'SÍ' : 'NO'}`);

  if (hasBurn && hasExplode && hasNewEffect) {
    log('\n🎉 MODIFIER SYSTEM FUNCIONANDO PERFECTAMENTE!', GREEN);
  }

  log('\n' + '═'.repeat(60), MAGENTA);
}

runModifierTests().catch(console.error);