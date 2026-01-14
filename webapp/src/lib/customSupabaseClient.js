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

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
