'use client';

import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { GlobalNavigation } from '@/components/layout/GlobalNavigation';
import { useGameState } from '@/hooks/useGameState';
import { RPGHomeView } from '@/components/views/RPGHomeView';
import { TavernView } from '@/components/views/TavernView';
import { PartyManagementView } from '@/components/views/PartyManagementView';
import { GachaView } from '@/components/views/GachaView';
import { UnitDetailsView } from '@/components/views/UnitDetailsView';
import { InventoryView } from '@/components/views/InventoryView';
import { BattleScreenView } from '@/components/views/BattleScreenView';
import { CampaignMapView } from '@/components/views/CampaignMapView';
import { QuestLogView } from '@/components/views/QuestLogView';
import { StageDetailsView } from '@/components/views/StageDetailsView';
import { DailyRewardsView } from '@/components/views/DailyRewardsView';
import { TrainingView } from '@/components/views/TrainingView';
import { AuthView } from '@/components/views/AuthView';
import { ArenaView } from '@/components/views/ArenaView';
import { TowerView } from '@/components/views/TowerView';
import { GuildView } from '@/components/views/GuildView';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/contexts/ToastContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CardModal } from '@/components/ui/CardModal';
import { SkillDetailView } from '@/components/views/SkillDetailView';
import { TutorialOverlay, hasSeenTutorial } from '@/components/ui/TutorialOverlay';
import { CardDetailView } from '@/components/views/CardDetailView';

