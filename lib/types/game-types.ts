/**
 * ============================================================================
 * GAME TYPES - Tipos centralizados para el juego RPG
 * ============================================================================
 * Este archivo define los tipos principales del juego para evitar repetición
 * y mejorar el mantenimiento del código.
 */

// ============================================================================
// VISTAS DEL JUEGO
// ============================================================================

/** Todas las vistas disponibles en el juego */
export type ViewType = 
  | 'home' 
  | 'tavern' 
  | 'party' 
  | 'unit_details' 
  | 'gacha' 
  | 'inventory' 
  | 'battle' 
  | 'campaign' 
  | 'quests' 
  | 'stage_details' 
  | 'training' 
  | 'daily_rewards' 
  | 'arena' 
  | 'tower' 
  | 'guild' 
  | 'skill_detail' 
  | 'card_detail';

// ============================================================================
// TIPOS DE UNIDADES
// ============================================================================

/** Afinidad/tipo de unidad */
export type Affinity = 'physical' | 'magic' | 'ranged' | 'support';

/** Estadísticas base de una unidad */
export interface UnitStats {
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  agi: number;
}

/** Rates de crecimiento por nivel */
export interface GrowthRates {
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  agi: number;
}

/** Unidad del juego (personaje) */
export interface GameUnit {
  id: string;
  player_id: string;
  name: string;
  level: number;
  current_job_id: string;
  unlocked_jobs: string[];
  baseStats: UnitStats;
  growthRates: GrowthRates;
  affinity: Affinity;
  trait?: string;
  sprite_id?: string;
  icon_id?: string;
  equipped_weapon_instance_id?: string;
  equipped_card_instance_ids: string[];
  equipped_skill_instance_ids: string[];
  // Propiedades calculadas/alternativas
  cards?: InventoryItem[]; // Cartas equipadas (calculado)
  skills?: InventoryItem[]; // Skills equipadas (calculado)
  weapon?: InventoryItem; // Arma equipada (calculado)
}

// ============================================================================
// PERFIL DEL JUGADOR
// ============================================================================

/** Perfil del jugador con recursos */
export interface PlayerProfile {
  id: string;
  username: string;
  level: number;
  currency: number;
  gems: number;
  energy: number;
  max_energy: number;
  party_size_limit?: number;
  power?: number; // Poder total del jugador (usado en Arena)
}

// ============================================================================
// INVENTARIO
// ============================================================================

/** Tipos de items en el inventario */
export type ItemType = 'weapon' | 'card' | 'skill' | 'material' | 'job_core' | 'skill_fragment' | 'skill_scroll' | 'consumable';

/** Rareza de items */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Item del inventario - compatible con el tipo de inventory-service */
export interface InventoryItem {
  id: string;
  item_type: string;
  name: string;
  rarity: string;
  stats?: Partial<UnitStats>;
  description?: string;
  item_id?: string;
  instance_id?: string;
  quantity?: number;
}

// ============================================================================
// COMBATE
// ============================================================================

/** Slots de equipamiento */
export type EquipmentSlot = 'weapon' | 'card' | 'skill';

/** Resultado de una batalla */
export interface BattleResult {
  stars: number;
  isFirstClear: boolean;
  rewards: StageReward;
  currencyGained: number;
  expGained: number;
  firstClearBonus?: StageReward;
}

// ============================================================================
// ETAPAS Y CAMPAÑA
// ============================================================================

/** Recompensas de etapa */
export interface StageReward {
  currency: number;
  premium_currency?: number;
  exp: number;
  materials: Array<{ itemId: string; amount: number; chance: number }>;
}

/** Resultado de una batalla */
export interface BattleResult {
  stars: number;
  isFirstClear: boolean;
  rewards: StageReward;
  currencyGained: number;
  expGained: number;
  firstClearBonus?: StageReward;
}

/** Usar el tipo Stage existente del proyecto para evitar conflictos */
export type GameStage = import('@/lib/rpg-system/campaign-types').Stage;

// ============================================================================
// RECLUTAMIENTO
// ============================================================================

/** Slot de reclutamiento en la taberna */
export interface RecruitmentSlot {
  id: string;
  player_id: string;
  unit_data: Partial<GameUnit>;
  is_claimed: boolean;
  expires_at?: string;
}

// ============================================================================
// ESTADO DEL JUEGO (para Zustand)
// ============================================================================

/** Estado completo del juego */
export interface GameState {
  // Autenticación
  isLoaded: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  needsOnboarding: boolean;

  // Datos del jugador
  profile: PlayerProfile | null;
  roster: any[];
  party: any[];
  tavernSlots: RecruitmentSlot[];
  inventory: any[];
  activePartyUnits: any[];

  // Navegación
  view: ViewType;
  selectedUnitId: string | null;
  selectedStage: GameStage | null;
  selectedCardId: string | null;
  selectedSkillId: string | null;
  selectedItemId: string | null;
  targetSlot: EquipmentSlot | null;

