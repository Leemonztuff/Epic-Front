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
import { CombatUnit, SkillDefinition, Element } from '@/lib/types/combat';
import { BattleManager } from '@/lib/services/battle-manager';
import { CombatAdapter } from '@/lib/services/combat-adapter';
import { CampaignService } from '@/lib/services/campaign-service';
import { logger } from '@/lib/logger';
import { Stage } from '@/lib/rpg-system/campaign-types';
import type { GameUnit } from '@/lib/types/game-types';

interface BattleScreenViewProps {
  squad: GameUnit[];
  stageId?: string;
  onBack: () => void;
  onRefresh: () => void;
}

interface BattleRewards {
  currency: number;
  premium_currency?: number;
  exp?: number;
  materials?: Array<{ itemId: string; amount: number; chance?: number }>;
}

interface BattleCompletionData {
  stars: number;
  rewards: BattleRewards;
  isFirstClear?: boolean;
  firstClearBonus?: Record<string, unknown>;

  clearCount?: number;
  diminishingReturns?: boolean;
}

interface BattleResultProps {
  winner: 'player' | 'enemy';
  completionData: BattleCompletionData | null;
  isRecording: boolean;
  recordingTimeout: boolean;
  recordingFailed: boolean;
  onConfirm: () => void;
}

export function BattleScreenView({ squad, stageId, onBack, onRefresh }: BattleScreenViewProps) {
  const [units, setUnits] = useState<CombatUnit[]>([]);
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [battleLog, setBattleLog] = useState<{ id: number; text: string }[]>([]);
  const logIdRef = useRef(0);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<BattleCompletionData | null>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const [recordingTimeout, setRecordingTimeout] = useState(false);
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isBurstActive, setIsBurstActive] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, value: number, x: number, y: number, color: string, isCrit?: boolean }[]>([]);
  const [participatingUnits, setParticipatingUnits] = useState<Set<string>>(new Set());
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<'1x' | '2x'>('1x');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // INTENSE COMBAT FEEDBACK SYSTEM
  const [comboCount, setComboCount] = useState(0);
  const [lastHitType, setLastHitType] = useState<string>('');
  const [combatLog, setCombatLog] = useState<{ text: string, type: string, time: number }[]>([]);
  
  // INTENSE VISUAL FEEDBACK STATES
  const [screenFlash, setScreenFlash] = useState<'none' | 'crit' | 'combo' | 'chain' | 'spark'>('none');
  const [sparkCount, setSparkCount] = useState(0);
  const [screenShakeIntensity, setScreenShakeIntensity] = useState(0);
  const [chainMultiplier, setChainMultiplier] = useState(1);
  const [chainCount, setChainCount] = useState(0);
  const [lastComboMilestone, setLastComboMilestone] = useState(0);
  const [screenGlow, setScreenGlow] = useState<'none' | 'gold' | 'fire' | 'ice' | 'dark'>('none');
  const [hitSequence, setHitSequence] = useState<{ id: number, value: number, time: number }[]>([]);
  const [dyingEnemyIds, setDyingEnemyIds] = useState<string[]>([]);

  // Refs for combo tracking to avoid stale closures in rapid multi-hit
  const comboCountRef = useRef(0);
  const lastComboMilestoneRef = useRef(0);
  
  // Track all timeouts for cleanup
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  // Helper to track timeouts for cleanup
  const setTimer = (fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    timersRef.current.push(timer);
    return timer;
  };

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const prefersReducedMotion = usePrefersReducedMotion();

  const turnOrder = useMemo(() => BattleManager.getTurnOrder(units), [units]);
  const nextTurns = useMemo(() => {
    if (!activeUnitId) return [];
    const idx = turnOrder.findIndex(u => u.id === activeUnitId);
    if (idx === -1) return [];
    return turnOrder.slice(idx + 1, idx + 6);
  }, [turnOrder, activeUnitId]);

  // Reset auto-battle when battle ends
  useEffect(() => { if (isBattleOver) setAutoBattle(false); }, [isBattleOver]);

  // Escape key handling for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) setShowExitConfirm(false);
      }
    };
    if (showExitConfirm) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showExitConfirm]);

  const playerUnits = useMemo(() => units.filter(u => u.side === 'player'), [units]);
  const alivePlayerUnits = useMemo(() => units.filter(u => u.side === 'player' && !u.isDead), [units]);
  const enemyUnits = useMemo(() => units.filter(u => u.side === 'enemy' && !u.isDead), [units]);

  // Reset target if targeted enemy is dead
  useEffect(() => {
    if (targetId && !enemyUnits.some(u => u.id === targetId)) {
      setTargetId(null);
    }
  }, [targetId, enemyUnits]);

  // Track dying enemies for fade-out animation
  const prevAliveEnemyIds = useRef<string[]>([]);
  useEffect(() => {
    const currentIds = enemyUnits.map(u => u.id);
    if (prevAliveEnemyIds.current.length > 0) {
      const newlyDead = prevAliveEnemyIds.current.filter(id => !currentIds.includes(id));
      if (newlyDead.length > 0) {
        setDyingEnemyIds(prev => [...prev, ...newlyDead]);
        setTimeout(() => setDyingEnemyIds(prev => prev.filter(id => !newlyDead.includes(id))), 1000);
      }
    }
    prevAliveEnemyIds.current = currentIds;
  }, [enemyUnits]);

  // Statistics for Star calculation
  const [stats, setStats] = useState({
    totalTurns: 0,
    playerDeaths: 0
  });

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
        setParticipatingUnits(new Set(playerUnits.map(u => u.id)));
        setIsInitializing(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error al inicializar combate";
        setInitError(message);
        setIsInitializing(false);
      }
    }
    initBattle();
  }, [squad, stageId]);

  const addDamageNumber = useCallback((value: number, unitId: string, color: string = 'text-white', isCrit: boolean = false, hitType: string = '') => {
    const now = Date.now();
    const newId = now + Math.random();
    const targetUnit = units.find(u => u.id === unitId);
    const positionIndex = targetUnit?.position ?? 0;
    const isEnemy = targetUnit?.side === 'enemy';
    const baseX = isEnemy ? (positionIndex - 1) * 80 : (positionIndex - 1) * 60;
    const baseY = isEnemy ? -60 - Math.random() * 30 : 20 - Math.random() * 40;
    
    setDamageNumbers(prev => {
      return [...prev, { id: newId, value, x: baseX + Math.random() * 20 - 10, y: baseY, color, isCrit }];
    });
    
    // Add to hit sequence for chain detection (fresh sequence inside setter avoids stale closure)
    setHitSequence(prev => {
      const newSeq = [...prev, { id: newId, value, time: now }];
      const filtered = newSeq.filter(h => now - h.time < 1500);
      const recentHits = filtered.filter(h => now - h.time < 500);
      if (recentHits.length >= 2) {
        const newChain = recentHits.length + 1;
        setChainCount(newChain);
        setChainMultiplier(Math.min(3, 1 + (newChain - 2) * 0.5));
        setScreenFlash('chain');
        setTimeout(() => setScreenFlash('none'), 200);
      }
      return filtered;
    });
    
    // Update combo system with INTENSE effects (ref-based to avoid stale closures in rapid multi-hit)
    if (hitType === 'damage' || isCrit) {
      const newCombo = comboCountRef.current + 1;
      comboCountRef.current = newCombo;
      setComboCount(newCombo);
      setLastHitType(isCrit ? 'CRITICAL' : hitType);
      
      // CRITICAL HIT - MASSIVE FLASH
      if (isCrit) {
        setScreenFlash('crit');
        setScreenShakeIntensity(15);
        setScreenGlow('fire');
        setCombatLog(prev => [...prev.slice(-3), { text: `💥 CRÍTICO: ${value}!`, type: 'crit', time: now }]);
        setTimeout(() => { setScreenGlow('none'); setScreenShakeIntensity(0); }, 400);
      } 
      // COMBO MILESTONES
      else if (newCombo > 0 && newCombo % 5 === 0 && newCombo !== lastComboMilestoneRef.current) {
        lastComboMilestoneRef.current = newCombo;
        setLastComboMilestone(newCombo);
        setScreenFlash('combo');
        setScreenShakeIntensity(10);
        setScreenGlow('gold');
        setCombatLog(prev => [...prev.slice(-3), { text: `🔥 COMBO x${newCombo}!`, type: 'combo', time: now }]);
        setTimeout(() => { setScreenGlow('none'); setScreenShakeIntensity(0); }, 300);
      }
      // REGULAR HIT
      else {
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
  }, [units]);

  const runTurn = useCallback((actor: CombatUnit, skill: SkillDefinition, manualTargetId?: string, isBurst: boolean = false) => {
    if (isBattleOver) return;

    const currentSpark = isBurst ? 0 : sparkCount;
    const { results, updatedUnits } = isBurst
      ? BattleManager.executeBurstSkill(actor, skill, units, manualTargetId)
      : BattleManager.executeNormalAttack(actor, skill, units, manualTargetId, undefined, currentSpark);

    let hadSpark = false;
    results.forEach(r => {
      if (r.type === 'damage' && r.value && r.value > 0) {
        const color = isBurst ? 'text-yellow-300' : r.isSpark ? 'text-purple-400' : r.isEffective ? 'text-red-400' : r.isResisted ? 'text-gray-500' : 'text-red-500';
        addDamageNumber(r.value, r.targetId, color, isBurst);
        if (r.isSpark) hadSpark = true;
      }
    });

    if (!isBurst) {
      setSparkCount(prev => prev + 1);
    }

    if (hadSpark) {
      setCombatLog(prev => [...prev.slice(-5), { text: `✨ SPARK x${currentSpark}!`, type: 'spark', time: Date.now() }]);
      setScreenFlash('spark');
      setTimeout(() => setScreenFlash('none'), 300);
    }

    setParticipatingUnits(prev => {
      const newSet = new Set(prev);
      newSet.add(actor.id);
      return newSet;
    });

    setBattleLog(prev => [...prev, ...results.map(r => ({ id: ++logIdRef.current, text: r.log }))].slice(-20));
    setUnits(updatedUnits);
    setTurn(prev => prev + 1);
    setTargetId(null);
    setStats(prev => ({ ...prev, totalTurns: prev.totalTurns + 1 }));
  }, [isBattleOver, units, addDamageNumber, sparkCount]);

  const currentActor = useMemo(() => units.find(u => u.id === activeUnitId), [units, activeUnitId]);

  const handleBurst = useCallback(() => {
    if (isBattleOver || !currentActor || currentActor.side !== 'player') return;
    if (currentActor.burst < 100) return;
    if (currentActor.bbLevel >= 3 && currentActor.hasUsedUBB) return;

    setIsBurstActive(true);

    const burstSkill = BattleManager.getBurstSkillForUnit(currentActor);

    runTurn(currentActor, burstSkill, targetId || undefined, true);

    // Check for SBB/UBB upgrade after this use
    const newUses = currentActor.bbUses + 1;
    if (currentActor.bbLevel === 1 && newUses >= 3) {
      setScreenFlash('combo');
      setCombatLog(prev => [...prev.slice(-5), { text: `🌟 SBB DESBLOQUEADO!`, type: 'crit', time: Date.now() }]);
      setUnits(prev => prev.map(u =>
        u.id === currentActor.id ? { ...u, bbLevel: 2 } : u
      ));
    } else if (currentActor.bbLevel === 2 && newUses >= 7) {
      setScreenFlash('crit');
      setScreenGlow('fire');
      setCombatLog(prev => [...prev.slice(-5), { text: `💥 UBB DESBLOQUEADO!`, type: 'crit', time: Date.now() }]);
      setUnits(prev => prev.map(u =>
        u.id === currentActor.id ? { ...u, bbLevel: 3 } : u
      ));
      setTimeout(() => setScreenGlow('none'), 1500);
    }

    setTimeout(() => setIsBurstActive(false), 1500);
  }, [isBattleOver, currentActor, targetId, runTurn]);

  const handleBattleOver = useCallback(async (winnerSide: 'player' | 'enemy', deaths: number) => {
    setIsBattleOver(true);
    setWinner(winnerSide);
    if (winnerSide === 'player' && stageId) {
      setIsRecordingResult(true);
      try {
        const result = await CampaignService.completeStage(
          stageId, 
          { turns: round, deaths },
          Array.from(participatingUnits)
        );
        if (result) setCompletionData(result as BattleCompletionData);
     } catch (e: unknown) {
         logger.error('error', "Failed to record stage completion:", e as Error);
       } finally {
        setIsRecordingResult(false);
      }
    }
  }, [stageId, round, participatingUnits]);

  // Timeout for recording result - after 5s, allow continue even if server fails
  useEffect(() => {
    if (!isRecordingResult) {
      return;
    }
    setRecordingTimeout(false);
    const timer = setTimeout(() => setRecordingTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, [isRecordingResult]);

  // If recording finished but completionData is null, recording failed
  useEffect(() => {
    if (!isRecordingResult && !completionData && winner === 'player') {
      setRecordingFailed(true);
    }
  }, [isRecordingResult, completionData, winner]);

  useEffect(() => {
    if (isInitializing || isBattleOver || initError) return;

    const deadPlayers = playerUnits.filter(u => u.isDead).length;

    if (enemyUnits.length === 0) {
      handleBattleOver('player', deadPlayers);
      return;
    }
    if (alivePlayerUnits.length === 0) {
      handleBattleOver('enemy', deadPlayers);
      return;
    }

    const order = BattleManager.getTurnOrder(units);
    if (order.length === 0) return;

    if (turn >= order.length) {
      setTurn(0);
      setRound(prev => prev + 1);
      setSparkCount(0);
      setUnits(prev => prev.map(u => BattleManager.updateUnitStartTurn(u)));
      return;
    }

    const activeUnit = order[turn];
    setActiveUnitId(activeUnit.id);

    if (activeUnit.side === 'enemy') {
      const skill = activeUnit.skills[0];
      const delay = battleSpeed === '2x' ? 400 : 1000;
      const timer = setTimeout(() => runTurn(activeUnit, skill), delay);
      return () => clearTimeout(timer);
    }

    // Auto-battle: if player's turn and auto-battle is on
    if (autoBattle && activeUnit.side === 'player' && enemyUnits.length > 0) {
      const autoTargetId = enemyUnits[0].id;
      setTargetId(autoTargetId);
      const speedDelay = battleSpeed === '2x' ? 200 : 500;
      const useBB = activeUnit.burst >= 100;
      if (useBB) {
        const bbSkill = activeUnit.skills.find((s: SkillDefinition) => s.skillType === 'bb');
        if (bbSkill) {
          setIsBurstActive(true);
          const timer = setTimeout(() => { runTurn(activeUnit, bbSkill, autoTargetId, true); setIsBurstActive(false); }, speedDelay);
          return () => clearTimeout(timer);
        }
      }
      const skill = activeUnit.skills[0] || { id: 'attack', name: 'Attack', type: 'basic', cooldown: 0, effects: [] };
      const timer = setTimeout(() => runTurn(activeUnit, skill, autoTargetId), speedDelay);
      return () => clearTimeout(timer);
    }
  }, [units, turn, isInitializing, isBattleOver, initError, autoBattle, battleSpeed, enemyUnits, playerUnits, runTurn, handleBattleOver]);

  if (isInitializing) return <LoadingScreen />;
  if (initError) return <ErrorScreen error={initError} onBack={onBack} />;

  const totalPlayerHp = playerUnits.reduce((acc, u) => acc + u.currentHp, 0);
  const maxPlayerHp = playerUnits.reduce((acc, u) => acc + u.maxHp, 0);
  const totalEnemyHp = enemyUnits.reduce((acc, u) => acc + u.currentHp, 0);
  const maxEnemyHp = enemyUnits.reduce((acc, u) => acc + u.maxHp, 0);

  return (
    <motion.div 
      animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-5, 5, 5, -5, 0] } : {}}
      transition={{ duration: 0.1, repeat: 2 }}
      className="flex flex-col h-[100dvh] bg-[#0A1630] overflow-hidden relative font-sans text-white select-none"
      style={screenShakeIntensity > 0 ? {
        animation: `shake ${screenShakeIntensity / 100}s ease-in-out`,
      } : undefined}
    >
      {/* ═══ LAYER 1: BATTLE BACKGROUND ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-50 scale-110" style={{ backgroundImage: `url('${AssetService.getBgUrl('battle')}')` }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_10%,#0A1630_60%,#050810_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1630]/50 via-transparent to-[#0A1630]" />
        {/* Atmospheric magic glow behind enemy area */}
        <motion.div 
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[70%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full"
        />
        {/* Ground fog */}
        <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-[#0A1630] via-[#0A1630]/50 to-transparent pointer-events-none" />
        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] pointer-events-none" />
      </div>

      {/* ═══ LAYER 5: TOP STATUS HUD ═══ */}
      <div className="relative z-30 px-3 pt-10 pb-2">
        {/* Controls row */}
        <div className="flex justify-between items-center mb-2">
          <Button onClick={() => { if (isBattleOver) { onBack(); } else { setShowExitConfirm(true); } }} variant="ghost" size="sm" className="w-9 h-9 rounded-lg bg-[#0A1630] border-2 border-[#E0B45E]/40 flex items-center justify-center text-[#E0B45E] active:scale-90"><ChevronLeft size={18} /></Button>
          
          {/* Stage & Turn info */}
          <div className="bg-[#0A1630]/90 border-2 border-[#E0B45E]/50 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(224,180,94,0.1)]">
            <div className="flex items-center gap-2 justify-center">
              <Swords size={11} className="text-[#E0B45E]" />
              <span className="text-[10px] font-black text-[#E0B45E] uppercase tracking-[0.15em]">STAGE {stageId?.replace('stage_', '').replace('_', '-')}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">R{round}</span>
              <div className="w-0.5 h-0.5 rounded-full bg-[#E0B45E]/40" />
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">T{stats.totalTurns}</span>
            </div>
          </div>

          {/* Turn indicator */}
          {currentActor && (
            <div className={`px-2 py-1 rounded-lg border-2 text-[7px] font-black uppercase tracking-wider ${
              currentActor.side === 'player' 
                ? 'bg-cyan-900/60 border-cyan-500/40 text-cyan-300' 
                : 'bg-red-900/60 border-red-500/40 text-red-300'
            }`}>
              {currentActor.side === 'player' ? '▶ TU TURNO' : '⏳ ENEMIGO'}
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button onClick={() => setAutoBattle(!autoBattle)} variant="ghost" size="sm" className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center active:scale-90 ${autoBattle ? 'bg-green-900/60 border-green-500/50 text-green-300' : 'bg-[#0A1630] border-[#E0B45E]/30 text-[#E0B45E]/50'}`} title="Auto-battle">
              <Zap size={16} className={autoBattle ? 'animate-pulse' : ''} />
            </Button>
            <Button onClick={() => setBattleSpeed(s => s === '1x' ? '2x' : '1x')} variant="ghost" size="sm" className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center active:scale-90 ${battleSpeed === '2x' ? 'bg-cyan-900/60 border-cyan-500/50 text-cyan-300' : 'bg-[#0A1630] border-[#E0B45E]/30 text-[#E0B45E]/50'}`}>
              <span className="text-[9px] font-black">{battleSpeed}</span>
            </Button>
          </div>
        </div>

        {/* BOSS HP BAR — Gold framed, glossy red */}
        <div className="relative">
          <div className="relative h-7 bg-black rounded-sm overflow-hidden border-2 border-[#E0B45E]/60 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${Math.min((totalEnemyHp / maxEnemyHp) * 100, 100)}%` }}
              className="h-full relative"
            >
              {enemyUnits.length > 1 ? (
                <div className="flex h-full">
                  {enemyUnits.map(enemy => (
                    <div key={enemy.id} className="h-full relative" style={{ width: `${(enemy.maxHp / maxEnemyHp) * 100}%` }}>
                      <div className="h-full bg-gradient-to-b from-[#F55] via-[#D83B32] to-[#8B1A1A]" style={{ width: `${Math.min((enemy.currentHp / enemy.maxHp) * 100, 100)}%` }} />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,transparent_40%,rgba(0,0,0,0.3)_100%)]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full bg-gradient-to-b from-[#F55] via-[#D83B32] to-[#8B1A1A] relative">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,transparent_40%,rgba(0,0,0,0.3)_100%)]" />
                  <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
                </div>
              )}
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              {totalEnemyHp.toLocaleString()} <span className="mx-1 text-white/40">/</span> {maxEnemyHp.toLocaleString()}
            </div>
          </div>
          {/* Gold corner accents */}
          <div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-[#E0B45E]" />
          <div className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 border-[#E0B45E]" />
          <div className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 border-[#E0B45E]" />
          <div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-[#E0B45E]" />
        </div>

        {/* Player HP Bar — Gold framed, glossy green */}
        <div className="relative mt-1.5">
          <div className="relative h-4 bg-black rounded-sm overflow-hidden border border-[#4ade80]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <motion.div initial={{ width: '100%' }} animate={{ width: `${Math.min((totalPlayerHp / maxPlayerHp) * 100, 100)}%` }} className="h-full bg-gradient-to-b from-[#6F6] via-[#4ade80] to-[#166534] relative">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_40%,rgba(0,0,0,0.2)_100%)]" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-[0.15em] drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
              {totalPlayerHp.toLocaleString()} <span className="mx-1 text-white/40">/</span> {maxPlayerHp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Elemental Orbs */}
        <div className="flex justify-center gap-3 mt-2">
          {['#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#c084fc'].map((color, i) => (
            <motion.div key={i} animate={{ y: [0, -2, 0], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} className="w-3.5 h-3.5 rounded-full border-2 border-white/20 shadow-[0_0_8px_rgba(0,0,0,0.4)] relative" style={{ backgroundColor: color }}>
              <div className="absolute top-[2px] left-[2px] w-1.5 h-1.5 rounded-full bg-white/40" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ LAYER 2+3: BATTLE FIELD ═══ */}
      <div className="flex-1 relative z-10 px-2 flex items-center justify-center overflow-hidden">
        {/* Target instruction banner */}
        {currentActor?.side === 'player' && !targetId && !autoBattle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-[#0A1630]/90 border-2 border-[#E0B45E]/50 rounded-lg"
          >
            <span className="text-[9px] font-black text-[#E0B45E] uppercase tracking-wider">⚔ SELECCIONA ENEMIGO</span>
          </motion.div>
        )}

        {/* BATTLEFIELD GRID — Allies LEFT, Enemies RIGHT */}
        <div className="w-full h-full flex items-center justify-between px-2 relative">
          
          {/* ALLY SIDE — Left, diagonal stagger */}
          <div className="relative flex flex-col items-start justify-end gap-2 h-full pb-4" style={{ width: '40%' }}>
            {playerUnits.map((unit, i) => (
              <div 
                key={unit.id} 
                className="relative"
                style={{ 
                  marginLeft: `${i * 20}px`,
                  marginBottom: i === 0 ? '0' : '-10px',
                  zIndex: 20 + i,
                }}
              >
                <PlayerSprite unit={unit} isActive={unit.id === activeUnitId} />
              </div>
            ))}
          </div>

          {/* ENEMY SIDE — Right, diagonal stagger */}
          <div className="relative flex flex-col items-end justify-start gap-2 h-full pt-4" style={{ width: '50%' }}>
            <AnimatePresence>
              {enemyUnits.map((enemy, i) => (
                <div 
                  key={enemy.id}
                  className="relative"
                  style={{
                    marginRight: `${i * 15}px`,
                    marginTop: i === 0 ? '0' : '-10px',
                    zIndex: 20 + i,
                  }}
                >
                  <EnemySprite enemy={enemy} isTargeted={targetId === enemy.id} onTarget={() => setTargetId(enemy.id)} />
                </div>
              ))}
              {dyingEnemyIds.map(id => {
                const deadEnemy = units.find(u => u.id === id);
                if (!deadEnemy) return null;
                return (
                  <motion.div
                    key={deadEnemy.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0, scale: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="pointer-events-none"
                  >
                    <EnemySprite enemy={deadEnemy} isTargeted={false} onTarget={() => {}} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
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
          
          {/* SPARK FLASH */}
          {screenFlash === 'spark' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-purple-500/20 pointer-events-none z-[100] mix-blend-screen"
            >
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-purple-300 font-black text-[36px] tracking-widest uppercase opacity-60 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]">
                SPARK!
              </div>
            </motion.div>
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

        {/* Damage Numbers — Arcade JRPG style */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <AnimatePresence>
            {damageNumbers.map(d => (
              <motion.div
                key={d.id}
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, y: 0, scale: 0.3, rotate: -15 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: d.y, scale: d.isCrit ? 3 : 2, rotate: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.1, y: d.y - 40 }}
                transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', damping: 8, stiffness: 120 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-3xl italic flex flex-col items-center z-60 ${d.color}`}
                style={{ 
                  marginLeft: d.x,
                  WebkitTextStroke: '2px black',
                  textShadow: '0 4px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.5)',
                }}
              >
                {d.isCrit && <span className="text-[10px] uppercase tracking-[0.3em] mb-[-4px] text-[#E0B45E] font-black" style={{ WebkitTextStroke: '1px black' }}>CRITICAL</span>}
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

          {/* Combat Log — JRPG gold frame */}
          <div className="bg-[#0A1630]/90 rounded-lg p-2.5 max-w-[180px] border border-[#E0B45E]/30 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <div className="text-[#E0B45E]/60 text-[7px] font-black uppercase tracking-wider mb-1">Combat Log</div>
            <AnimatePresence>
              {combatLog.slice().reverse().map((log, idx) => (
                <motion.div
                  key={log.time}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[10px] font-bold py-0.5 border-b border-[#E0B45E]/10 last:border-0 ${
                    log.type === 'crit' ? 'text-[#E0B45E]' : 
                    log.type === 'combo' ? 'text-orange-400' :
                    'text-white/60'
                  }`}
                >
                  {log.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

       {/* ═══ TURN TIMELINE — Gold framed ═══ */}
       {!isBattleOver && !isInitializing && turnOrder.length > 0 && (
         <div className="relative z-30 px-3 pb-1">
           <div className="flex items-center gap-1.5 justify-center bg-[#0A1630]/80 border border-[#E0B45E]/20 rounded-lg px-3 py-1">
             <span className="text-[6px] font-black text-[#E0B45E]/60 uppercase tracking-widest mr-1">NEXT:</span>
             {nextTurns.map((u, i) => (
               <div key={u.id} className="flex items-center gap-0.5">
                 <div className={`w-6 h-6 rounded border ${u.side === 'enemy' ? 'border-red-500/40 bg-red-900/40' : 'border-cyan-500/40 bg-cyan-900/40'} flex items-center justify-center overflow-hidden`}>
                   <img src={AssetService.getSpriteUrl(u.sprite_id || '')} className="w-5 h-5 object-contain" alt="" style={{ imageRendering: 'pixelated' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                 </div>
                 {i < nextTurns.length - 1 && <span className="text-[#E0B45E]/30 text-[6px]">▸</span>}
               </div>
             ))}
           </div>
         </div>
       )}

       {/* ═══ BOTTOM HUD: Party Strip + Action Bar ═══ */}
       <div className="relative z-30 pb-6 px-3 flex flex-col gap-2">
         {/* Party Strip — Fantasy metallic frames */}
         <div className="grid grid-cols-4 gap-2">
           {playerUnits.map((unit) => (
             <UnitCard key={unit.id} unit={unit} isActive={unit.id === activeUnitId} />
           ))}
         </div>

         {/* Action Bar — Dark metallic panel with gold accents */}
         <div className="relative bg-[#0A1630]/90 border-2 border-[#E0B45E]/40 rounded-lg p-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
           {/* Gold top border glow */}
           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E0B45E]/50 to-transparent" />
           {/* Gold corner accents */}
           <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-[#E0B45E]/70 rounded-tl" />
           <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-[#E0B45E]/70 rounded-tr" />
           <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-[#E0B45E]/70 rounded-bl" />
           <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-[#E0B45E]/70 rounded-br" />
           
           <div className="flex-1 flex gap-2">
             {currentActor?.side === 'player' && currentActor.skills.map((skill, idx) => (
               <SkillButton 
                 key={skill.id || `skill-${idx}`} 
                 skill={skill} 
                 onUse={() => runTurn(currentActor, skill, targetId || undefined)} 
                 cooldown={currentActor.cooldowns[skill.id || '']}
               />
             ))}
           </div>

             {currentActor?.side === 'player' && (
               <div className={`relative rounded-full ${
                 currentActor.bbLevel >= 3 && (currentActor?.burst || 0) >= 100 ? 'shadow-[0_0_40px_rgba(168,85,247,0.8)]' :
                 currentActor.bbLevel >= 2 && (currentActor?.burst || 0) >= 100 ? 'shadow-[0_0_30px_rgba(250,204,21,0.6)]' :
                 (currentActor?.burst || 0) >= 100 ? 'shadow-[0_0_30px_rgba(239,68,68,0.4)]' : ''
               }`}>
               <ActionButton
                 onClick={handleBurst}
                 variant="burst"
                 disabled={!currentActor || (currentActor?.burst || 0) < 100 || isBurstActive || (currentActor.bbLevel >= 3 && currentActor.hasUsedUBB)}
                 className={`w-18 h-18 rounded-full p-1 group relative ${(currentActor?.burst || 0) >= 100 ? 'animate-pulse' : ''}`}
                 whileHover={(currentActor?.burst || 0) >= 100 && !(currentActor.bbLevel >= 3 && currentActor.hasUsedUBB) ? { scale: 1.08 } : {}}
                 whileTap={(currentActor?.burst || 0) >= 100 ? { scale: 0.9 } : {}}
               >
                   <div className={`w-full h-full bg-[#0A1630] rounded-full flex flex-col items-center justify-center border-3 ${
                     currentActor.bbLevel >= 3 && (currentActor?.burst || 0) >= 100 ? 'border-purple-500' :
                     currentActor.bbLevel >= 2 && (currentActor?.burst || 0) >= 100 ? 'border-yellow-400' :
                     (currentActor?.burst || 0) >= 100 ? 'border-red-400' : 'border-[#E0B45E]/30'
                   }`}>
                      {isBurstActive ? (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 2, opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          className="text-yellow-300 font-black text-xs uppercase tracking-widest"
                        >
                          {currentActor.bbLevel >= 3 ? 'UBB!' : currentActor.bbLevel >= 2 ? 'SBB!' : 'BB!'}
                        </motion.div>
                      ) : currentActor.bbLevel >= 3 && currentActor.hasUsedUBB ? (
                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">USADO</span>
                      ) : (
                        <>
                          <motion.div
                            animate={(currentActor?.burst || 0) >= 100 ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.4 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-white/10 rounded-full"
                          />
                          <span className={`text-[7px] font-black uppercase tracking-widest leading-none mb-0.5 ${(currentActor?.burst || 0) >= 100 ? 'text-yellow-300' : 'text-white/60'}`}>
                            {currentActor.bbLevel >= 3 ? 'UBB' : currentActor.bbLevel >= 2 ? 'SBB' : 'BB'}
                          </span>
                          <span className={`text-[11px] font-black uppercase leading-none italic drop-shadow-lg ${(currentActor?.burst || 0) >= 100 ? 'text-yellow-300' : 'text-white'}`}>
                            {currentActor.bbLevel >= 3 ? 'ULTIMATE' : currentActor.bbLevel >= 2 ? 'SUPER' : 'BRAVE'}
                          </span>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                currentActor.bbLevel >= 3 && (currentActor?.burst || 0) >= 100 ? 'bg-purple-500' :
                                currentActor.bbLevel >= 2 && (currentActor?.burst || 0) >= 100 ? 'bg-yellow-400' :
                                (currentActor?.burst || 0) >= 100 ? 'bg-yellow-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${currentActor?.burst || 0}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                 </ActionButton>
               </div>
              )}
         </div>
       </div>

        {/* Battle Log Overlay — JRPG style */}
         <div className="absolute top-40 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-20">
           <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setShowBattleLog(!showBattleLog)}
                className="pointer-events-auto text-[7px] font-black uppercase tracking-widest px-3 py-1 bg-[#0A1630]/80 border border-[#E0B45E]/30 rounded text-[#E0B45E]/70 hover:text-[#E0B45E] transition-colors"
              >
                {showBattleLog ? 'OCULTAR LOG' : 'VER LOG'}
              </button>
             {showBattleLog && (
               <div className="w-full max-h-[80px] overflow-y-auto flex flex-col gap-0.5 p-2 bg-[#0A1630]/90 border border-[#E0B45E]/20 rounded-lg">
                  {battleLog.slice(-5).map(log => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-l-2 border-[#E0B45E]/30 pl-1.5 py-0.5"
                      style={{ lineHeight: '1.2' }}
                    >
                      <span className="text-[6px] font-mono text-white/60 uppercase tracking-wider">{log.text}</span>
                    </motion.div>
                  ))}
               </div>
             )}
           </div>
         </div>

      {/* Exit Confirmation — JRPG Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/85 flex items-center justify-center"
            onClick={() => setShowExitConfirm(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-[#0A1630] border-2 border-[#E0B45E]/60 rounded-lg p-8 mx-4 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              {/* Gold corner accents */}
              <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[#E0B45E] rounded-tl" />
              <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[#E0B45E] rounded-tr" />
              <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[#E0B45E] rounded-bl" />
              <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[#E0B45E] rounded-br" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E0B45E]/40 to-transparent" />
              
              <h3 className="text-lg font-black text-[#E0B45E] text-center mb-2 uppercase tracking-wider">¿Abandonar batalla?</h3>
              <p className="text-[10px] text-white/50 text-center mb-6">Perderás el progreso de esta batalla.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-[#0A1630] border-2 border-[#E0B45E]/30 rounded-lg text-white/70 hover:border-[#E0B45E]/60 hover:text-white transition-all active:scale-95">Cancelar</button>
                <button onClick={() => { setShowExitConfirm(false); onBack(); }} className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-red-900/80 border-2 border-red-500/50 rounded-lg text-red-200 hover:bg-red-800 hover:border-red-400 transition-all active:scale-95">Salir</button>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory/Defeat Overlay */}
      <AnimatePresence>
        {isBattleOver && winner && <BattleResult winner={winner} completionData={completionData} isRecording={isRecordingResult} recordingTimeout={recordingTimeout} recordingFailed={recordingFailed} onConfirm={() => { onRefresh(); onBack(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ef4444', water: '#3b82f6', earth: '#22c55e',
  thunder: '#eab308', light: '#f8fafc', dark: '#a855f7', none: '#6b7280',
};
const ELEMENT_LABELS: Record<string, string> = {
  fire: 'FUEGO', water: 'AGUA', earth: 'TIERRA',
  thunder: 'RAYO', light: 'LUZ', dark: 'OSCURIDAD', none: '---',
};

function ElementBadge({ element }: { element: string }) {
  const color = ELEMENT_COLORS[element] || '#6b7280';
  return (
    <div
      className="w-4 h-4 rounded-full border border-white/30 shadow-[0_0_6px_rgba(0,0,0,0.5)] flex-shrink-0"
      style={{ backgroundColor: color }}
      title={ELEMENT_LABELS[element] || element}
    />
  );
}

function EnemySprite({ enemy, isTargeted, onTarget }: { enemy: CombatUnit, isTargeted: boolean, onTarget: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: isTargeted ? [0, -4, 0] : [0, -2, 0],
        scale: isTargeted ? 1.1 : 1 
      }}
      transition={isTargeted ? { repeat: Infinity, duration: 0.8 } : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      onClick={onTarget}
      className="relative cursor-pointer group"
      style={{ zIndex: isTargeted ? 60 : 20 + (enemy.position ?? 0) }}
    >
      {/* Enemy info plate — Gold framed */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1 bg-[#0A1630]/80 border border-[#E0B45E]/30 rounded px-1.5 py-0.5">
           <ElementBadge element={enemy.element} />
           <span className="text-[7px] font-black text-[#E0B45E] uppercase tracking-wider truncate">{enemy.name}</span>
        </div>
        {/* HP bar — gold frame, glossy red */}
        <div className="w-full relative">
          <div className="h-2.5 bg-black rounded-sm overflow-hidden border border-[#E0B45E]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="h-full bg-gradient-to-b from-[#F55] via-[#D83B32] to-[#8B1A1A] relative" style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_40%,rgba(0,0,0,0.2)_100%)]" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-[6px] font-black tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {enemy.currentHp}/{enemy.maxHp}
          </div>
        </div>
      </div>

      {/* Target Marker — Golden crosshair */}
      {isTargeted && (
        <>
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -inset-4 border-2 border-[#E0B45E] rounded-lg pointer-events-none"
          />
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-[#E0B45E] text-lg font-black drop-shadow-[0_0_10px_rgba(224,180,94,0.8)]"
          >
            ⊕
          </motion.div>
        </>
      )}

      {/* Ground shadow */}
      <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-20 h-4 bg-black/50 rounded-full blur-md" />

      {imgError ? (
        <div className="w-36 h-36 flex items-center justify-center bg-red-900/20 border-2 border-red-500/30 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">?</div>
            <span className="text-[8px] font-black text-red-400 uppercase">{enemy.name}</span>
          </div>
        </div>
      ) : (
        <img 
          src={AssetService.getSpriteUrl(enemy.sprite_id || "abbys_sprite_001")}
          onError={() => setImgError(true)}
          className={`w-36 h-36 object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)] scale-x-[-1] transition-all duration-300 ${isTargeted ? 'brightness-125 saturate-150' : 'brightness-95'}`}
          style={{ imageRendering: 'pixelated', transformOrigin: 'bottom center' }}
        />
      )}
    </motion.div>
  );
}

function PlayerSprite({ unit, isActive }: { unit: CombatUnit, isActive: boolean }) {
  return (
    <motion.div 
      animate={{ 
        y: isActive ? [0, -8, 0] : [0, -3, 0],
        scale: isActive ? 1.15 : 1,
        opacity: unit.isDead ? 0.3 : 1
      }}
      transition={isActive ? { repeat: Infinity, duration: 1.2 } : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      className="relative flex-shrink-0 min-w-[80px]"
      style={{ zIndex: isActive ? 50 : 30 }}
    >
      {/* Magic circle for active unit — golden JRPG style */}
       {isActive && (
         <>
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
             className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 w-28 h-10 border-2 border-[#E0B45E]/40 rounded-full bg-[#E0B45E]/5 z-0"
           />
           <motion.div 
             animate={{ opacity: [0.3, 0.7, 0.3] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-20 h-6 bg-[#E0B45E]/20 rounded-full blur-md z-0"
           />
         </>
       )}
       
       {/* Ground shadow */}
       <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-18 h-5 bg-black/60 rounded-full blur-md z-0" />
      
      <img 
        src={AssetService.getSpriteUrl(unit.sprite_id || AssetService.getJobSpriteId('novice'))}
        className={`w-32 h-32 object-contain transform origin-bottom drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-10 transition-all ${isActive ? 'brightness-125 drop-shadow-[0_0_20px_rgba(224,180,94,0.3)]' : 'brightness-100'}`}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Active unit name tag */}
      {isActive && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#0A1630]/90 border border-[#E0B45E]/40 rounded px-2 py-0.5 z-20">
          <span className="text-[7px] font-black text-[#E0B45E] uppercase tracking-wider whitespace-nowrap">{unit.name}</span>
        </div>
      )}
    </motion.div>
  );
}

function UnitCard({ unit, isActive }: { unit: CombatUnit, isActive: boolean }) {
  return (
    <div
      className={`relative flex flex-col p-2 overflow-hidden rounded-lg ${isActive ? 'ring-2 ring-[#E0B45E] shadow-[0_0_15px_rgba(224,180,94,0.3)]' : ''}`}
      style={{
        backgroundColor: isActive ? 'rgba(224,180,94,0.1)' : 'rgba(10,22,48,0.9)',
        border: `1.5px solid ${isActive ? 'rgba(224,180,94,0.6)' : 'rgba(224,180,94,0.2)'}`,
      }}
    >
      {/* Glossy top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E0B45E]/30 to-transparent" />
      
      {/* Unit Name & Element */}
      <div className="flex items-center gap-1 mb-1 relative z-10">
         <ElementBadge element={unit.element} />
         <span className="text-[8px] font-black text-white uppercase tracking-wider truncate flex-1">{unit.name}</span>
         {unit.bbLevel >= 2 && (
           <span className={`text-[5px] font-black px-1 rounded border ${unit.bbLevel >= 3 ? 'border-purple-500/40 bg-purple-500/20 text-purple-300' : 'border-yellow-400/40 bg-yellow-400/20 text-yellow-300'}`}>
             {unit.bbLevel >= 3 ? 'UBB' : 'SBB'}
           </span>
         )}
      </div>

      {/* HP Bar — Gold framed, glossy green */}
      <div className="space-y-1 relative z-10 mt-auto">
        <div className="relative">
          <div className="h-2.5 bg-black rounded-sm overflow-hidden border border-[#E0B45E]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <motion.div 
              animate={{ width: `${Math.min((unit.currentHp / unit.maxHp) * 100, 100)}%` }}
              className="h-full bg-gradient-to-b from-[#6F6] via-[#4ade80] to-[#166534] relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_40%,rgba(0,0,0,0.2)_100%)]" />
            </motion.div>
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-1">
             <span className="text-[5px] font-black text-white/60 uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">HP</span>
             <span className="text-[6px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{unit.currentHp}</span>
          </div>
        </div>
        
        {/* BB Bar — cyan/gold */}
        <div className="flex items-center gap-1">
          <span className="text-[5px] font-black text-[#E0B45E]/60 uppercase">BB</span>
          <div className="flex-1 h-1.5 bg-black/60 rounded-sm overflow-hidden border border-[#E0B45E]/20">
            <motion.div 
              animate={{ width: `${unit.burst}%` }} 
              className={`h-full ${unit.burst >= 100 ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.6)]' : 'bg-cyan-600'}`} 
            />
          </div>
        </div>
      </div>

      {/* Gold corner accents */}
      <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-[#E0B45E]/60" />
      <div className="absolute -top-px -right-px w-1.5 h-1.5 border-t border-r border-[#E0B45E]/60" />
      <div className="absolute -bottom-px -left-px w-1.5 h-1.5 border-b border-l border-[#E0B45E]/60" />
      <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-[#E0B45E]/60" />
    </div>
  );
}

function SkillButton({ skill, onUse, cooldown }: { skill: SkillDefinition, onUse: () => void, cooldown?: number }) {
  const getIcon = () => {
    const id = (skill.id || '').toLowerCase();
    if (id.includes('heal') || id.includes('aid')) return <Heart size={22} className="text-pink-400" />;
    if (id.includes('fire') || id.includes('meteor')) return <Zap size={22} className="text-orange-500" />;
    if (id.includes('bash') || id.includes('strike')) return <Swords size={22} className="text-red-400" />;
    return <Zap size={22} className="text-cyan-400" />;
  };

  return (
    <ActionButton 
      onClick={onUse}
      disabled={!!cooldown}
      variant="skill"
      className="w-13 h-13 rounded-lg"
      whileHover={!cooldown ? { scale: 1.1, y: -4 } : {}}
      whileTap={!cooldown ? { scale: 0.9 } : {}}
    >
      {/* Gold frame */}
      <div className="absolute inset-0 rounded-lg border-2 border-[#E0B45E]/50 pointer-events-none z-20" />
      
      {getIcon()}
      
      {/* Skill Name */}
      <div className="absolute inset-x-0 bottom-0 bg-[#0A1630]/90 py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
         <span className="text-[5px] font-black text-[#E0B45E] uppercase text-center block tracking-tighter">{skill.name}</span>
      </div>

      {cooldown && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-30">
           <span className="text-[14px] font-black text-[#E0B45E] leading-none">{cooldown}</span>
           <span className="text-[5px] font-black text-[#E0B45E]/50 uppercase tracking-tighter">TURNOS</span>
        </div>
      )}
      
      {!cooldown && (
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(224,180,94,0.08)_50%,transparent_100%)] animate-shimmer rounded-lg" />
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

function BattleResult({ winner, completionData, isRecording, recordingTimeout, recordingFailed, onConfirm }: BattleResultProps) {
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

        {winner === 'player' && !completionData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4 w-full max-w-sm"
          >
            {(recordingTimeout || recordingFailed) ? (
              <motion.div className="flex flex-col items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-400" />
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest text-center">Tiempo de espera agotado</p>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Las recompensas se otorgarán al reconectar</p>
              </motion.div>
            ) : (
              <>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Sincronizando recompensas...</p>
                {isRecording && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center gap-2"
                  >
                    <Terminal size={12} className="text-[#F5C76B]" />
                    <span className="text-[8px] font-black text-[#F5C76B] uppercase tracking-[0.5em]">Registrando...</span>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

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

{(completionData.rewards.premium_currency || 0) > 0 && (
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
              {(completionData.rewards.exp || 0) > 0 && (
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
        {isRecording && !recordingTimeout && (
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
        >
          Continue Expedition
        </Button>
      </div>
    </motion.div>
  );
}
