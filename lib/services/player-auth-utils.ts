// Player Authentication Utilities
// Shared helper functions for player ownership validation

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface SafeUserResult {
  success: boolean;
  user: User | null;
  error?: string;
}

export async function getSafeUser(): Promise<SafeUserResult> {
  if (!supabase) {
    return { success: false, user: null, error: 'Supabase not initialized' };
  }
  
  try {
    const result = await supabase.auth.getUser();
    const user = result.data?.user ?? null;
    
    if (!user) {
      return { success: false, user: null, error: 'No user session found' };
    }
    
    return { success: true, user };
  } catch (err) {
    return { 
      success: false, 
      user: null, 
      error: err instanceof Error ? err.message : 'Unknown auth error' 
    };
  }
}

export async function getCurrentPlayerId(): Promise<string | null> {
  if (!supabase) return null;
  const result = await getSafeUser();
  return result.success ? result.user!.id : null;
}

export async function getPlayerIdWithValidation(requiredPlayerId?: string): Promise<string> {
  const playerId = requiredPlayerId || await getCurrentPlayerId();
  if (!playerId) {
    throw new Error('Player not authenticated');
  }
  return playerId;
}