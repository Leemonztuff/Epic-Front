import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface TrainingResult {
  success: boolean;
  unitId: string;
  expGained: number;
  newLevel?: number;
  message?: string;
}

export class TrainingService {
  /**
   * Train a unit to gain EXP using the database RPC
   */
  static async trainUnit(
    unitId: string,
    trainingType: 'basic' | 'intensive' | 'elite' = 'basic'
  ): Promise<TrainingResult> {
    if (!supabase) return { success: false, unitId, expGained: 0, message: 'No supabase connection' };

    const config = this.getTrainingOptions().find(c => c.id === trainingType);
    if (!config) return { success: false, unitId, expGained: 0, message: 'Invalid training type' };

    try {
      const { data, error } = await supabase.rpc('rpc_train_unit', {
        p_unit_id: unitId,
        p_energy_cost: config.energyCost,
        p_exp_gain: config.expGain
      });

      if (error) throw error;

      return {
        success: true,
        unitId,
        expGained: config.expGain,
        message: `Entrenamiento completado. +${config.expGain} EXP`
      };
    } catch (e: any) {
      logger.error('error', 'Training failed:', e);
      return { success: false, unitId, expGained: 0, message: e.message || 'Error en el entrenamiento' };
    }
  }

  /**
   * Get training options available
   */
  static getTrainingOptions() {
    return [
      {
        id: 'basic',
        name: 'Entrenamiento Básico',
        description: 'Entrenamiento ligero para ganar EXP moderada',
        energyCost: 5,
        expGain: 25,
        icon: '⚔️'
      },
      {
        id: 'intensive',
        name: 'Entrenamiento Intensivo',
        description: 'Sesión rigurosa con mayor ganancia de EXP',
        energyCost: 15,
        expGain: 75,
        icon: '🔥'
      },
      {
        id: 'elite',
        name: 'Entrenamiento Élite',
        description: 'Entrenamiento extremo para máxima ganancia',
        energyCost: 30,
        expGain: 200,
        icon: '💎'
      }
    ];
  }
}
