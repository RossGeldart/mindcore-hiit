import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbvtyyvyfynromqbuykf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idnR5eXZ5Znlucm9tcWJ1eWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzM2MDksImV4cCI6MjA4MDQwOTYwOX0.JL3i7yl3oxesEbHNrYbrlO_irYK8-sL2hVNEgZGA7DQ';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session to localStorage
    persistSession: true,
    // Auto refresh tokens before they expire
    autoRefreshToken: true,
    // Detect and handle OAuth/magic link tokens from URL
    detectSessionInUrl: true,
    // Use PKCE flow for better mobile compatibility
    // PKCE uses query params (?code=) instead of hash fragments (#access_token=)
    // Hash fragments are often stripped by mobile in-app browsers
    flowType: 'pkce',
    // Storage key prefix
    storageKey: 'sb-mbvtyyvyfynromqbuykf-auth-token',
    // Use localStorage (default, but explicit for clarity)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// CRITICAL: Set up PASSWORD_RECOVERY listener IMMEDIATELY when module loads
// This runs BEFORE React even renders, so we can catch the event
// when Supabase auto-processes the reset code from the URL
if (typeof window !== 'undefined') {
  customSupabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('[Supabase] PASSWORD_RECOVERY event caught at module level!');
      // Store flag in sessionStorage - this persists across the React render
      sessionStorage.setItem('__is_password_recovery', 'true');
    }
  });
  
  // Also check URL path immediately for /auth/reset
  if (window.location.pathname === '/auth/reset') {
    console.log('[Supabase] /auth/reset path detected at module level');
    sessionStorage.setItem('__is_password_recovery', 'true');
  }
}

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
