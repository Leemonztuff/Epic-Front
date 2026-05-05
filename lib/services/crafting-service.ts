import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { Rarity } from '@/lib/rpg-system/gacha-types';
import { GACHA_DATABASE, SkillFragmentItem } from '@/lib/rpg-system/gacha-data';

export interface SkillFragment {
  fragmentId: string;
  name: string;
  description: string;
  pieceCount: number;
  rarity: Rarity;
  skillModuleId: string;
}

export interface PlayerFragment extends SkillFragment {
  currentQuantity: number;
}

export interface LearnedSkill {
  skillModuleId: string;
  skillName: string;
  skillDescription: string;
  learnedAt: string;
}

export interface CraftResult {
  success: boolean;
  skillModuleId?: string;
  skillName?: string;
  error?: string;
}

export class CraftingService {
  static async getPlayerFragments(playerId: string): Promise<PlayerFragment[]> {
    const { data, error } = await supabase.rpc('rpc_get_player_fragments', {
      p_player_id: playerId,
    });

    if (error) {
      gameDebugger.error('crafting', 'Error fetching fragments', error);
      return [];
    }

    return data || [];
  }

  static async getPlayerLearnedSkills(playerId: string): Promise<LearnedSkill[]> {
    const { data, error } = await supabase.rpc('rpc_get_player_learned_skills', {
      p_player_id: playerId,
    });

    if (error) {
      gameDebugger.error('crafting', 'Error fetching learned skills', error);
      return [];
    }

    return data || [];
  }

  static async craftSkill(
    playerId: string,
    fragmentId: string
  ): Promise<CraftResult> {
    const fragment = GACHA_DATABASE[fragmentId] as SkillFragmentItem | undefined;
    if (!fragment || fragment.type !== 'skill_fragment') {
      return { success: false, error: 'Fragmento no encontrado' };
    }

    const { data, error } = await supabase.rpc('rpc_craft_skill', {
      p_player_id: playerId,
      p_fragment_id: fragmentId,
    });

    if (error) {
      gameDebugger.error('crafting', 'Craft error', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      skillModuleId: fragment.skillModuleId,
      skillName: fragment.name.replace('Fragmento: ', ''),
    };
  }

  static async canCraft(
    playerId: string,
    fragmentId: string
  ): Promise<{ canCraft: boolean; missing: number; needed: number }> {
    const fragment = GACHA_DATABASE[fragmentId] as SkillFragmentItem | undefined;
    if (!fragment || fragment.type !== 'skill_fragment') {
      return { canCraft: false, missing: 0, needed: fragment?.pieceCount || 0 };
    }

    const fragments = await this.getPlayerFragments(playerId);
    const playerFragment = fragments.find((f) => f.fragmentId === fragmentId);

    if (!playerFragment) {
      return {
        canCraft: false,
        missing: fragment.pieceCount,
        needed: fragment.pieceCount,
      };
    }

    const missing = Math.max(0, fragment.pieceCount - playerFragment.currentQuantity);
    return {
      canCraft: playerFragment.currentQuantity >= fragment.pieceCount,
      missing,
      needed: fragment.pieceCount,
    };
  }

  static async addFragmentToPlayer(
    playerId: string,
    fragmentId: string,
    amount: number = 1
  ): Promise<boolean> {
    const { error } = await supabase.rpc('rpc_add_skill_fragment', {
      p_player_id: playerId,
      p_fragment_id: fragmentId,
      p_amount: amount,
    });

    if (error) {
      gameDebugger.error('crafting', 'Error adding fragment', error);
      return false;
    }

    return true;
  }
}