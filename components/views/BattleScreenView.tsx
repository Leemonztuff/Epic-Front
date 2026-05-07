'use client';

import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Swords,
  Shield,
  Zap,
  PlayCircle,
  Award,
  AlertTriangle,
  Terminal,
  Activity,
  Heart,
  Target,
  Gift,
  Star as StarIcon,
  Sparkles
} from 'lucide-react';
import { CombatUnit, SkillDefinition } from '@/lib/types/combat';
import { BattleManager } from '@/lib/services/battle-manager';
import { CombatAdapter } from '@/lib/services/combat-adapter';
import { CampaignService } from '@/lib/services/campaign-service';
import { logger } from '@/lib/logger';
import { Stage } from '@/lib/rpg-system/campaign-types';

interface BattleScreenViewProps {
  squad: any[];
  stageId?: string;
  onBack: () => void;
  onRefresh: () => void;
}

export function BattleScreenView({ squad, stageId, onBack, onRefresh }: BattleScreenViewProps) {
  const [units, setUnits] = useState<CombatUnit[]>([]);
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<any>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isBurstActive, setIsBurstActive] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, value: number, x: number, y: number, color: string, isCrit?: boolean }[]>([]);
  const [participatingUnits, setParticipatingUnits] = useState<Set<string>>(new Set());
  const [autoBattle, setAutoBattle] = useState(false);
  
  // INTENSE COMBAT FEEDBACK SYSTEM
  const [comboCount, setComboCount] = useState(0);
  const [comboChain, setComboChain] = useState<string[]>([]);
  const [lastHitType, setLastHitType] = useState<string>('');
  const [activeEffects, setActiveEffects] = useState<{ name: string, icon: string, color: string }[]>([]);
  const [combatLog, setCombatLog] = useState<{ text: string, type: string, time: number }[]>([]);
  
  // INTENSE VISUAL FEEDBACK STATES
  const [screenFlash, setScreenFlash] = useState<'none' | 'crit' | 'combo' | 'chain'>('none');
  const [screenShakeIntensity, setScreenShakeIntensity] = useState(0);
  const [chainMultiplier, setChainMultiplier] = useState(1);
  const [chainCount, setChainCount] = useState(0);
  const [lastComboMilestone, setLastComboMilestone] = useState(0);
  const [screenGlow, setScreenGlow] = useState<'none' | 'gold' | 'fire' | 'ice' | 'dark'>('none');
  const [hitSequence, setHitSequence] = useState<{ id: number, value: number, time: number }[]>([]);

  const prefersReducedMotion = usePrefersReducedMotion();

  // Statistics for Star calculation
  const [stats, setStats] = useState({
    totalTurns: 0,
    playerDeaths: 0
  });

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  };

  useEffect(() => {
    async function initBattle() {
      try {
        const validSquad = squad.filter(u => !!u);
        if (validSquad.length === 0) {
          setInitError("Equipo vacío. Asigna héroes antes de la batalla.");
          setIsInitializing(false);
          return;
        }

        const playerUnits = await Promise.all(
          validSquad.map((unit, idx) => CombatAdapter.dbUnitToCombatUnit(unit.id, 'player', idx))
        );

        let enemies: CombatUnit[] = [];
        if (stageId) {
          const stage = await CampaignService.getStageById(stageId);
          if (stage) {
            enemies = stage.enemies.map(e => CombatAdapter.createEnemy(e.id, e.name, e.level, e.position));
          }
        }

        if (enemies.length === 0) {
          enemies = [
            CombatAdapter.createEnemy('e1', 'Demonio de Elite', 5, 1),
            CombatAdapter.createEnemy('e2', 'Archimago Oscuro', 5, 2)
          ];
        }

        setUnits([...playerUnits, ...enemies]);
        setIsInitializing(false);
      } catch (e: any) {
        setInitError(e.message || "Error al inicializar combate");
        setIsInitializing(false);
      }
    }
    initBattle();
  }, [squad, stageId]);

  const addDamageNumber = useCallback((value: number, unitId: string, color: string = 'text-white', isCrit: boolean = false, hitType: string = '') => {
    const now = Date.now();
    const newId = now + Math.random();
    
    setDamageNumbers(prev => {
      return [...prev, { id: newId, value, x: Math.random() * 60 - 30, y: -50 - Math.random() * 20, color, isCrit }];
    });
    
    // Add to hit sequence for chain detection
    setHitSequence(prev => {
      const newSeq = [...prev, { id: newId, value, time: now }];
      // Keep only last 1.5 seconds of hits
      return newSeq.filter(h => now - h.time < 1500);
    });
    
    // Check for chains (rapid hits within 500ms)
    const recentHits = hitSequence.filter(h => now - h.time < 500);
    if (recentHits.length >= 2) {
      const newChain = recentHits.length + 1;
      setChainCount(newChain);
      setChainMultiplier(Math.min(3, 1 + (newChain - 2) * 0.5)); // 1.5x, 2x, 2.5x, 3x
      setScreenFlash('chain');
      setTimeout(() => setScreenFlash('none'), 200);
    }
    
    // Update combo system with INTENSE effects
    if (hitType === 'damage' || isCrit) {
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      setLastHitType(isCrit ? 'CRITICAL' : hitType);
      
      // CRITICAL HIT - MASSIVE FLASH
      if (isCrit) {
        setScreenFlash('crit');
        setScreenShakeIntensity(15);
        setScreenGlow('fire');
        // Add combat log with big text
        setCombatLog(prev => [...prev.slice(-3), { text: `💥 CRÍTICO: ${value}!`, type: 'crit', time: now }]);
        setTimeout(() => { setScreenGlow('none'); setScreenShakeIntensity(0); }, 400);
      } 
      // COMBO MILESTONES
      else if (newCombo > 0 && newCombo % 5 === 0 && newCombo !== lastComboMilestone) {
        setLastComboMilestone(newCombo);
        setScreenFlash('combo');
        setScreenShakeIntensity(10);
        setScreenGlow('gold');
        setCombatLog(prev => [...prev.slice(-3), { text: `🔥 COMBO x${newCombo}!`, type: 'combo', time: now }]);
        setTimeout(() => { setScreenGlow('none'); setScreenShakeIntensity(0); }, 300);
      }
      // REGULAR HIT
      else {
        // Add to combat log
        const logText = isCrit ? `⚔️ CRÍTICO! ${value} dmg` : `💥 ${value} dmg`;
        setCombatLog(prev => [...prev.slice(-4), { text: logText, type: isCrit ? 'crit' : 'hit', time: now }]);
      }
      
      // Screen shake based on damage
      if (value > 20) {
        setScreenShakeIntensity(Math.min(12, value / 3));
        setTimeout(() => setScreenShakeIntensity(0), 200);
      }
    }
    
    setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== newId)), 1200);
  }, [comboCount, hitSequence, lastComboMilestone]);

  const runTurn = (actor: CombatUnit, skill: SkillDefinition, manualTargetId?: string, isBurst: boolean = false) => {
    if (isBattleOver) return;

    const { results, updatedUnits } = BattleManager.executeTurn(actor, skill, units, manualTargetId, isBurst);

    results.forEach(r => {
      if (r.type === 'damage' && r.value && r.value > 0) {
        addDamageNumber(r.value, r.targetId, isBurst ? 'text-yellow-300' : 'text-red-500', isBurst);
      }
    });

    // Track participating units
    setParticipatingUnits(prev => {
      const newSet = new Set(prev);
      newSet.add(actor.id);
      return newSet;
    });

    setBattleLog(prev => [...prev, ...results.map(r => r.log)].slice(-20));
    setUnits(updatedUnits);
    setTurn(prev => prev + 1);
    setTargetId(null);
    setStats(prev => ({ ...prev, totalTurns: prev.totalTurns + 1 }));
  };

  const handleBurst = () => {
    if (isBattleOver || !currentActor || currentActor.side !== 'player') return;
    if (currentActor.burst < 100) return;

    setIsBurstActive(true);

    // Create a burst skill: 1.5x damage, resets burst to 0
    const burstSkill: SkillDefinition = {
      id: 'burst_ultra',
      name: 'Burst Ultra',
      type: 'burst',
      cooldown: 0,
      effects: [
        { type: 'damage', scaling: 'atk', power: 1.5, target: 'enemy' },
        { type: 'apply_status', target: 'self', status: 'burst_cooldown' }
      ]
    };

    // Execute burst turn and reset burst
    runTurn(currentActor, burstSkill, targetId || undefined, true);

    // Reset burst after a short delay for visual feedback
    setTimeout(() => setIsBurstActive(false), 1500);
  };

  const handleBattleOver = async (winnerSide: 'player' | 'enemy', deaths: number) => {
    setIsBattleOver(true);
    setWinner(winnerSide);
    if (winnerSide === 'player' && stageId) {
      setIsRecordingResult(true);
      try {
        const result = await CampaignService.completeStage(
          stageId, 
          { turns: round, deaths },
          Array.from(participatingUnits) // Pass participating unit IDs
        );
        setCompletionData(result);
     } catch (e: unknown) {
         logger.error('error', "Failed to record stage completion:", e as Error);
       } finally {
        setIsRecordingResult(false);
      }
    }
  };

  useEffect(() => {
    if (isInitializing || isBattleOver || initError) return;

    const aliveEnemies = units.filter(u => u.side === 'enemy' && !u.isDead);
    const alivePlayers = units.filter(u => u.side === 'player' && !u.isDead);
    const deadPlayers = units.filter(u => u.side === 'player' && u.isDead).length;

    if (aliveEnemies.length === 0) {
      setTimeout(() => handleBattleOver('player', deadPlayers), 0);
      return;
    }
    if (alivePlayers.length === 0) {
      setTimeout(() => handleBattleOver('enemy', deadPlayers), 0);
      return;
    }

    const order = BattleManager.getTurnOrder(units);
    if (order.length === 0) return;

    if (turn >= order.length) {
      setTimeout(() => {
        setTurn(0);
        setRound(prev => prev + 1);
        setUnits(prev => prev.map(u => BattleManager.updateUnitStartTurn(u)));
      }, 0);
      return;
    }

    const currentActor = order[turn];
    setTimeout(() => setActiveUnitId(currentActor.id), 0);

    if (currentActor.side === 'enemy') {
      const skill = currentActor.skills[0];
      const timer = setTimeout(() => runTurn(currentActor, skill), 1000);
      return () => clearTimeout(timer);
    }

    // Auto-battle: if player's turn and auto-battle is on
    if (autoBattle && currentActor.side === 'player' && enemyUnits.length > 0) {
      const autoTargetId = enemyUnits[0].id;
      setTargetId(autoTargetId);
      const skill = currentActor.skills[0] || { id: 'attack', name: 'Attack', type: 'basic', cooldown: 0, effects: [] };
      const timer = setTimeout(() => runTurn(currentActor, skill, autoTargetId), 500);
      return () => clearTimeout(timer);
    }
  }, [units, turn, isInitializing, isBattleOver, initError, autoBattle]);

  if (isInitializing) return <LoadingScreen />;
  if (initError) return <ErrorScreen error={initError} onBack={onBack} />;

  const playerUnits = units.filter(u => u.side === 'player');
  const enemyUnits = units.filter(u => u.side === 'enemy' && !u.isDead);
  const currentActor = units.find(u => u.id === activeUnitId);
  
  const totalPlayerHp = playerUnits.reduce((acc, u) => acc + u.currentHp, 0);
  const maxPlayerHp = playerUnits.reduce((acc, u) => acc + u.maxHp, 0);
  const totalEnemyHp = enemyUnits.reduce((acc, u) => acc + u.currentHp, 0);
  const maxEnemyHp = enemyUnits.reduce((acc, u) => acc + u.maxHp, 0);

  return (
    <motion.div 
      animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-5, 5, 5, -5, 0] } : {}}
      transition={{ duration: 0.1, repeat: 2 }}
      className="flex flex-col h-full bg-[#050A0F] overflow-hidden relative font-sans text-white select-none"
        style={screenShakeIntensity > 0 ? {
          animation: `shake ${screenShakeIntensity / 100}s ease-in-out`,
        } : undefined}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center animate-slow-zoom opacity-30 blur-[2px] scale-110" style={{ backgroundImage: `url('${AssetService.getBgUrl('battle')}')` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#050A0F_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A0F] via-transparent to-[#050A0F]" />
      </div>

      {/* TOP: Boss HP Bar & Elements */}
      <div className="relative z-20 px-4 pt-10 pb-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <Button onClick={onBack} variant="ghost" size="sm" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"><ChevronLeft size={20} /></Button>
          <Button
            onClick={() => setAutoBattle(!autoBattle)}
            variant={autoBattle ? "primary" : "ghost"}
            size="sm"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${autoBattle ? 'bg-green-600 border-green-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title="Auto-battle"
          >
            <Zap size={18} className={autoBattle ? 'animate-pulse' : ''} />
          </Button>
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 mb-1">
                <Swords size={12} className="text-[#F5C76B]" />
                <span className="text-[12px] font-black tracking-[0.4em] text-[#F5C76B] uppercase italic drop-shadow-[0_0_10px_rgba(245,199,107,0.5)]">STAGE {stageId?.replace('stage_', '').replace('_', '-')}</span>
             </div>
<div className="flex items-center gap-3">
                 <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">RONDA {round}</span>
                 <div className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">TURNO {stats.totalTurns}</span>
              </div>
              {/* Turn indicator */}
              {currentActor && (
                <div className={`mt-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${currentActor.side === 'player' ? 'bg-cyan-600 text-white' : 'bg-red-600 text-white'}`}>
                  {currentActor.side === 'player' ? '▶ TU TURNO' : '⏳ ENEMIGO'}
                </div>
              )}
           </div>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Activity size={18} className="text-[#F5C76B] animate-pulse" />
          </div>
        </div>

        <div className="relative h-7 bg-black/80 rounded-sm border-x-4 border-[#F5C76B] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${Math.min((totalEnemyHp / maxEnemyHp) * 100, 100)}%` }}
            className="h-full bg-[linear-gradient(90deg,#991b1b_0%,#ef4444_50%,#f87171_100%)] relative"
          >
             <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(0,0,0,0.3)_100%)]" />
             <motion.div 
               animate={{ x: ['-100%', '200%'] }} 
               transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
               className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" 
             />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black tracking-[0.2em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] italic">
            {totalEnemyHp.toLocaleString()} <span className="mx-1 text-white/40">/</span> {maxEnemyHp.toLocaleString()}
          </div>
        </div>

        {/* Player HP Bar */}
        <div className="relative h-5 bg-black/80 rounded-sm border-x-4 border-[#4ade80] overflow-hidden mt-2">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${Math.min((totalPlayerHp / maxPlayerHp) * 100, 100)}%` }}
            className="h-full bg-[linear-gradient(90deg,#166534_0%,#4ade80_50%,#86efac_100%)] relative"
          >
             <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(0,0,0,0.3)_100%)" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-[0.2em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] italic">
            {totalPlayerHp.toLocaleString()} <span className="mx-1 text-white/40">/</span> {maxPlayerHp.toLocaleString()}
          </div>
        </div>

        {/* Elemental Orbs Row - Now interactive-looking */}
        <div className="flex justify-center gap-2 sm:gap-5 mt-4">
          {['#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#c084fc'].map((color, i) => (
            <motion.div 
              key={i} 
              animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
              className="w-3 h-3 rounded-full border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative" 
              style={{ backgroundColor: color }}
            >
               <div className="absolute inset-0 rounded-full bg-white/40 blur-[1px] scale-50 translate-x-[-20%] translate-y-[-20%]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* FIELD: Battle View Area */}
      <div className="flex-1 relative z-10 px-4 flex flex-col justify-center overflow-hidden">
        {/* Target instruction banner */}
        {currentActor?.side === 'player' && !targetId && !autoBattle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/80 border border-red-500/50 rounded-full"
          >
            <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">👇 SELECCIONA UN ENEMIGO</span>
          </motion.div>
        )}

        {/* Enemies Section */}
        <div className="flex justify-center gap-4 sm:gap-12 -mt-8 sm:-mt-16">
          {enemyUnits.map((enemy) => (
            <EnemySprite key={enemy.id} enemy={enemy} isTargeted={targetId === enemy.id} onTarget={() => setTargetId(enemy.id)} />
          ))}
        </div>

        {/* Player Sprites on Field */}
        <div className="absolute bottom-20 left-6 right-6 flex justify-between items-end px-8">
          {playerUnits.map((unit) => (
            <PlayerSprite key={unit.id} unit={unit} isActive={unit.id === activeUnitId} />
          ))}
        </div>

        {/* === SCREEN-WIDE INTENSE EFFECTS === */}
        <AnimatePresence>
          {/* CRITICAL FLASH */}
          {screenFlash === 'crit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-yellow-400/30 pointer-events-none z-[100] mix-blend-screen"
            />
          )}
          
          {/* COMBO MILESTONE FLASH */}
          {screenFlash === 'combo' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-orange-500/20 pointer-events-none z-[100] mix-blend-screen"
            />
          )}
          
          {/* CHAIN FLASH */}
          {screenFlash === 'chain' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-cyan-400/20 pointer-events-none z-[100] mix-blend-screen"
            />
          )}
          
          {/* SCREEN GLOW OVERLAY */}
          {screenGlow !== 'none' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 pointer-events-none z-[90] ${
                screenGlow === 'gold' ? 'bg-gradient-to-t from-yellow-600/30 via-yellow-400/10 to-transparent' :
                screenGlow === 'fire' ? 'bg-gradient-to-t from-red-600/40 via-orange-500/20 to-transparent' :
                screenGlow === 'ice' ? 'bg-gradient-to-t from-cyan-600/30 via-blue-400/10 to-transparent' :
                screenGlow === 'dark' ? 'bg-gradient-to-t from-purple-900/40 via-purple-700/20 to-transparent' : ''
              }`}
            />
          )}
        </AnimatePresence>

        {/* Damage Numbers Container */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <AnimatePresence>
            {damageNumbers.map(d => (
              <motion.div
                key={d.id}
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, y: 0, scale: 0.5, rotate: -10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: d.y, scale: d.isCrit ? 2.5 : 1.8, rotate: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.2 }}
                transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', damping: 10 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-3xl italic drop-shadow-[0_4px_8px_rgba(0,0,0,1)] flex flex-col items-center z-60 ${d.color}`}
                style={{ marginLeft: d.x }}
              >
                {d.isCrit && <span className="text-[10px] uppercase tracking-[0.3em] mb-[-4px] text-yellow-300 drop-shadow-none">CRITICAL</span>}
                {d.value}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

       {/* Status Effects Visualization */}
       <div className="absolute inset-0 pointer-events-none z-40">
         <AnimatePresence>
           {units.filter(u => u.statusEffects.length > 0).map(unit => (
             <div
               key={`status-${unit.id}`}
               className="absolute"
               style={{
                 top: unit.side === 'player' ? '60%' : '25%',
                 left: unit.position < 3 ? `${20 + unit.position * 25}%` : `${30 + (unit.position - 3) * 25}%`,
               }}
             >
               <div className="flex gap-1">
                 {unit.statusEffects.map((effect, idx) => (
                   <motion.div
                     key={`${effect.id}-${idx}`}
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0 }}
                     className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[8px] font-black ${
                       effect.type === 'buff' ? 'bg-blue-500/30 border-blue-500/40 text-blue-400' :
                       effect.type === 'debuff' ? 'bg-red-500/30 border-red-500/40 text-red-400' :
                       effect.type === 'dot' ? 'bg-purple-500/30 border-purple-500/40 text-purple-400' :
                       'bg-white/10 border-white/20 text-white'
                     }`}
                     title={`${effect.name} (${effect.remainingTurns} turns)`}
                   >
                     {effect.type === 'buff' ? '↑' : effect.type === 'debuff' ? '↓' : '●'}
                   </motion.div>
                 ))}
               </div>
             </div>
           ))}
</AnimatePresence>
        </div>

        {/* === INTENSE COMBAT FEEDBACK HUD === */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-50 pointer-events-none">
          {/* COMBO COUNTER - MASSIVE AND INTENSE */}
          <AnimatePresence>
            {comboCount > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative"
              >
                {/* Glow effect behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 blur-xl opacity-50 rounded-2xl" />
                
                <motion.div 
                  animate={comboCount >= 5 ? { 
                    scale: [1, 1.1, 1],
                    boxShadow: ['0 0 20px rgba(255,100,0,0.5)', '0 0 40px rgba(255,100,0,0.8)', '0 0 20px rgba(255,100,0,0.5)']
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="relative bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 px-6 py-3 rounded-2xl shadow-2xl border-2 border-orange-400"
                >
                  <div className="flex items-center gap-3">
                    {/* Animated fire icon */}
                    <motion.span 
                      animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                      className="text-4xl filter drop-shadow-[0_0_10px_orange]"
                    >
                      🔥
                    </motion.span>
                    
                    <div className="flex flex-col">
                      <motion.span 
                        key={comboCount}
                        initial={{ scale: 1.5, y: -10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="text-white font-black text-3xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      >
                        {comboCount}
                      </motion.span>
                      <span className="text-orange-200 text-[8px] font-bold uppercase tracking-[0.2em]">COMBO</span>
                    </div>
                    
                    {/* CRITICAL indicator */}
                    {lastHitType === 'CRITICAL' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-yellow-400 px-2 py-1 rounded-lg"
                      >
                        <span className="text-red-600 text-xs font-black tracking-wider">CRIT!</span>
                      </motion.div>
                    )}
                    
                    {/* Chain multiplier */}
                    {chainCount >= 3 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-cyan-500 px-2 py-1 rounded-lg border border-cyan-300"
                      >
                        <span className="text-white text-xs font-black">x{chainMultiplier.toFixed(1)}</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHAIN COMBO POPUP */}
          <AnimatePresence>
            {chainCount >= 3 && (
              <motion.div
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="self-center"
              >
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 20px cyan', '0 0 40px cyan', '0 0 20px cyan']
                  }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="bg-cyan-500/80 backdrop-blur px-4 py-2 rounded-xl border border-cyan-300"
                >
                  <span className="text-white font-black text-sm">
                    ⚡ CHAIN x{chainCount}! ⚡
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Combat Log - More visible */}
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 max-w-[200px] border-2 border-white/20 shadow-2xl">
            <div className="text-white/50 text-[8px] font-bold uppercase tracking-wider mb-1">Combat Log</div>
            <AnimatePresence>
              {combatLog.slice().reverse().map((log, idx) => (
                <motion.div
                  key={log.time}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs font-bold py-1 border-b border-white/10 last:border-0 ${
                    log.type === 'crit' ? 'text-yellow-400' : 
                    log.type === 'combo' ? 'text-orange-400' :
                    'text-white/70'
                  }`}
                >
                  {log.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Active Effects Indicator - Left side */}
        {activeEffects.length > 0 && (
          <div className="absolute top-4 left-4 flex gap-2 z-50">
            {activeEffects.map((effect, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  borderColor: effect.color === 'text-red-500' ? '#ef4444' : '#3b82f6'
                }}
                title={effect.name}
              >
                {effect.icon}
              </motion.div>
            ))}
          </div>
        )}
      </div>

       {/* BOTTOM: Unit Cards & Skill Bar */}
       <div className="relative z-30 pb-8 px-4 flex flex-col gap-6">
         {/* Unit Cards Grid - Improved with more detail */}
         <div className="grid grid-cols-4 gap-3">
           {playerUnits.map((unit) => (
             <UnitCard key={unit.id} unit={unit} isActive={unit.id === activeUnitId} />
           ))}
         </div>

         {/* Skill Selection Bar - More Premium */}
         <NineSlicePanel
           type="border"
           variant="default"
           className="p-4 flex items-center gap-4 relative overflow-hidden"
           glassmorphism={true}
         >
           <div className="absolute inset-0 bg-gradient-to-r from-[#F5C76B]/5 via-transparent to-transparent pointer-events-none" />
           
           <div className="flex-1 flex gap-3">
             {currentActor?.side === 'player' && currentActor.skills.map((skill, idx) => (
               <SkillButton 
                 key={skill.id || `skill-${idx}`} 
                 skill={skill} 
                 onUse={() => runTurn(currentActor, skill, targetId || undefined)} 
                 cooldown={currentActor.cooldowns[skill.id || '']}
               />
             ))}
           </div>

            <ActionButton
              onClick={handleBurst}
              variant="burst"
              disabled={!currentActor || (currentActor?.burst || 0) < 100 || isBurstActive}
              className={`w-16 h-16 rounded-full p-1 shadow-[0_0_30px_rgba(239,68,68,0.4)] group relative ${(currentActor?.burst || 0) >= 100 ? 'animate-pulse' : ''}`}
              whileHover={(currentActor?.burst || 0) >= 100 ? { scale: 1.05 } : {}}
              whileTap={(currentActor?.burst || 0) >= 100 ? { scale: 0.9 } : {}}
            >
                <div className={`w-full h-full bg-[#0B1A2A]/90 rounded-full flex flex-col items-center justify-center border-2 ${(currentActor?.burst || 0) >= 100 ? 'border-red-400' : 'border-white/20'}`}>
                   {isBurstActive ? (
                     <motion.div
                       initial={{ scale: 0.5, opacity: 0 }}
                       animate={{ scale: 2, opacity: 1 }}
                       transition={{ duration: 0.8 }}
                       className="text-yellow-300 font-black text-xs uppercase tracking-widest"
                     >
                       ULTRA!
                     </motion.div>
                   ) : (
                     <>
                       <motion.div
                         animate={(currentActor?.burst || 0) >= 100 ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.4 }}
                         transition={{ repeat: Infinity, duration: 1.5 }}
                         className="absolute inset-0 bg-white/10 rounded-full"
                       />
                       <span className={`text-[7px] font-black uppercase tracking-widest leading-none mb-0.5 ${(currentActor?.burst || 0) >= 100 ? 'text-yellow-300' : 'text-white/60'}`}>Burst</span>
                       <span className={`text-[11px] font-black uppercase leading-none italic drop-shadow-lg ${(currentActor?.burst || 0) >= 100 ? 'text-yellow-300' : 'text-white'}`}>ULTRA</span>
                       {/* Burst bar mini indicator */}
                       <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-black/40 rounded-full overflow-hidden">
                         <div
                           className={`h-full ${(currentActor?.burst || 0) >= 100 ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                           style={{ width: `${currentActor?.burst || 0}%` }}
                         />
                       </div>
                     </>
                   )}
                </div>
             </ActionButton>
         </NineSlicePanel>
       </div>

        {/* Battle Log Terminal Overlay - Fixed position below boss HP bar */}
         <div className="absolute top-40 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-20">
           <div className="flex flex-col items-end gap-1">
              <Button
                onClick={() => setShowBattleLog(!showBattleLog)}
                variant="ghost"
                size="sm"
                className="pointer-events-auto text-[8px] font-black uppercase tracking-widest px-3 py-1"
              >
                {showBattleLog ? 'OCULTAR LOG' : 'VER LOG'}
              </Button>
             {showBattleLog && (
               <NineSlicePanel
                 type="border"
                 variant="transparent"
                 className="w-full max-h-[80px] overflow-y-auto flex flex-col gap-0.5 p-2"
                 style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
               >
                 {battleLog.slice(-5).map((log, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="border-l border-[#F5C76B]/30 pl-1.5 py-0.5"
                     style={{ lineHeight: '1.2' }}
                   >
                     <span className="text-[6px] font-mono text-white/70 uppercase tracking-wider">{log}</span>
                   </motion.div>
                 ))}
               </NineSlicePanel>
             )}
           </div>
         </div>

      {/* Victory/Defeat Overlay */}
      <AnimatePresence>
        {isBattleOver && <BattleResult winner={winner} completionData={completionData} isRecording={isRecordingResult} onConfirm={() => { onRefresh(); onBack(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function EnemySprite({ enemy, isTargeted, onTarget }: { enemy: CombatUnit, isTargeted: boolean, onTarget: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: isTargeted ? [0, -5, 0] : 0,
        scale: isTargeted ? 1.15 : 1 
      }}
      transition={isTargeted ? { repeat: Infinity, duration: 1 } : {}}
      onClick={onTarget}
      className="relative cursor-pointer group"
    >
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
           <span className="text-[7px] font-black text-red-500 bg-black/40 px-1 rounded-sm border border-red-500/20">LV.5</span>
           <span className="text-[8px] font-black text-white drop-shadow-lg truncate uppercase tracking-tighter">{enemy.name}</span>
        </div>
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-lg">
           <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }} />
        </div>
      </div>

      {/* Target Marker */}
      {isTargeted && (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -inset-8 border-2 border-dashed border-red-500/40 rounded-full"
        />
      )}

      {imgError ? (
        <div className="w-40 h-40 flex items-center justify-center bg-red-900/20 border-2 border-red-500/30 rounded-full">
          <div className="text-center">
            <div className="text-4xl mb-2">?</div>
            <span className="text-[8px] font-black text-red-400 uppercase">{enemy.name}</span>
          </div>
        </div>
      ) : (
        <img 
          src={AssetService.getSpriteUrl(enemy.sprite_id || "abbys_sprite_001")}
          onError={() => setImgError(true)}
          className={`w-40 h-40 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,1)] scale-x-[-1] transition-all duration-300 ${isTargeted ? 'brightness-125 saturate-150' : 'brightness-90 saturate-50'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      )}
    </motion.div>
  );
}

