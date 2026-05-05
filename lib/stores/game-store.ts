import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { OnboardingService } from '@/lib/services/onboarding-service';
import { UnitService } from '@/lib/services/unit-service';
import { RecruitmentService } from '@/lib/services/recruitment-service';
import { PartyService } from '@/lib/services/party-service';
import { EquipmentService } from '@/lib/services/equipment-service';
import { ConfigService } from '@/lib/services/config-service';
import { CampaignService } from '@/lib/services/campaign-service';
import { TrainingService } from '@/lib/services/training-service';
import { DailyRewardsService } from '@/lib/services/daily-rewards-service';
import { InventoryService, InventoryItem } from '@/lib/services/inventory-service';
import { Stage } from '@/lib/rpg-system/campaign-types';
import { gameDebugger } from '@/lib/debug';

export type ViewType = 'home' | 'tavern' | 'party' | 'unit_details' | 'gacha' | 'inventory' | 'battle' | 'campaign' | 'quests' | 'stage_details' | 'training' | 'daily_rewards' | 'arena' | 'tower' | 'guild' | 'skill_detail' | 'card_detail';

interface GameState {
  // Auth & Loading State
  isLoaded: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  needsOnboarding: boolean;

  // Player Data
  profile: any | null;
  roster: any[];
  party: any[];
  tavernSlots: any[];
  inventory: any[]; // Added
  activePartyUnits: any[];

  // Navigation State
  view: ViewType;
  selectedUnitId: string | null;
  selectedStage: Stage | null;
  selectedCardId: string | null;
  selectedSkillId: string | null;
  selectedItemId: string | null;
  targetSlot: 'weapon' | 'card' | 'skill' | null;

  // Computed Values
  version: string | null;

  // Actions
  setIsLoaded: (value: boolean) => void;
  setIsAuthLoading: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setProfile: (profile: any | null) => void;
  setRoster: (roster: any[]) => void;
  setParty: (party: any[]) => void;
  setTavernSlots: (slots: any[]) => void;
  setInventory: (items: any[]) => void; // Added
  setView: (view: ViewType) => void;
  setSelectedUnitId: (id: string | null) => void;
  setSelectedStage: (stage: Stage | null) => void;
  setSelectedCardId: (id: string | null) => void;
  setSelectedSkillId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setTargetSlot: (slot: 'weapon' | 'card' | 'skill' | null) => void;

  // Complex Actions
  regenEnergy: () => Promise<void>;
  refreshState: () => Promise<void>;
  initializeGame: () => Promise<void>;
  retryOnboarding: () => Promise<void>;
  navigateTo: (newView: ViewType) => void;
  handleSelectUnit: (id: string) => void;
  handleOpenInventory: (slot: 'weapon' | 'card' | 'skill') => void;
  openFullInventory: () => void;
  handleEquipItem: (item: any, toast?: (message: string, type?: any) => void) => Promise<void>;
  handleClaimRecruit: (slotId: string) => Promise<void>;
  handleAssignPartySlot: (slotIndex: number, unitId: string | null) => Promise<void>;
  handleSelectStage: (stage: Stage) => void;
  handleStartBattle: (stage: Stage, toast?: (message: string, type?: any) => void) => Promise<void>;
  handleRefillEnergy: (gemCost: number, toast?: (message: string, type?: any) => void) => Promise<void>;
  handleOpenTraining: (unitId: string) => void;
  handleOpenDailyRewards: () => void;
  handleOpenCardDetails: (cardId: string, itemId: string) => void;
  handleOpenSkillDetails: (skillId: string, itemId: string) => void;
  handleDiscardItem: (itemId: string) => void;
}

const updateActivePartyUnits = (party: any[]) => {
  const activePartyUnits = Array(5).fill(null).map((_, i) => party.find(p => p.slot_index === i)?.unit || null);
  return activePartyUnits;
};

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
  setInventory: (inventory) => set({ inventory }), // Added
  setView: (view) => set({ view }),
  setSelectedUnitId: (id) => set({ selectedUnitId: id }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setSelectedSkillId: (id) => set({ selectedSkillId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setTargetSlot: (slot) => set({ targetSlot: slot }),

  // Complex Actions
  regenEnergy: async () => {
    if (!supabase) return;
    try {
      await supabase.rpc('rpc_regen_energy');
    } catch (e) {
      console.warn('Unable to refresh energy from server:', e);
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
    } catch (e) {
      gameDebugger.error('game-state', 'Critical error in refreshState', e);
      console.error("Critical error in refreshState:", e);
    }
  },

  initializeGame: async () => {
    if (!supabase) return;

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
          await OnboardingService.initializePlayer(user.email?.split('@')[0] || "Héroe", 3);
          const { data: newProf } = await supabase.from('players').select('*').eq('id', user.id).single();
          if (!newProf) throw new Error("No se pudo crear el perfil.");
          gameDebugger.info('game-state', 'Onboarding completed', newProf);
          set({ profile: newProf, needsOnboarding: false, error: null });
        } catch (initErr: any) {
          gameDebugger.error('game-state', 'Onboarding failed', initErr);
          const friendlyMsg = initErr.message?.includes('no está disponible') || initErr.message?.includes('does not exist')
            ? 'El servicio de inicialización no está disponible. Por favor, contacta al soporte.'
            : 'No se pudo completar el registro. Intenta nuevamente.';
          set({ error: friendlyMsg, needsOnboarding: true });
          return;
        }
      } else {
        gameDebugger.info('game-state', 'Profile loaded', { profileId: prof.id, username: prof.username });
        set({ profile: prof, needsOnboarding: false });
      }

      await get().refreshState();
      set({ isLoaded: true, version: ConfigService.getActiveVersion() });
    } catch (e: any) {
      console.error("Initialization error:", e);
      set({ error: "Error inesperado: " + (e.message || "Desconocido") });
    }
  },

  retryOnboarding: async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ error: null });
    try {
      await OnboardingService.initializePlayer(user.email?.split('@')[0] || "Héroe", 3);
      const { data: newProf } = await supabase.from('players').select('*').eq('id', user.id).single();
      if (!newProf) throw new Error("No se pudo crear el perfil.");
      set({ profile: newProf, needsOnboarding: false, error: null });
      await get().refreshState();
      set({ isLoaded: true });
    } catch (e: any) {
      const friendlyMsg = e.message?.includes('no está disponible') || e.message?.includes('does not exist')
        ? 'El servicio de inicialización no está disponible. Por favor, contacta al soporte.'
        : 'No se pudo completar el registro. Intenta nuevamente.';
      set({ error: friendlyMsg });
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
    console.log('Discard item:', itemId);
  },
}));
