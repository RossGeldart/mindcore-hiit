
import { supabase } from './customSupabaseClient';

/**
 * Safely creates user_stats record if it doesn't exist.
 * Handles checks and race conditions gracefully.
 * @param {string} userId 
 * @returns {Promise<{success: boolean, error?: any, message?: string}>}
 */
export const safeCreateUserStats = async (userId) => {
  if (!userId) {
    console.error('[safeCreateUserStats] No user ID provided');
    return { success: false, error: "No user ID provided" };
  }

  try {
    console.log(`[safeCreateUserStats] Checking stats for user ${userId}...`);

    // 1. Check if stats exist using maybeSingle() which returns null instead of throwing on 404
    const { data: existingStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn('[safeCreateUserStats] Error checking existence, attempting insert anyway:', fetchError);
      // Continue to insert as fallback
    }

    if (existingStats) {
      console.log('[safeCreateUserStats] Stats already exist. Skipping creation.');
      return { success: true, message: 'Stats already exist' };
    }

    // 2. Create if doesn't exist
    // We strictly use insert here. If a race condition happens between check and insert,
    // we handle the unique constraint violation below.
    const { error: insertError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_workouts: 0,
        total_minutes: 0,
        current_streak: 0,
        last_workout_date: null,
        weekly_goal: 3
      });

    if (insertError) {
      // Postgres error 23505 is unique_violation (duplicate key)
      if (insertError.code === '23505') {
         console.log('[safeCreateUserStats] Race condition detected: Stats created concurrently.');
         return { success: true, message: 'Created concurrently' };
      }
      
      console.error('[safeCreateUserStats] Creation failed:', insertError);
      return { success: false, error: insertError };
    }

    console.log('[safeCreateUserStats] Successfully created user stats.');
    return { success: true };

  } catch (error) {
    console.error('[safeCreateUserStats] Unexpected error:', error);
    return { success: false, error };
  }
};
