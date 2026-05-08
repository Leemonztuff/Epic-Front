/**
 * ============================================================================
 * GAME HELPERS - Funciones utilitarias del juego
 * ============================================================================
 * Funciones reutilizables para lógica del juego.
 * Principio KISS: funciones pequeñas y con un solo propósito.
 */

import type { PartySlot, GameUnit, InventoryItem, EquipmentSlot, ToastFunction } from '@/lib/types/game-types';
import { gameDebugger, type DebugCategory } from '@/lib/debug';

/**
 * Obtiene las unidades activas del party (máximo 5)
 */
export function getActivePartyUnits(party: PartySlot[]): (GameUnit | null)[] {
  return Array(5).fill(null).map((_, index) => 
    party.find(slot => slot.slot_index === index)?.unit || null
  );
}

/**
 * Valida que se pueda equipar un item en el slot especificado
 */
export function validateEquipmentSlot(
  item: InventoryItem | undefined,
  targetSlot: EquipmentSlot | null
): { valid: boolean; error?: string } {
  if (!targetSlot) {
    return { valid: false, error: 'Selecciona una ranura de equipo primero' };
  }
  if (!item?.id) {
    return { valid: false, error: 'Objeto inválido' };
  }
  
  const itemType = item.item_type;
  const slotType = targetSlot;
  
  if (slotType === 'weapon' && itemType !== 'weapon') {
    return { valid: false, error: 'Selecciona un arma para esta ranura' };
  }
  if (slotType === 'card' && itemType !== 'card') {
    return { valid: false, error: 'Selecciona una carta para esta ranura' };
  }
  if (slotType === 'skill' && itemType !== 'skill') {
    return { valid: false, error: 'Selecciona una skill para esta ranura' };
  }
  
  return { valid: true };
}

/**
 * Valida que el jugador tenga suficiente energía para una stage
 */
export function validateEnergyForStage(
  playerEnergy: number,
  stageEnergyCost: number
): { valid: boolean; error?: string } {
  if (playerEnergy < stageEnergyCost) {
    return { 
      valid: false, 
      error: 'No tienes suficiente energía para esta incursión.' 
    };
  }
  return { valid: true };
}

/**
 * Valida que el jugador pueda permitirse recargar energía con gemas
 */
export function validateGemRefund(
  playerGems: number,
  gemCost: number
): { valid: boolean; error?: string } {
  if (playerGems < gemCost) {
    return { 
      valid: false, 
      error: 'Gems insuficientes para recargar energía.' 
    };
  }
  return { valid: true };
}

/**
 * Muestra un toast con manejo de errores
 */
export function safeToast(
  toast: ToastFunction | undefined,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void {
  if (toast) {
    toast(message, type);
  }
}

/**
 * Log de debug para acciones del juego
 */
const GAME_STATE_CATEGORY: DebugCategory = 'game-state';

export function logGameAction(action: string, details?: object): void {
  gameDebugger.info(GAME_STATE_CATEGORY, action, details);
}

/**
 * Log de error para acciones del juego
 */
export function logGameError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  gameDebugger.error(GAME_STATE_CATEGORY, `${action} failed: ${message}`, error);
}

/**
 * Formatea un número para mostrar (ej: 1000 -> "1,000")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Convierte valores de enum de Supabase a tipos del juego
 */
export function convertUnitFromDb(dbUnit: Record<string, unknown>): Partial<GameUnit> {
  return {
    id: dbUnit.id as string,
    player_id: dbUnit.player_id as string,
    name: dbUnit.name as string,
    level: dbUnit.level as number,
    current_job_id: dbUnit.current_job_id as string,
    affinity: dbUnit.affinity as GameUnit['affinity'],
    sprite_id: dbUnit.sprite_id as string,
  };
}

/**
 * Verifica si una etapa está desbloqueada
 */
export function isStageUnlocked(
  stageIndex: number,
  playerProgress: Array<{ stage_id: string; cleared: boolean }>,
  chapterStages: Array<{ id: string }>
): boolean {
  // Primera etapa siempre desbloqueada
  if (stageIndex === 0) return true;
  
  // Verificar si la etapa anterior fue completada
  const previousStageId = chapterStages[stageIndex - 1]?.id;
  if (!previousStageId) return false;
  
  const previousProgress = playerProgress.find(p => p.stage_id === previousStageId);
  return previousProgress?.cleared ?? false;
}

/**
 * Calcula las recompensas derivadas de una stage
 */
export function calculateStageRewards(
  baseRewards: { currency: number; exp: number; materials: Array<{ itemId: string; amount: number; chance: number }> },
  isFirstClear: boolean,
  firstClearBonus?: { currency: number; premium_currency?: number; exp: number }
): { currency: number; exp: number; materials: Array<{ itemId: string; amount: number }> } {
  let currency = baseRewards.currency;
  let exp = baseRewards.exp;
  const materials: Array<{ itemId: string; amount: number }> = [];
  
  // Agregar bonus de primera vez
  if (isFirstClear && firstClearBonus) {
    currency += firstClearBonus.currency;
    exp += firstClearBonus.exp;
  }
  
  // Calcular materiales drop (solo si no es primera vez o tiene 100% de drop)
  for (const mat of baseRewards.materials) {
    const dropRoll = Math.random();
    if (dropRoll < mat.chance || (isFirstClear && mat.chance === 1)) {
      materials.push({ itemId: mat.itemId, amount: mat.amount });
    }
  }
  
  return { currency, exp, materials };
}