'use client';

import { create } from 'zustand';
import type { ViewType, EquipmentSlot } from '@/lib/types/game-types';
import type { Stage } from '@/lib/rpg-system/campaign-types';

interface UIState {
  // Navigation
  view: ViewType;
  returnView: ViewType | null;

  // Selection
  selectedUnitId: string | null;
  selectedStage: Stage | null;
  selectedCardId: string | null;
  selectedSkillId: string | null;
  selectedItemId: string | null;
  targetSlot: EquipmentSlot | null;

  // Actions
  navigateTo: (view: ViewType) => void;
  setReturnView: (view: ViewType | null) => void;
  setSelectedUnitId: (id: string | null) => void;
  setSelectedStage: (stage: Stage | null) => void;
  setSelectedCardId: (id: string | null) => void;
  setSelectedSkillId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setTargetSlot: (slot: EquipmentSlot | null) => void;
  openFullInventory: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: 'home',
  returnView: null,
  selectedUnitId: null,
  selectedStage: null,
  selectedCardId: null,
  selectedSkillId: null,
  selectedItemId: null,
  targetSlot: null,

  navigateTo: (view) => set({ view }),
  setReturnView: (view) => set({ returnView: view }),
  setSelectedUnitId: (id) => set({ selectedUnitId: id }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setSelectedSkillId: (id) => set({ selectedSkillId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setTargetSlot: (slot) => set({ targetSlot: slot }),
  openFullInventory: () => set({ view: 'inventory', targetSlot: null }),
}));