export default function Applet() {
  const { showToast } = useToast();
  const { state, actions } = useGameState(showToast);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showTutorial, setShowTutorial] = useState(false);

  useState(() => {
    if (state.isLoaded && !hasSeenTutorial()) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  });

  // Show login screen if not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020508] flex items-center justify-center">
        <AuthView />
      </div>
    );
  }

  const renderView = () => {
    switch (state.view) {
      case 'home':
        return <RPGHomeView
                 saveData={state as any}
                 activePartyUnits={state.activePartyUnits}
                 onNavigate={actions.navigateTo}
                 onSelectUnit={actions.handleSelectUnit}
               />;
      case 'tavern':
        return <TavernView 
                 onBack={() => actions.navigateTo('home')}
                 onClaim={actions.handleClaimRecruit}
               />;
      case 'party':
        return <PartyManagementView 
                 saveData={state as any}
                 activePartyUnits={state.activePartyUnits}
                 onNavigate={actions.navigateTo}
                 onAssignToParty={actions.handleAssignPartySlot}
                 onRemoveFromParty={(idx) => actions.handleAssignPartySlot(idx, null)}
                 onSelectUnit={actions.handleSelectUnit}
               />;
      case 'gacha':
        return <GachaView
                 profile={state.profile}
                 onNavigate={actions.navigateTo}
                 onPullComplete={actions.refreshState}
               />;
      case 'unit_details':
        return <UnitDetailsView
                 unitId={state.selectedUnitId!}
                 onNavigate={actions.navigateTo}
                 onUpdate={actions.refreshState}
                 onOpenInventory={actions.handleOpenInventory}
                 onOpenCardDetails={actions.handleOpenCardDetails}
               />;
      case 'inventory':
        return <InventoryView
                 targetSlot={state.targetSlot}
                 fromUnitDetails={!!state.selectedUnitId}
                 onBack={() => actions.navigateTo(state.selectedUnitId ? 'unit_details' : 'home')}
                 onEquip={actions.handleEquipItem}
                 onOpenCardDetails={actions.handleOpenCardDetails}
               />;
      case 'campaign':
        return <CampaignMapView
                 playerEnergy={state.profile?.energy || 0}
                 onNavigate={actions.navigateTo}
                 onSelectStage={actions.handleSelectStage}
               />;
      case 'quests':
        return <QuestLogView
                 playerEnergy={state.profile?.energy || 0}
                 onNavigate={actions.navigateTo}
                 onOpenQuest={actions.handleOpenQuest}
               />;
      case 'stage_details':
        return <StageDetailsView
                 stage={state.selectedStage!}
                 playerEnergy={state.profile?.energy || 0}
                 onBack={() => actions.navigateTo('campaign')}
                 onStartBattle={actions.handleStartBattle}
               />;
      case 'battle':
        return <BattleScreenView 
                  squad={state.activePartyUnits} 
                  stageId={state.selectedStage?.id}
                  onBack={() => actions.navigateTo('campaign')}
                  onRefresh={actions.refreshState}
                />;
      case 'training':
        return <TrainingView 
                  unitId={state.selectedUnitId!}
                  unitName={state.roster.find(u => u.id === state.selectedUnitId)?.name || 'Unit'}
                  onBack={() => actions.navigateTo('unit_details')}
                  onUpdate={actions.refreshState}
                />;
      case 'skill_detail':
        return <SkillDetailView
                  skillId={state.selectedSkillId!}
                  itemId={state.selectedItemId!}
                  onBack={() => actions.navigateTo('inventory')}
                  onEquip={actions.handleEquipItem}
                  onDiscard={actions.handleDiscardItem}
                />;
      case 'card_detail':
        return <CardDetailView
                  cardId={state.selectedCardId!}
                  itemId={state.selectedItemId!}
                  onBack={() => actions.navigateTo(state.selectedUnitId ? 'unit_details' : 'inventory')}
                  onEquip={actions.handleEquipItem}
                  onDiscard={actions.handleDiscardItem}
                />;
      case 'daily_rewards':
        return <DailyRewardsView 
                  onBack={() => actions.navigateTo('home')}
                />;
      case 'arena':
        return <ArenaView 
                  onBack={() => actions.navigateTo('home')}
                  playerPower={state.profile?.power || 5000}
                />;
      case 'tower':
        return <TowerView 
                  onBack={() => actions.navigateTo('home')}
                  playerPower={state.profile?.power || 5000}
                />;
      case 'guild':
        return <GuildView 
                  onBack={() => actions.navigateTo('home')}
                />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Vista [{state.view}] en construcción.</p>
            <Button onClick={() => actions.navigateTo('home')} variant="secondary" size="sm">
              Volver
            </Button>
          </div>
        );
    }
  };

  // Global keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!state.isAuthenticated || state.error) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case '1': actions.navigateTo('party'); break;
      case '2': actions.navigateTo('tavern'); break;
      case '3': actions.navigateTo('gacha'); break;
      case '4': actions.navigateTo('inventory'); break;
      case 'b':
      case 'c': actions.navigateTo('campaign'); break;
      case 'q': actions.navigateTo('quests'); break;
      case 'escape': {
        if (state.view !== 'home') actions.navigateTo('home');
        break;
      }
      default: break;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#020508] font-sans flex items-center justify-center overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl bg-[#0B1A2A] h-[100dvh] sm:h-[85vh] sm:max-h-[850px] shadow-[0_0_80px_rgba(0,0,0,0.9)] sm:rounded-[40px] overflow-y-hidden relative border-white/5 flex flex-col items-center sm:border">

        {/* Persistent Header */}
        {!["battle", "auth"].includes(state.view) && <GlobalHeader profile={state.profile} onNavigate={actions.navigateTo} />}

        <div className="w-full h-full relative flex flex-col flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.view}
              initial={prefersReducedMotion ? { opacity: 1, x: 20 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 1, x: -20 } : { opacity: 0, x: -20 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
              className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden pb-20"
            >
              <ErrorBoundary>
                {renderView()}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Persistent Navigation */}
        <GlobalNavigation currentView={state.view} onNavigate={actions.navigateTo} />
      </div>

      {/* Global Card Details Modal */}
      {state.selectedCardId && (
        <CardModal 
          card={state.inventory.find(i => i.id === state.selectedCardId)}
          onClose={() => actions.setSelectedCardId(null)}
          onEquip={state.selectedUnitId ? actions.handleEquipItem : undefined}
          isEquipped={state.activePartyUnits.some(u => u?.cards?.some((c: any) => c.id === state.selectedCardId))}
        />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && state.isLoaded && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
