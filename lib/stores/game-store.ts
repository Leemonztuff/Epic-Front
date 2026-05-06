/**
 * ============================================================================
 * GAME STORE - Estado global del juego (Zustand)
 * ============================================================================
 * Maneja el estado de toda la aplicación: autenticación, datos del jugador,
 * navegación y acciones del juego.
 * 
 * Principios aplicados:
 * - KISS: Funciones claras y simples
 * - DRY: Lógica reutilizada en helpers
 * - Nombres descriptivos para acciones
 * - Separación de responsabilidades
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { OnboardingService } from '@/lib/services/onboarding-service';
import { RecruitmentService } from '@/lib/services/recruitment-service';
import { PartyService } from '@/lib/services/party-service';
import { EquipmentService } from '@/lib/services/equipment-service';
import { ConfigService } from '@/lib/services/config-service';
import { CampaignService } from '@/lib/services/campaign-service';
import { InventoryService } from '@/lib/services/inventory-service';
import { gameDebugger } from '@/lib/debug';
import { logger } from '@/lib/logger';

// Importar tipos centralizados
import type { 
  ViewType, 
  GameState, 
  GameActions,
  ToastFunction,
  GameStage,
  PartySlot
} from '@/lib/types/game-types';
import { computeActivePartyUnits } from '@/lib/types/game-types';

/**
 * Helper: Calcula las unidades activas del party desde los slots
 */
const updateActivePartyUnits = (party: PartySlot[]) => computeActivePartyUnits(party);

/**
 * Inicializa el estado base del juego
 */
const getInitialState = () => ({
  // Autenticación
  isLoaded: false,
  isAuthLoading: true,
  isAuthenticated: false,
  error: null,
  needsOnboarding: false,

  // Datos del jugador
  profile: null,
  roster: [],
  party: [],
  tavernSlots: [],
  inventory: [],
  activePartyUnits: Array(5).fill(null),

  // Navegación
  view: 'home' as ViewType,
  selectedUnitId: null,
  selectedStage: null,
  selectedCardId: null,
  selectedSkillId: null,
  selectedItemId: null,
  targetSlot: null,

  // Info
  version: null,
});

// El estado se define completamente en getInitialState()
export type { GameState };

// Exportar ViewType para compatibilidad
export type { ViewType } from '@/lib/types/game-types';

// Alias para compatibilidad con código existente
type Stage = import('@/lib/rpg-system/campaign-types').Stage;

