import { supabase } from '@/lib/supabase';
import { CampaignService } from './campaign-service';
import { Stage } from '@/lib/rpg-system/campaign-types';

interface PlayerStageProgress {
  stage_id: string;
  cleared: boolean;
  stars: number;
}

export interface QuestEntry {
  id: string;
  name?: string;
  title: string;
  description: string;
  chapter: string;
  type: string;
  status: 'locked' | 'available' | 'completed' | 'active';
  energy_cost: number;
  objectives: Array<{id: string; description: string; completed: boolean}>;
  rewards: {
    currency: number;
    exp: number;
    premium_currency?: number;
    materials?: Array<{itemId: string; amount: number}>;
  };
  stage?: any;
  target_stage?: any;
}

export class QuestService {
  static async getQuestLog(): Promise<QuestEntry[]> {
    const [chapters, progress] = await Promise.all([
      CampaignService.getChapters(),
      CampaignService.getPlayerProgress()
    ]);

    const progressMap = new Map<string, PlayerStageProgress>(
      progress.map((item) => [item.stage_id, item])
    );

    const entries: QuestEntry[] = [];

    chapters.forEach((chapter) => {
      chapter.stages.forEach((stage) => {
        const progressItem = progressMap.get(stage.id);
        const cleared = progressItem?.cleared || false;
        const unlocked = !stage.unlock_requirements?.stage_id ||
          progressMap.has(stage.unlock_requirements.stage_id!);

        const status: QuestEntry['status'] = cleared
          ? 'completed'
          : unlocked
            ? 'active'
            : 'locked';

        const rewards = !cleared && stage.first_clear_rewards ? stage.first_clear_rewards : stage.rewards;

        entries.push({
          id: `quest_${stage.id}`,
          title: stage.name,
          chapter: chapter.name,
          type: 'CAMPAÑA',
          description: stage.description,
          objectives: stage.star_conditions.map((condition, index) => ({
            id: `${stage.id}_obj_${index}`,
            description: condition.description,
            completed: status === 'completed'
          })),
          rewards,
          energy_cost: stage.energy_cost,
          status,
          stage,
          target_stage: stage
        });
      });
    });

    return entries.sort((a, b) => {
      if (a.chapter === b.chapter) {
        return a.energy_cost - b.energy_cost;
      }
      return a.chapter.localeCompare(b.chapter);
    });
  }

  static async getQuestByStageId(stageId: string): Promise<Stage | null> {
    return await CampaignService.getStageById(stageId);
  }

  /**
    * Complete a simple quest and grant rewards.
    */
  static async completeQuest(amountZeny: number, amountGems: number) {
    if (!supabase) return;
    
    const { error } = await supabase.rpc('rpc_add_currency', {
      p_currency_amount: amountZeny,
      p_premium_amount: amountGems
    });

    if (error) throw error;
    return { success: true };
  }
}