  // Info
  version: string | null;

  // Acciones básicas del store (setters)
  setIsLoaded: (value: boolean) => void;
  setIsAuthLoading: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setProfile: (profile: PlayerProfile | null) => void;
  setRoster: (roster: GameUnit[]) => void;
  setParty: (party: PartySlot[]) => void;
  setTavernSlots: (slots: RecruitmentSlot[]) => void;
  setInventory: (items: InventoryItem[]) => void;
  setView: (view: ViewType) => void;
  setSelectedUnitId: (id: string | null) => void;
  setSelectedStage: (stage: GameStage | null) => void;
  setSelectedCardId: (cardId: string | null) => void;
  setSelectedSkillId: (skillId: string | null) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setTargetSlot: (slot: EquipmentSlot | null) => void;

  // Acciones complejas del juego
  regenEnergy: () => Promise<void>;
  refreshState: () => Promise<void>;
  refreshDemoState: () => Promise<void>;
  initializeGame: () => Promise<void>;
  retryOnboarding: () => Promise<void>;
  handleSelectUnit: (id: string) => void;
  handleOpenInventory: (slot: EquipmentSlot) => void;
  openFullInventory: () => void;
  handleEquipItem: (item: InventoryItem, toast?: ToastFunction) => Promise<void>;
  handleClaimRecruit: (slotId: string) => Promise<void>;
  handleAssignPartySlot: (slotIndex: number, unitId: string | null) => Promise<void>;
  handleSelectStage: (stage: GameStage) => void;
  handleStartBattle: (stage: GameStage, toast?: ToastFunction) => Promise<void>;
  handleRefillEnergy: (gemCost: number, toast?: ToastFunction) => Promise<void>;
  handleOpenTraining: (unitId: string) => void;
  handleOpenDailyRewards: () => void;
  handleOpenCardDetails: (cardId: string, itemId: string) => void;
  handleOpenSkillDetails: (skillId: string, itemId: string) => void;
  handleDiscardItem: (itemId: string) => void;
  navigateTo: (newView: ViewType) => void;
}

/** Slot en el party */
export interface PartySlot {
  id: string;
  player_id: string;
  unit_id: string;
  slot_index: number;
  unit: GameUnit;
}

// ============================================================================
// ACCIONES DEL JUEGO
// ============================================================================

/** Define las acciones posibles del store */
export interface GameActions {
  // Setters básicos
  setIsLoaded: (value: boolean) => void;
  setIsAuthLoading: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setProfile: (profile: PlayerProfile | null) => void;
  setRoster: (roster: GameUnit[]) => void;
  setParty: (party: PartySlot[]) => void;
  setTavernSlots: (slots: RecruitmentSlot[]) => void;
  setInventory: (items: InventoryItem[]) => void;
  setView: (view: ViewType) => void;
  setSelectedUnitId: (id: string | null) => void;
  setSelectedStage: (stage: GameStage | null) => void;
  setSelectedCardId: (cardId: string | null) => void;
  setSelectedSkillId: (skillId: string | null) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setTargetSlot: (slot: EquipmentSlot | null) => void;

  // Acciones complejas
  regenEnergy: () => Promise<void>;
  refreshState: () => Promise<void>;
  refreshDemoState: () => Promise<void>;
  initializeGame: () => Promise<void>;
  retryOnboarding: () => Promise<void>;
  navigateTo: (newView: ViewType) => void;
  handleSelectUnit: (id: string) => void;
  handleOpenInventory: (slot: EquipmentSlot) => void;
  openFullInventory: () => void;
  handleEquipItem: (item: InventoryItem, toast?: ToastFunction) => Promise<void>;
  handleClaimRecruit: (slotId: string) => Promise<void>;
  handleAssignPartySlot: (slotIndex: number, unitId: string | null) => Promise<void>;
  handleSelectStage: (stage: GameStage) => void;
  handleStartBattle: (stage: GameStage, toast?: ToastFunction) => Promise<void>;
  handleRefillEnergy: (gemCost: number, toast?: ToastFunction) => Promise<void>;
  handleOpenTraining: (unitId: string) => void;
  handleOpenDailyRewards: () => void;
  handleOpenCardDetails: (cardId: string, itemId: string) => void;
  handleOpenSkillDetails: (skillId: string, itemId: string) => void;
  handleDiscardItem: (itemId: string) => void;
}

/** Función para mostrar toast */
export type ToastFunction = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte el estado del partido a unidades activas
 * @param party - Array de slots del party
 * @returns Array de 5 posiciones con unidades o null
 */
export function computeActivePartyUnits(party: PartySlot[]): (GameUnit | null)[] {
  return Array(5).fill(null).map((_, i) => 
    party.find(p => p.slot_index === i)?.unit || null
  );
}