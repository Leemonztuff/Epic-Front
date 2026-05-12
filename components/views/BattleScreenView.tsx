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
  currencyGained?: number;
  expGained?: number;
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
          <Button onClick={() => { if (isBattleOver) { onBack(); } else { setShowExitConfirm(true); } }} variant="ghost" size="sm" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"><ChevronLeft size={20} /></Button>
          <Button
            onClick={() => setAutoBattle(!autoBattle)}
            variant={autoBattle ? "primary" : "ghost"}
            size="sm"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${autoBattle ? 'bg-green-600 border-green-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title="Auto-battle"
          >
            <Zap size={18} className={autoBattle ? 'animate-pulse' : ''} />
          </Button>
          <Button
            onClick={() => setBattleSpeed(s => s === '1x' ? '2x' : '1x')}
            variant="ghost"
            size="sm"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${battleSpeed === '2x' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title={`Velocidad: ${battleSpeed}`}
          >
            <span className={`text-[9px] font-black tracking-wider ${battleSpeed === '2x' ? '' : ''}`}>{battleSpeed}</span>
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
            className="h-full relative"
          >
            {enemyUnits.length > 1 ? (
              <div className="flex h-full">
                {enemyUnits.map(enemy => (
                  <div
                    key={enemy.id}
                    className="h-full relative"
                    style={{ width: `${(enemy.maxHp / maxEnemyHp) * 100}%` }}
                  >
                    <div
                      className="h-full bg-[linear-gradient(90deg,#991b1b_0%,#ef4444_50%,#f87171_100%)]"
                      style={{ width: `${Math.min((enemy.currentHp / enemy.maxHp) * 100, 100)}%` }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(0,0,0,0.3)_100%)]" />
                    {enemy.currentHp > 0 && enemy.currentHp < enemy.maxHp && (
                      <div className="absolute top-0 bottom-0 right-0 w-px bg-black/40" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full bg-[linear-gradient(90deg,#991b1b_0%,#ef4444_50%,#f87171_100%)] relative">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(0,0,0,0.3)_100%)]" />
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" 
                />
              </div>
            )}
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
          <AnimatePresence>
            {enemyUnits.map((enemy) => (
              <EnemySprite key={enemy.id} enemy={enemy} isTargeted={targetId === enemy.id} onTarget={() => setTargetId(enemy.id)} />
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

        {/* Player Sprites on Field */}
        <div className="absolute bottom-20 left-6 right-6 flex justify-evenly items-end gap-6 px-8">
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

      </div>

       {/* Turn Timeline */}
       {!isBattleOver && !isInitializing && turnOrder.length > 0 && (
         <div className="relative z-30 px-4 pb-1">
           <div className="flex items-center gap-1 justify-center">
             <span className="text-[6px] font-black text-white/30 uppercase tracking-widest mr-1">SIG:</span>
             {nextTurns.map((u, i) => (
               <div key={u.id} className="flex items-center gap-0.5">
                 <div className={`w-5 h-5 rounded-full ${u.side === 'enemy' ? 'bg-red-900/60 border border-red-500/30' : 'bg-cyan-900/60 border border-cyan-500/30'} flex items-center justify-center overflow-hidden`}>
                   <img src={AssetService.getSpriteUrl(u.sprite_id || '')} className="w-4 h-4 object-contain" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                 </div>
                 {i < nextTurns.length - 1 && <span className="text-white/10 text-[6px]">→</span>}
               </div>
             ))}
           </div>
         </div>
       )}

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
                  className={`w-16 h-16 rounded-full p-1 group relative ${(currentActor?.burst || 0) >= 100 ? 'animate-pulse' : ''}`}
                  whileHover={(currentActor?.burst || 0) >= 100 && !(currentActor.bbLevel >= 3 && currentActor.hasUsedUBB) ? { scale: 1.05 } : {}}
                  whileTap={(currentActor?.burst || 0) >= 100 ? { scale: 0.9 } : {}}
                >
                    <div className={`w-full h-full bg-[#0B1A2A]/90 rounded-full flex flex-col items-center justify-center border-2 ${
                      currentActor.bbLevel >= 3 && (currentActor?.burst || 0) >= 100 ? 'border-purple-500' :
                      currentActor.bbLevel >= 2 && (currentActor?.burst || 0) >= 100 ? 'border-yellow-400' :
                      (currentActor?.burst || 0) >= 100 ? 'border-red-400' : 'border-white/20'
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
                  {battleLog.slice(-5).map(log => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-l border-[#F5C76B]/30 pl-1.5 py-0.5"
                      style={{ lineHeight: '1.2' }}
                    >
                      <span className="text-[6px] font-mono text-white/70 uppercase tracking-wider">{log.text}</span>
                    </motion.div>
                  ))}
               </NineSlicePanel>
             )}
           </div>
         </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowExitConfirm(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
            <NineSlicePanel type="border" variant="default" className="p-8 mx-4 max-w-sm w-full" glassmorphism>
              <h3 className="text-lg font-black text-white text-center mb-2 uppercase tracking-wider">¿Abandonar batalla?</h3>
              <p className="text-[10px] text-white/60 text-center mb-6">Perderás el progreso de esta batalla.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowExitConfirm(false)} variant="ghost" className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest">Cancelar</Button>
                <Button onClick={() => { setShowExitConfirm(false); onBack(); }} variant="primary" className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-700">Salir</Button>
              </div>
            </NineSlicePanel>
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
        y: isTargeted ? [0, -5, 0] : 0,
        scale: isTargeted ? 1.15 : 1 
      }}
      transition={isTargeted ? { repeat: Infinity, duration: 1 } : {}}
      onClick={onTarget}
      className="relative cursor-pointer group"
      style={{ zIndex: isTargeted ? 60 : 20 + (enemy.position ?? 0) }}
    >
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
           <ElementBadge element={enemy.element} />
           <span className="text-[7px] font-black text-red-500 bg-black/40 px-1 rounded-sm border border-red-500/20">LV.{enemy.level}</span>
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
          className={`w-40 h-40 max-w-[160px] max-h-[160px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,1)] scale-x-[-1] transition-all duration-300 ${isTargeted ? 'brightness-125 saturate-150' : 'brightness-90 saturate-50'}`}
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
        y: isActive ? [0, -12, 0] : 0,
        scale: isActive ? 1.2 : 1,
        opacity: unit.isDead ? 0.3 : 1
      }}
      transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
      className="relative flex-shrink-0 min-w-[72px]"
      style={{ zIndex: isActive ? 50 : 30 }}
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
        className={`w-28 h-28 max-w-[112px] max-h-[112px] object-contain transform origin-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-10 transition-all ${isActive ? 'brightness-125' : 'brightness-100'}`}
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
      className={`relative flex flex-col p-2.5 overflow-hidden aspect-[3.5/5] card-premium ${isActive ? 'glow-pulse-gold' : ''}`}
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
        <div className="flex items-center gap-1">
           <ElementBadge element={unit.element} />
           <div className="w-5 h-5 rounded-lg bg-[#F5C76B]/20 border border-[#F5C76B]/40 flex items-center justify-center">
             <span className="text-[7px] font-black text-[#F5C76B]">LV.1</span>
           </div>
           {unit.bbLevel >= 2 && (
             <div className={`px-1 rounded-sm border ${unit.bbLevel >= 3 ? 'border-purple-500/40 bg-purple-500/20' : 'border-yellow-400/40 bg-yellow-400/20'}`}>
               <span className={`text-[6px] font-black ${unit.bbLevel >= 3 ? 'text-purple-300' : 'text-yellow-300'}`}>
                 {unit.bbLevel >= 3 ? 'UBB' : 'SBB'}
               </span>
             </div>
           )}
        </div>
        <div className="flex flex-col items-end">
           <div className="flex gap-0.5 justify-center w-full">
               {unit.level > 1 && [1, 2, 3].map(i => <StarIcon key={i} size={6} className="text-yellow-400 fill-current" />)}
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
        <div className="flex items-center gap-1">
          <span className="text-[6px] font-black text-white/40 uppercase">BB</span>
          <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${unit.burst}%` }} 
              className={`h-full ${unit.burst >= 100 ? 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]' : 'bg-cyan-600'}`} 
            />
          </div>
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
