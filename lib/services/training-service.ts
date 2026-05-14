import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface TrainingConfig {
  id: string;
  name: string;
  description: string;
  energy_cost: number;
  exp_gain: number;
  icon: string;
}

export interface TrainingResult {
  success: boolean;
  unitId: string;
  expGained: number;
  newLevel?: number;
  message?: string;
}

// Server-defined training options - loaded from config table
let trainingOptionsCache: TrainingConfig[] | null = null;

export class TrainingService {
  /**
   * Get training options - prefers server config, falls back to defaults
   */
  static async getTrainingOptions(): Promise<TrainingConfig[]> {
    // Return cached options if available
    if (trainingOptionsCache) {
      return trainingOptionsCache;
    }

    try {
      // Try to load from config table (server-authoritative)
      const { data, error } = await supabase
        .from('config')
        .select('key, value')
        .eq('category', 'training');

      if (!error && data && data.length > 0) {
        const options = data.find((c: any) => c.key === 'training_options');
        if (options?.value) {
          trainingOptionsCache = options.value as TrainingConfig[];
          return trainingOptionsCache;
        }
      }
    } catch (e) {
      logger.warn('performance', 'Failed to load training config from server, using defaults');
    }

    // Fallback to client defaults (should match server values)
    trainingOptionsCache = [
      { id: 'basic', name: 'Entrenamiento Básico', description: 'Entrenamiento ligero para ganar EXP moderada', energy_cost: 5, exp_gain: 25, icon: '⚔️' },
      { id: 'intensive', name: 'Entrenamiento Intensivo', description: 'Sesión rigurosa con mayor ganancia de EXP', energy_cost: 15, exp_gain: 75, icon: '🔥' },
      { id: 'elite', name: 'Entrenamiento Élite', description: 'Entrenamiento extremo para máxima ganancia', energy_cost: 30, exp_gain: 200, icon: '💎' }
    ];
    return trainingOptionsCache;
  }

  /**
   * Train a unit to gain EXP - server validates energy cost and calculates exp
   */
  static async trainUnit(
    unitId: string,
    trainingType: 'basic' | 'intensive' | 'elite' = 'basic'
  ): Promise<TrainingResult> {
    if (!supabase) return { success: false, unitId, expGained: 0, message: 'No supabase connection' };

    try {
      // Call RPC with only training type ID - server resolves actual values
      const { data, error } = await supabase.rpc('rpc_train_unit', {
        p_unit_id: unitId,
        p_training_type: trainingType  // Only send type ID, not values
      });

      if (error) throw error;

      // RPC returns actual exp gained (may differ from requested)
      const expGained = data?.exp_gained || 0;
      
      return {
        success: true,
        unitId,
        expGained,
        newLevel: data?.new_level,
        message: `Entrenamiento completado. +${expGained} EXP${data?.new_level ? ` (Nivel ${data.new_level})` : ''}`
      };
    } catch (e: any) {
        logger.error('error', 'Training failed', e as Error);
      return { success: false, unitId, expGained: 0, message: e.message || 'Error en el entrenamiento' };
    }
  }
}
