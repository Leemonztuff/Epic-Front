'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/lib/stores/game-store';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Stage } from '@/lib/rpg-system/campaign-types';

type ToastFn = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

export type ViewType = 'home' | 'tavern' | 'party' | 'unit_details' | 'gacha' | 'inventory' | 'battle' | 'campaign' | 'quests' | 'stage_details' | 'training' | 'daily_rewards' | 'arena' | 'tower' | 'guild' | 'skill_detail' | 'card_detail';

export function useGameState(toast?: ToastFn) {
  const store = useGameStore();

  // Setup auth listener on mount
  useEffect(() => {
    if (!supabase) return;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.setIsAuthenticated(!!session);
      store.setIsAuthLoading(false);
    });

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      store.setIsAuthenticated(!!session);
      if (!session) {
        store.setProfile(null);
        store.setIsLoaded(false);
      }
    });

    // Initial game initialization if authenticated
    if (store.isAuthenticated) {
      store.initializeGame();
    }

    // Periodic refresh
    const interval = setInterval(async () => {
      await store.regenEnergy();
      await store.refreshState();
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Re-initialize when auth state changes
  useEffect(() => {
    if (store.isAuthenticated && !store.isLoaded && !store.error) {
      store.initializeGame();
    }
  }, [store.isAuthenticated]);

  const handleSelectUnit = (id: string) => {
    store.setSelectedUnitId(id);
    store.setView('unit_details');
  };

  const handleOpenInventory = (slot: 'weapon' | 'card' | 'skill') => {
    store.setTargetSlot(slot);
    store.setView('inventory');
  };

  const openFullInventory = () => {
    store.setTargetSlot(null);
    store.setView('inventory');
  };

  const handleEquipItem = async (item: any) => {
    if (!store.targetSlot) return;
    if (!store.selectedUnitId) {
      if (toast) toast('Selecciona una unidad para equipar objetos', 'warning');
      return;
    }
    try {
      await store.handleEquipItem(item, toast);
    } catch (e: any) {
      if (toast) toast(e.message, 'error');
    }
  };

  const handleClaimRecruit = async (slotId: string) => {
    try {
      await store.handleClaimRecruit(slotId);
     } catch (e) {
       logger.error('error', e);
     }
   };

   const handleAssignPartySlot = async (slotIndex: number, unitId: string | null) => {
     try {
       await store.handleAssignPartySlot(slotIndex, unitId);
     } catch (e) {
       logger.error('error', e);
     }
   };

  const handleSelectStage = (stage: Stage) => {
    store.setSelectedStage(stage);
    store.setView('stage_details');
  };

  const handleStartBattle = async (stage: Stage) => {
    await store.handleStartBattle(stage, toast);
  };

  const handleRefillEnergy = async (gemCost: number = 50) => {
    try {
      await store.handleRefillEnergy(gemCost, toast);
    } catch (e: any) {
      if (toast) toast("Error al recargar energía: " + e.message, 'error');
    }
  };

  const handleOpenQuest = (stage: Stage) => {
    store.setSelectedStage(stage);
    store.setView('stage_details');
  };

  const handleOpenTraining = (unitId: string) => {
    store.setSelectedUnitId(unitId);
    store.setView('training');
  };

  const handleOpenDailyRewards = () => {
    store.setView('daily_rewards');
  };

  const retryOnboarding = async () => {
    await store.retryOnboarding();
  };

  // Compute activePartyUnits from store.party
  const activePartyUnits = Array(5).fill(null).map((_, i) =>
    store.party.find(p => p.slot_index === i)?.unit || null
  );

  return {
    state: {
      isLoaded: store.isLoaded,
      isAuthLoading: store.isAuthLoading,
      isAuthenticated: store.isAuthenticated,
      error: store.error,
      needsOnboarding: store.needsOnboarding,
      profile: store.profile,
      roster: store.roster,
      party: store.party,
      tavernSlots: store.tavernSlots,
      inventory: store.inventory, // Added
      view: store.view,
      selectedUnitId: store.selectedUnitId,
      selectedStage: store.selectedStage,
      selectedCardId: store.selectedCardId,
      selectedSkillId: store.selectedSkillId,
      selectedItemId: store.selectedItemId,
      activePartyUnits,
      targetSlot: store.targetSlot,
      version: store.version
    },
    actions: {
      navigateTo: store.setView,
      handleSelectUnit,
      handleClaimRecruit,
      handleAssignPartySlot,
      handleOpenInventory,
      openFullInventory,
      handleEquipItem,
      handleSelectStage,
      handleOpenQuest,
      handleStartBattle,
      handleRefillEnergy,
      handleOpenTraining,
      handleOpenDailyRewards,
      handleOpenCardDetails: store.handleOpenCardDetails,
      handleOpenSkillDetails: store.handleOpenSkillDetails,
      handleDiscardItem: store.handleDiscardItem,
      setSelectedCardId: store.setSelectedCardId,
      setSelectedSkillId: store.setSelectedSkillId,
      setSelectedItemId: store.setSelectedItemId,
      retryOnboarding,
      refreshState: store.refreshState
    }
  };
}
