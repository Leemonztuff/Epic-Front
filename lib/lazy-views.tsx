import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';
import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const LazyViews = {
  RPGHomeView: dynamic(
    () => import('@/components/views/RPGHomeView').then((m) => ({ default: m.RPGHomeView })),
    { loading: () => <div>Cargando vista principal...</div> }
  ),

  TavernView: dynamic(
    () => import('@/components/views/TavernView').then((m) => ({ default: m.TavernView })),
    { loading: () => <div>Cargando taberna...</div> }
  ),

  PartyManagementView: dynamic(
    () => import('@/components/views/PartyManagementView').then((m) => ({ default: m.PartyManagementView })),
    { loading: () => <div>Cargando gestión de party...</div> }
  ),

  UnitDetailsView: dynamic(
    () => import('@/components/views/CharacterDetailStyled'),
    { loading: () => <LoadingSpinner size="md" /> }
  ),

  GachaView: dynamic(
    () => import('@/components/views/GachaView').then((m) => ({ default: m.GachaView })),
    { loading: () => <div>Cargando gacha...</div> }
  ),

  InventoryView: dynamic(
    () => import('@/components/views/InventoryView').then((m) => ({ default: m.InventoryView })),
    { loading: () => <div>Cargando inventario...</div> }
  ),

  BattleScreenView: dynamic(
    () => import('@/components/views/BattleScreenView').then((m) => ({ default: m.BattleScreenView })),
    { loading: () => <div>Cargando pantalla de batalla...</div> }
  ),

  CampaignMapView: dynamic(
    () => import('@/components/views/CampaignMapView').then((m) => ({ default: m.CampaignMapView })),
    { loading: () => <div>Cargando mapa de campaña...</div> }
  ),

  QuestLogView: dynamic(
    () => import('@/components/views/QuestLogView').then((m) => ({ default: m.QuestLogView })),
    { loading: () => <div>Cargando registro de quests...</div> }
  ),

  StageDetailsView: dynamic(
    () => import('@/components/views/StageDetailsView').then((m) => ({ default: m.StageDetailsView })),
    { loading: () => <div>Cargando detalles de stage...</div> }
  ),

  TrainingView: dynamic(
    () => import('@/components/views/TrainingView').then((m) => ({ default: m.TrainingView })),
    { loading: () => <div>Cargando centro de entrenamiento...</div> }
  ),

  DailyRewardsView: dynamic(
    () => import('@/components/views/DailyRewardsView').then((m) => ({ default: m.DailyRewardsView })),
    { loading: () => <div>Cargando recompensas diarias...</div> }
  ),

  SkillDetailView: dynamic(
    () => import('@/components/views/SkillDetailView').then((m) => ({ default: m.SkillDetailView })),
    { loading: () => <div>Cargando detalles de skill...</div> }
  ),

  CardDetailView: dynamic(
    () => import('@/components/views/CardDetailView').then((m) => ({ default: m.CardDetailView })),
    { loading: () => <div>Cargando detalles de carta...</div> }
  ),
};

export function preloadCriticalViews(): void {
  import('@/components/views/RPGHomeView');
  import('@/components/views/PartyManagementView');
  import('@/components/views/InventoryView');
}

export function preloadView(viewName: keyof typeof LazyViews): Promise<ComponentType<unknown>> {
  return (LazyViews[viewName] as unknown as { preload: () => Promise<ComponentType<unknown>> }).preload();
}

export function useViewPreloader(currentView: string, nextViews: string[] = []): void {
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      nextViews.forEach(viewName => {
        if (viewName in LazyViews) {
          (LazyViews[viewName as keyof typeof LazyViews] as unknown as { preload: () => Promise<ComponentType<unknown>> }).preload().catch(() => {});
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentView, nextViews]);
}