function PlayerSprite({ unit, isActive }: { unit: CombatUnit, isActive: boolean }) {
  return (
    <motion.div 
      animate={{ 
        y: isActive ? [0, -12, 0] : 0,
        scale: isActive ? 1.2 : 1,
        opacity: unit.isDead ? 0.3 : 1
      }}
      transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
      className="relative"
    >
      {/* Magic Pedestal for active unit */}
       {isActive && (
         <motion.div 
           animate={{ rotate: 360, opacity: [0.2, 0.5, 0.2] }}
           transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
           className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-24 h-8 border border-cyan-500/30 rounded-full bg-cyan-500/10 blur-[2px] z-0"
         />
       )}
       
       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-black/60 rounded-full blur-md z-0" />
      
      <img 
        src={AssetService.getSpriteUrl(unit.sprite_id || AssetService.getJobSpriteId('novice'))}
        className={`w-28 h-28 object-contain transform origin-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-10 transition-all ${isActive ? 'brightness-125' : 'brightness-100'}`}
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
}

function UnitCard({ unit, isActive }: { unit: CombatUnit, isActive: boolean }) {
  return (
    <NineSlicePanel
      type="border"
      variant={isActive ? 'fancy' : 'default'}
      className="relative flex flex-col p-2.5 overflow-hidden aspect-[3.5/5]"
      style={{
        backgroundColor: isActive ? 'rgba(245,199,107,0.15)' : 'rgba(11,26,42,0.6)',
      }}
      glassmorphism={true}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Unit Level & Element */}
      <div className="flex justify-between items-start relative z-10 mb-1">
        <div className="w-5 h-5 rounded-lg bg-[#F5C76B]/20 border border-[#F5C76B]/40 flex items-center justify-center">
           <span className="text-[7px] font-black text-[#F5C76B]">LV.1</span>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex gap-0.5 justify-center w-full">
              {[1, 2, 3, 4].map(i => <StarIcon key={i} size={6} className="text-yellow-400 fill-current" />)}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-1">
         <span className="text-[9px] font-black text-white uppercase tracking-wider text-center drop-shadow-md leading-tight">{unit.name}</span>
         <span className="text-[6px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">{unit.jobId || 'Novice'}</span>
      </div>

      <div className="space-y-1.5 relative z-10 mt-auto">
        <div className="flex justify-between items-end px-0.5">
           <span className="text-[6px] font-black text-white/40 uppercase">HP</span>
           <span className="text-[7px] font-mono font-bold text-white/90">{unit.currentHp}</span>
        </div>
        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <motion.div 
            animate={{ width: `${Math.min((unit.currentHp / unit.maxHp) * 100, 100)}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-green-400"
          />
        </div>
        <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: `${unit.burst}%` }} 
            className={`h-full ${unit.burst >= 100 ? 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]' : 'bg-cyan-600'}`} 
          />
        </div>
      </div>

      {/* Background Icon Watermark */}
      <div className="absolute bottom-[-10%] right-[-10%] opacity-5 rotate-12 pointer-events-none">
         <Activity size={60} />
      </div>
    </NineSlicePanel>
  );
}

function SkillButton({ skill, onUse, cooldown }: { skill: SkillDefinition, onUse: () => void, cooldown?: number }) {
  const getIcon = () => {
    const id = (skill.id || '').toLowerCase();
    if (id.includes('heal') || id.includes('aid')) return <Heart size={24} className="text-pink-400" />;
    if (id.includes('fire') || id.includes('meteor')) return <Zap size={24} className="text-orange-500" />;
    if (id.includes('bash') || id.includes('strike')) return <Swords size={24} className="text-red-400" />;
    return <Zap size={24} className="text-cyan-400" />;
  };

  return (
    <ActionButton 
      onClick={onUse}
      disabled={!!cooldown}
      variant="skill"
      className="w-14 h-14"
      whileHover={!cooldown ? { scale: 1.1, y: -5 } : {}}
      whileTap={!cooldown ? { scale: 0.9 } : {}}
    >
      {getIcon()}
      
      {/* Skill Name Overlay on Hover */}
      <div className="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[6px] font-black text-white uppercase text-center block tracking-tighter">{skill.name}</span>
      </div>

      {cooldown && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
           <span className="text-[12px] font-black text-[#F5C76B] leading-none">{cooldown}</span>
           <span className="text-[6px] font-black text-[#F5C76B]/60 uppercase tracking-tighter">Turnos</span>
        </div>
      )}
      
      {!cooldown && (
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-shimmer" />
      )}
    </ActionButton>
  );
}

function LoadingScreen() {
  return (
    <div 
      className="flex-1 flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/bg/loginbg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10">
        <LoadingSpinner text="Preparando escenario..." />
      </div>
    </div>
  );
}

function ErrorScreen({ error, onBack }: { error: string, onBack: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#020508] p-8">
      <ErrorDisplay
        title="Incompatibilidad de Batallón"
        message={error}
        onRetry={onBack}
      />
    </div>
  );
}

function BattleResult({ winner, completionData, isRecording, onConfirm }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-50 bg-[#050A0F]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center overflow-hidden"
    >
      {/* Background Glow */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${winner === 'player' ? 'bg-yellow-500' : 'bg-red-900'}`} />
      
      <motion.div 
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }} 
        animate={{ scale: 1, rotate: 0, opacity: 1 }} 
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <Award size={100} className={winner === 'player' ? 'text-[#F5C76B] relative drop-shadow-[0_0_30px_rgba(245,199,107,0.8)]' : 'text-red-500 relative'} />
      </motion.div>

      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-black text-white tracking-[0.3em] uppercase italic drop-shadow-2xl"
      >
        {winner === 'player' ? 'Victory' : 'Defeated'}
      </motion.h2>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="h-1 bg-gradient-to-r from-transparent via-[#F5C76B] to-transparent mt-4 mb-8"
      />

       {winner === 'player' && completionData && (
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="flex flex-col items-center gap-8 w-full max-w-sm"
         >
           <div className="flex gap-6">
             {[1, 2, 3].map(s => (
               <motion.div
                 key={s}
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 1 + (s * 0.2), type: 'spring' }}
               >
                 <StarIcon size={48} className={s <= (completionData.stars || 0) ? 'text-[#F5C76B] fill-current drop-shadow-[0_0_15px_rgba(245,199,107,0.5)]' : 'text-white/5'} />
               </motion.div>
             ))}
           </div>

           <NineSlicePanel
             type="border"
             variant="default"
             className="w-full p-8"
             glassmorphism={true}
           >
             <div className="flex items-center justify-center gap-3 mb-6 text-[#F5C76B]">
                <div className="h-px w-8 bg-[#F5C76B]/40" />
                <Gift size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Rewards</span>
                <div className="h-px w-8 bg-[#F5C76B]/40" />
             </div>

             <div className="flex justify-center gap-6">
               <div className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center shadow-2xl hover:border-[#F5C76B]/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                       <span className="text-yellow-500 font-bold text-xs">Z</span>
                    </div>
                 </div>
                 <span className="text-sm font-black text-white">+{completionData.rewards.currency}</span>
                 <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Zeny</span>
               </div>

{completionData.rewards.premium_currency > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-black/40 border border-[#F5C76B]/20 flex items-center justify-center shadow-2xl hover:border-[#F5C76B]/60 transition-colors">
                       <StarIcon size={24} className="text-[#F5C76B] fill-current" />
                    </div>
                    <span className="text-sm font-black text-[#F5C76B]">+{completionData.rewards.premium_currency}</span>
                    <span className="text-[7px] font-black text-[#F5C76B]/40 uppercase tracking-widest">Gems</span>
                  </div>
                )}
              </div>

              {/* Materials / Loot Display */}
              {completionData.rewards.materials && completionData.rewards.materials.length > 0 && (
                <div className="mt-6 w-full">
                  <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3">Loot</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {completionData.rewards.materials.map((mat: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                           <Sparkles size={14} className="text-purple-400" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-black text-white">{mat.itemId}</span>
                          <span className="text-[8px] font-black text-purple-400 ml-1">x{mat.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXP Display */}
              {completionData.rewards.exp > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <Zap size={16} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-black text-blue-400">+{completionData.rewards.exp} EXP</span>
                </div>
              )}
            </NineSlicePanel>
         </motion.div>
       )}

      <div className="absolute bottom-12 flex flex-col items-center gap-6">
        {isRecording && (
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-2"
          >
             <Terminal size={12} className="text-[#F5C76B]" />
             <span className="text-[9px] font-black text-[#F5C76B] uppercase tracking-[0.5em]">Synchronizing Records</span>
          </motion.div>
        )}
        
        <Button
          onClick={onConfirm}
          variant="primary"
          className="font-black py-4 px-20 rounded-full tracking-[0.3em] uppercase text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          style={{ backgroundColor: 'white', color: 'black' }}
        >
          Continue Expedition
        </Button>
      </div>
    </motion.div>
  );
}
