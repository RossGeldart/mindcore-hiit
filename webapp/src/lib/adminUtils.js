import { supabase } from '@/lib/customSupabaseClient';

/**
 * Resets a user's workout statistics (total minutes and total workouts) to zero.
 * 
 * @param {string} userEmail - The email address of the user to reset.
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export async function resetUserWorkoutStats(userEmail) {
  try {
    if (!userEmail) {
      throw new Error('Email is required');
    }

    // 1. Fetch user profile by email from the profiles table
    // Note: This relies on the email column existing in profiles (added via migration)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError) {
      // Improve error message for common cases
      if (profileError.code === 'PGRST116') {
        throw new Error(`User with email "${userEmail}" not found.`);
      }
      throw new Error(`Error finding user: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('User profile not found.');
    }

    const userId = profile.id;

    // 2. Update user_stats table
    // Uses the new RLS policy: "Admins can update all user stats"
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        total_minutes: 0, 
        total_workouts: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update stats: ${updateError.message}`);
    }

    return { success: true, userId };
  } catch (error) {
    console.error('Reset stats error:', error);
    return { success: false, error: error.message };
  }
}