export const useGameStore = create<GameState>((set, get) => ({
  // Initial State
  isLoaded: false,
  isAuthLoading: true,
  isAuthenticated: false,
  error: null,
  needsOnboarding: false,

  profile: null,
  roster: [],
  party: [],
  tavernSlots: [],
  inventory: [], // Added
  activePartyUnits: Array(5).fill(null),

  view: 'home',
  selectedUnitId: null,
  selectedStage: null,
  selectedCardId: null,
  selectedSkillId: null,
  selectedItemId: null,
  targetSlot: null,

  version: null,

  // Basic Setters
  setIsLoaded: (value) => set({ isLoaded: value }),
  setIsAuthLoading: (value) => set({ isAuthLoading: value }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setError: (error) => set({ error }),
  setNeedsOnboarding: (value) => set({ needsOnboarding: value }),
  setProfile: (profile) => set({ profile }),
  setRoster: (roster) => set({ roster }),
  setParty: (party) => set({ party, activePartyUnits: updateActivePartyUnits(party) }),
  setTavernSlots: (tavernSlots) => set({ tavernSlots }),
  setInventory: (inventory: any[]) => set({ inventory }),
  setView: (view) => set({ view }),
  setSelectedUnitId: (id) => set({ selectedUnitId: id }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setSelectedCardId: (cardId) => set({ selectedCardId: cardId }),
  setSelectedSkillId: (skillId) => set({ selectedSkillId: skillId }),
  setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),
  setTargetSlot: (slot) => set({ targetSlot: slot }),

  // Complex Actions
  regenEnergy: async () => {
    if (!supabase) return;
    try {
      await supabase.rpc('rpc_regen_energy');
      } catch (e) {
        gameDebugger.error('game-state', 'Failed to refresh energy from server', e);
        logger.warn('game_event', 'Unable to refresh energy from server', { error: e });
      }
  },

refreshState: async () => {
    if (!supabase) return;
    
    gameDebugger.info('game-state', 'Refreshing game state...');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        gameDebugger.warn('game-state', 'No user in refreshState');
        return;
      }

      await get().regenEnergy();

const [profRes, unitsRes, partyRes, recruitsRes] = await Promise.all([
        supabase.from('players').select('*').eq('id', user.id).single(),
        supabase.from('units').select('*'),
        supabase.from('party').select('*, unit:units(*)').eq('player_id', user.id).order('slot_index'),
        supabase.from('recruitment_queue').select('*').eq('player_id', user.id).eq('is_claimed', false),
      ]);

      if (profRes.data) {
        gameDebugger.info('game-state', 'Profile refreshed', { currency: profRes.data.currency });
        set({ profile: profRes.data });
      } else {
        // Player doesn't exist - create new player automatically
        gameDebugger.warn('game-state', 'Player not found, creating new player');
        const { OnboardingService } = await import('@/lib/services/onboarding-service');
        await OnboardingService.initializePlayer(user.email?.split('@')[0] || 'Player');
        // Retry fetch after creation
        const newProfRes = await supabase.from('players').select('*').eq('id', user.id).single();
        if (newProfRes.data) {
          set({ profile: newProfRes.data });
        }
      }
      
      set({ roster: unitsRes.data || [] });
      set({ party: partyRes.data || [] });
      set({ tavernSlots: recruitsRes.data || [] });
      
      // Use InventoryService for inventory (includes enrichment + cache)
      try {
        const inventory = await InventoryService.getInventory(user.id);
        
        // Auto-add starter items if inventory is empty
        if (inventory.length === 0) {
          gameDebugger.warn('inventory', 'Inventory is empty, adding starter items');
          try {
            await supabase.rpc('rpc_add_starter_inventory');
            // Reload inventory after adding starter items
            const newInventory = await InventoryService.refreshInventory(user.id);
            gameDebugger.info('inventory', 'Starter items added', { count: newInventory.length });
            set({ inventory: newInventory });
          } catch (e: any) {
            gameDebugger.error('inventory', 'Failed to add starter items', e);
            set({ inventory: [] });
          }
        } else {
          set({ inventory });
        }
        
        gameDebugger.info('game-state', 'State loaded', { 
          units: unitsRes.data?.length || 0,
          party: partyRes.data?.length || 0,
          recruits: recruitsRes.data?.length || 0,
          inventory: inventory.length
        });
      } catch (invError) {
        gameDebugger.error('inventory', 'Failed to load inventory', invError);
        set({ inventory: [] });
      }
    } catch (e: any) {
      gameDebugger.error('game-state', 'Critical error in refreshState', e);
      logger.error('error', 'Critical error in refreshState', e);
    }
  },

  refreshDemoState: async () => {
    throw new Error('Demo mode is no longer supported. Please configure Supabase properly.');
  },

  initializeGame: async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
    }

    gameDebugger.info('game-state', 'Initializing game...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        gameDebugger.warn('game-state', 'No user found during initialization');
        return;
      }

      gameDebugger.info('auth', 'User found', { userId: user.id, email: user.email });

      await ConfigService.syncConfig();
      await get().regenEnergy();

      const { data: prof, error: profError } = await supabase.from('players').select('*').eq('id', user.id).single();

      if (profError && profError.code !== 'PGRST116') {
        gameDebugger.error('game-state', 'Error loading profile', profError);
        set({ error: "Error al cargar perfil: " + profError.message });
        return;
      }

      if (!prof) {
        gameDebugger.info('game-state', 'No profile found - running onboarding');
        try {
          const result = await OnboardingService.initializePlayer(user.email?.split('@')[0] || "Héroe", 3);
          
          const { data: newProf } = await supabase.from('players').select('*').eq('id', user.id).single();
          if (!newProf) throw new Error("No se pudo crear el perfil.");
          gameDebugger.info('game-state', 'Onboarding completed', newProf);
          set({ profile: newProf, needsOnboarding: false, error: null });
        } catch (initErr: any) {
          gameDebugger.error('game-state', 'Onboarding failed', initErr);
          throw initErr;
        }
      } else {
        gameDebugger.info('game-state', 'Profile loaded', { profileId: prof.id, username: prof.username });
        set({ profile: prof, needsOnboarding: false });
      }

      await get().refreshState();
      set({ isLoaded: true, version: ConfigService.getActiveVersion() });
    } catch (e: any) {
      gameDebugger.error('game-state', 'Initialization error', e);
      logger.error('error', 'Initialization error', e);
      throw e;
    }
  },

  retryOnboarding: async () => {
    set({ error: null });
    
    if (!supabase) {
      throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const result = await OnboardingService.initializePlayer(user.email?.split('@')[0] || "Héroe", 3);
      
      const { data: newProf } = await supabase.from('players').select('*').eq('id', user.id).single();
      if (!newProf) throw new Error("No se pudo crear el perfil.");
      set({ profile: newProf, needsOnboarding: false, error: null });
      await get().refreshState();
      set({ isLoaded: true });
    } catch (e: any) {
      logger.error('error', 'Error in retryOnboarding', e);
      throw e;
    }
  },

  navigateTo: (newView) => set({ view: newView }),

  handleSelectUnit: (id) => {
    set({ selectedUnitId: id, view: 'unit_details' });
  },

  handleOpenInventory: (slot) => {
    set({ targetSlot: slot, view: 'inventory' });
  },

  openFullInventory: () => {
    set({ targetSlot: null, view: 'inventory' });
  },

  handleEquipItem: async (item, toast) => {
    const { targetSlot, selectedUnitId, inventory } = get();
    if (!targetSlot) {
      if (toast) toast('Selecciona una ranura de equipo primero', 'warning');
      return;
    }
    if (!selectedUnitId) {
      if (toast) toast('Selecciona una unidad para equipar objetos', 'warning');
      return;
    }
    if (!item?.id) {
      if (toast) toast('Objeto inválido', 'error');
      return;
    }
    const itemType = item.item_type || inventory.find(i => i.id === item.id)?.item_type;
    if (!itemType) {
      if (toast) toast('No se pudo determinar el tipo de objeto', 'error');
      return;
    }
    if (targetSlot === 'weapon' && itemType !== 'weapon') {
      if (toast) toast('Selecciona un arma para esta ranura', 'warning');
      return;
    }
    if (targetSlot === 'card' && itemType !== 'card') {
      if (toast) toast('Selecciona una carta para esta ranura', 'warning');
      return;
    }
    if (targetSlot === 'skill' && itemType !== 'skill') {
      if (toast) toast('Selecciona una skill para esta ranura', 'warning');
      return;
    }
    gameDebugger.info('game-state', 'Equipping item', { unitId: selectedUnitId, itemId: item.id, slot: targetSlot, itemType });
    try {
      await EquipmentService.equipItem(selectedUnitId, item.id, targetSlot);
      await get().refreshState();
      set({ view: 'unit_details' });
      if (toast) toast('Objeto equipado', 'success');
    } catch (e: any) {
      gameDebugger.error('game-state', 'Failed to equip item', e);
      if (toast) toast(e.message || 'Error al equipar', 'error');
    }
  },

  handleClaimRecruit: async (slotId) => {
    try {
      await RecruitmentService.claimRecruit(slotId);
      await get().refreshState();
    } catch (e) {
      console.error(e);
    }
  },

  handleAssignPartySlot: async (slotIndex, unitId) => {
    try {
      await PartyService.assignToParty(slotIndex, unitId);
      await get().refreshState();
    } catch (e) {
      console.error(e);
    }
  },

  handleSelectStage: (stage) => {
    set({ selectedStage: stage, view: 'stage_details' });
  },

  handleStartBattle: async (stage, toast) => {
    const success = await CampaignService.deductEnergy(stage.energy_cost);
    if (!success) {
      if (toast) toast("No tienes suficiente energía para esta incursión.", 'warning');
      return;
    }
    await get().refreshState();
    set({ selectedStage: stage, view: 'battle' });
  },

  handleRefillEnergy: async (gemCost, toast) => {
    try {
      const success = await CampaignService.refillEnergyWithGems(gemCost);
      if (success) {
        await get().refreshState();
        if (toast) toast("¡Energía recargada!", 'success');
      } else {
        if (toast) toast("Gems insuficientes para recargar energía.", 'error');
      }
    } catch (e: any) {
      if (toast) toast("Error al recargar energía: " + e.message, 'error');
    }
  },

  handleOpenTraining: (unitId) => {
    set({ selectedUnitId: unitId, view: 'training' });
  },

  handleOpenDailyRewards: () => {
    set({ view: 'daily_rewards' });
  },

  handleOpenCardDetails: (cardId, itemId) => {
    set({ selectedCardId: cardId, selectedItemId: itemId, view: 'card_detail' });
  },

  handleOpenSkillDetails: (skillId, itemId) => {
    set({ selectedSkillId: skillId, selectedItemId: itemId, view: 'skill_detail' });
  },

  handleDiscardItem: (itemId) => {
    logger.info('user_action', 'Discard item', { itemId });
  },
}));
