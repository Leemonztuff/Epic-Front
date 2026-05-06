import { supabase } from '@/lib/supabase';
import { generateNovice } from '@/lib/rpg-system/recruitment';

export interface OnboardingResult {
    username: string;
    success: boolean;
    isDemoMode: boolean;
}

export class OnboardingService {
    /**
     * Initializes a brand new player account atomically via RPC.
     * Requires Supabase to be properly configured with rpc_initialize_player deployed.
     */
    static async initializePlayer(username: string, maxRetries: number = 3): Promise<OnboardingResult> {
        if (!supabase) {
            throw new Error('Supabase is not configured. Please set up your .env.local with valid Supabase credentials.');
        }

        const novices = [
            generateNovice('physical'),
            generateNovice('ranged'),
            generateNovice('magic')
        ];

        let lastError: any = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const { error } = await supabase.rpc('rpc_initialize_player', {
                    p_username: username,
                    p_novices: novices
                });

                if (error) {
                    if (error.message?.includes('does not exist') || error.code === 'P0002') {
                        throw new Error('rpc_initialize_player function is not deployed. Please run supabase/02-functions.sql in your Supabase SQL Editor.');
                    }
                    throw error;
                }

                const { RecruitmentService } = await import('./recruitment-service');
                await RecruitmentService.refreshTavern();

                return { username, success: true, isDemoMode: false };
            } catch (err: any) {
                lastError = err;

                if (err.message?.includes('no está disponible') || err.message?.includes('does not exist')) {
                    throw new Error('rpc_initialize_player function is not deployed. Please run supabase/02-functions.sql in your Supabase SQL Editor.');
                }

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('No se pudo inicializar el jugador después de varios intentos');
    }
}
