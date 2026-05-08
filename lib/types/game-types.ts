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
  | 'card_detail'
  | 'profile';

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

// ============================================================================
// PROGRESION v2.0 - Sistema de progresión mejorado (Ragnarok/Brave Frontier)
// ============================================================================

/** Nivel de maestría de un job (1-50) */
export interface JobLevel {
  jobId: string;
  level: number;
  exp: number;
  skillPoints: number;
  skillsUnlocked: string[];
}

/** Sistema de job levels - cada job tiene su propio nivel */
export interface JobLevels {
  [jobId: string]: JobLevel;
}

/** Puntos de habilidad por job */
export interface JobSkillPoints {
  [jobId: string]: number;
}

/** Skills desbloqueados por job */
export interface JobSkills {
  [jobId: string]: {
    [skillId: string]: number; // skillId: level del skill
  };
}

/** Potencial desbloqueado (stats adicionales) */
export type PotentialType = 'stat_boost' | 'skill_boost' | 'elemental' | 'special';
export interface Potential {
  id: string;
  name: string;
  description: string;
  potentialType: PotentialType;
  requirementType: 'level' | 'job_level' | 'transcendence' | 'awakening';
  requirementValue: number;
  statBonus?: Partial<UnitStats>;
  rarity: string;
}

/** Transcendence (awakening en BF, transcendent en RO) */
export interface Transcendence {
  level: number;  // 0-5
  isActive: boolean;
  bonusStats?: Partial<UnitStats>;
}

/** Nivel de unidad con toda la info de progresión */
export interface UnitProgression {
  level: number;
  exp: number;
  jobLevels: JobLevels;
  potentialsUnlocked: string[];
  transcendenceLevel: number;
  awakeningCount: number;
}

/** Unidad del juego (personaje) */
export interface GameUnit {
  id: string;
  player_id: string;
  name: string;
  level: number;
  exp: number;
  current_job_id: string;
  unlocked_jobs: string[];
  baseStats: UnitStats;
  growthRates: GrowthRates;
  affinity: Affinity;
  trait?: string;
  sprite_id?: string;
  icon_id?: string;
  
  // Sistema de equipamiento
  equipped_weapon_instance_id?: string;
  equipped_card_instance_ids: string[];
  equipped_skill_instance_ids: string[];
  equipped_items?: Record<string, any>;
  
  // Sistema de progresión v2.0
  job_levels?: JobLevels;
  job_skill_points?: JobSkillPoints;
  job_skills?: JobSkills;
  potentials_unlocked?: string[];
  transcendence_level?: number;
  awakening_count?: number;
  
  // Propiedades calculadas/alternativas
  cards?: InventoryItem[];
  skills?: InventoryItem[];
  weapon?: InventoryItem;
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
// INVENTARIO Y EQUIPAMIENTO
// ============================================================================

/** Tipos de items en el inventario */
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill' | 'material' | 'job_core' | 'skill_fragment' | 'skill_scroll' | 'consumable';

/** Rareza de items */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Elementos del juego - igual que Ragnarok/Brave Frontier */
export type Element = 'none' | 'fire' | 'water' | 'earth' | 'thunder' | 'light' | 'dark';

/** Slots de equipamiento - expandidos como RPGs profesionales */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill';

/** Stats de equipamiento - bonificaciones que da cada pieza */
export interface EquipmentStats {
  hp?: number;
  atk?: number;
  def?: number;
  matk?: number;
  mdef?: number;
  agi?: number;
  crit?: number;
  crit_dmg?: number;
  dodge?: number;
  block?: number;
  fire_res?: number;
  water_res?: number;
  earth_res?: number;
  thunder_res?: number;
  light_res?: number;
  dark_res?: number;
}

/** Set de equipamiento - bonificación por usar múltiples piezas */
export interface EquipmentSet {
  id: string;
  name: string;
  pieces_required: number;
  bonus_stats: EquipmentStats;
  bonus_effect?: string;
}

/** Requisitos para equipar un item */
export interface EquipRequirements {
  min_level?: number;
  required_job?: string[];
  prohibited_jobs?: string[];
  required_affinity?: Affinity[];
}

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
  
  // Campos de equipamiento mejorados
  element?: Element;
  slot_type?: EquipmentSlot;
  equipment_stats?: EquipmentStats;
  set_id?: string;
  refine_level?: number;
  level_required?: number;
  equip_requirements?: EquipRequirements;
  weapon_type?: string;
  armor_type?: string;
}

/** Item equipado en una ranura específica */
export interface EquippedItem {
  slot: EquipmentSlot;
  item: InventoryItem | null;
  instance_id: string | null;
}

// ============================================================================
// COMBATE
// ============================================================================

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
  reinitializeAccount: (toast?: ToastFunction) => Promise<void>;
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