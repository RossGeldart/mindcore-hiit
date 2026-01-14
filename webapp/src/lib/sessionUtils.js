
import { supabase } from '@/lib/customSupabaseClient';

// Storage key must match what's in customSupabaseClient.js
const STORAGE_KEY = 'sb-mbvtyyvyfynromqbuykf-auth-token';

/**
 * Validates that a session object has the required structure and fields.
 * @param {Object} session - The session object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateSessionStructure = (session) => {
  if (!session) return false;
  
  const hasAccessToken = !!session.access_token;
  // Refresh token is not strictly required for a valid session object in memory (e.g. implicit flow sometimes), 
  // but highly recommended for persistence. We'll be lenient on refresh_token if access_token and user exist.
  const hasUser = !!session.user && !!session.user.id;
  
  // Basic structure check
  if (!hasAccessToken || !hasUser) {
    return false;
  }

  return true;
};

/**
 * Checks if an error is related to a missing or invalid session ID claim.
 * This specific error often requires a forced logout/cleanup.
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isSessionClaimError = (error) => {
  if (!error || !error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('session_id claim') || 
    msg.includes('session from session_id') || 
    msg.includes('not exist') ||
    msg.includes('claim does not exist')
  );
};

/**
 * Clears the session from Supabase and local storage.
 * Handles potential errors during sign out gracefully.
 */
export const clearSession = async () => {
  try {
    // Attempt standard sign out
    const { error } = await supabase.auth.signOut();
    if (error && !isSessionClaimError(error)) {
        console.warn("Standard signOut encountered error:", error);
    }
  } catch (e) {
    console.warn("SignOut exception:", e);
  }
  
  // Force clean local storage to remove corrupted tokens
  try {
    // Remove the main auth token using the known key
    localStorage.removeItem(STORAGE_KEY);
    
    // Also try legacy/fallback keys
    localStorage.removeItem('supabase.auth.token');
    
    // Try to find and remove any other supabase auth keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.includes('-auth-token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error("Failed to clear local storage", e);
  }
};

/**
 * Exchanges an auth code for a session with retry logic.
 * Specifically handles recovery flow codes as well.
 * @param {string} code - The authorization code
 * @param {number} maxRetries - Maximum number of retries (default 3)
 * @returns {Promise<Object>} - The session data { session, user }
 */
export const exchangeCodeForSessionWithRetry = async (code, maxRetries = 3) => {
  let attempt = 0;
  let lastError;

  if (!code) throw new Error("No code provided for exchange");

  console.log(`[SessionUtils] Starting code exchange. Code length: ${code.length}`);

  while (attempt < maxRetries) {
    try {
      console.log(`[SessionUtils] Exchanging code (Attempt ${attempt + 1}/${maxRetries})...`);
      
      // Use the standard exchange method which handles both signup/login and recovery codes
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error(`[SessionUtils] Exchange error on attempt ${attempt + 1}:`, error);
        
        // Critical errors that shouldn't be retried
        if (
             error.message?.includes('flow state not found') || 
             error.message?.includes('code') || 
             error.name === 'AuthApiError' && error.status === 400
           ) {
            throw error;
        }
        // For network errors or 5xx, we might retry
        throw error;
      }

      if (!data.session) {
        console.error("[SessionUtils] Exchange returned no session object:", data);
        throw new Error("Exchange successful but no session returned.");
      }

      if (!validateSessionStructure(data.session)) {
        console.error("[SessionUtils] Invalid session structure:", data.session);
        throw new Error("Invalid session structure received from exchange");
      }

      console.log("[SessionUtils] Exchange successful. User ID:", data.session.user.id);
      return data;

    } catch (err) {
      console.warn(`[SessionUtils] Exchange attempt ${attempt + 1} failed:`, err.message);
      lastError = err;
      attempt++;
      
      // If we reached max retries, fail
      if (attempt >= maxRetries) break;

      // Exponential backoff
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError;
};
