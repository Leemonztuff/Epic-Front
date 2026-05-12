import { supabase } from '@/lib/supabase';
import { gameDebugger } from '@/lib/debug';
import { LOGIN_BONUS_SCHEDULE, type DailyBonus } from '@/lib/config/login-bonus';
import { PROGRESSION_LEVELS } from '@/lib/config/level-curve';

// ─── Login Bonus Config ─────────────────────────────────────────

export interface LoginBonusEntry {
  day: number;
  currency: number;
  premium_currency: number;
  exp: number;
  item?: string;
  is_special: boolean;
}

export class LoginBonusConfigService {
  static async getSchedule(): Promise<LoginBonusEntry[]> {
    if (!supabase) return this.getFallback();

    try {
      const { data, error } = await supabase
        .from('login_bonus_config')
        .select('*')
        .order('day', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.getFallback();
      }

      return data.map((row: any) => ({
        day: row.day,
        currency: row.currency,
        premium_currency: row.premium_currency || 0,
        exp: row.exp || 0,
        item: row.item || undefined,
        is_special: row.is_special || false,
      }));
    } catch {
      return this.getFallback();
    }
  }

  static async updateEntry(day: number, entry: Partial<LoginBonusEntry>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('login_bonus_config')
      .upsert({ day, ...entry }, { onConflict: 'day' });
    return !error;
  }

  private static getFallback(): LoginBonusEntry[] {
    return LOGIN_BONUS_SCHEDULE.map(d => ({
      day: d.day,
      currency: d.currency,
      premium_currency: d.premiumCurrency,
      exp: d.exp,
      item: d.item,
      is_special: d.isSpecial,
    }));
  }
}

// ─── Gacha Config ────────────────────────────────────────────────

export interface GachaConfigItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  rate?: number;
  stats?: Record<string, any>;
}

export class GachaConfigService {
  static async getItems(): Promise<GachaConfigItem[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('gacha_items')
        .select('*')
        .order('rarity', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  static async updateItem(id: string, updates: Partial<GachaConfigItem>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('gacha_items')
      .upsert({ id, ...updates }, { onConflict: 'id' });
    return !error;
  }
}

// ─── Level Curve Config ──────────────────────────────────────────

export interface LevelCurveEntry {
  level: number;
  exp_required: number;
  energy_cost: number;
  enemy_power: number;
  unlock_feature?: string;
}

export class LevelCurveConfigService {
  static getCurve(): LevelCurveEntry[] {
    return PROGRESSION_LEVELS.slice(0, 50).map((entry: any, i: number) => ({
      level: i + 1,
      exp_required: entry.expRequired,
      energy_cost: entry.energyCost,
      enemy_power: entry.enemyPower,
      unlock_feature: entry.unlockFeature,
    }));
  }
}
