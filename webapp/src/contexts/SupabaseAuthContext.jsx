import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { validateSessionStructure, clearSession, isSessionClaimError } from '@/lib/sessionUtils';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to track mount status
  const isMounted = useRef(true);
  // Use a ref to track if we are intentionally ignoring auth updates (during logout)
  const ignoreAuthUpdates = useRef(false);

  // --- HELPER: LOG & CLEAR ---
  const clearLocalState = () => {
    // Synchronous clearing of state
    if (isMounted.current) {
      setUser(null);
      setSession(null);
    }
    // Clear local storage items immediately
    clearSession(); 
    localStorage.removeItem('mc_screen');
    localStorage.removeItem('mc_workout');
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    isMounted.current = true;
    console.log('[AuthContext] Initializing auth...');

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.warn('[AuthContext] Session init error:', error);
            if (isSessionClaimError(error)) {
                clearLocalState();
            }
        } else if (currentSession) {
            if (validateSessionStructure(currentSession)) {
                console.log('[AuthContext] Valid session found on init.');
                if (isMounted.current) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                }
            } else {
                console.warn('[AuthContext] Invalid session structure on init.');
                clearLocalState();
            }
        } else {
            console.log('[AuthContext] No active session on init.');
        }
      } catch (err) {
        console.error("[AuthContext] Auth initialization critical error:", err);
        clearLocalState();
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      
      console.log(`AUTH_LISTENER: Auth state changed: ${event}`);

      // 1. If we are ignoring updates (during logout), skip
      if (ignoreAuthUpdates.current) {
        console.log("AUTH_LISTENER: Ignoring update due to active logout.");
        return;
      }

      // 2. If user is null and session is null, don't try to restore state blindly
      // unless it's a specific sign-in event.
      if (!user && !session && event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED' && event !== 'INITIAL_SESSION') {
         // If we are already cleared, and event is SIGNED_OUT, do nothing.
         if (event === 'SIGNED_OUT') return;
      }

      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] Listener caught SIGNED_OUT. Clearing state.');
        clearLocalState();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] Listener caught SIGN_IN/REFRESH. Updating state.');
        if (session && validateSessionStructure(session)) {
            setSession(session);
            setUser(session.user);
        } else {
            console.warn("[AuthContext] Invalid session in listener.");
            clearLocalState();
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription?.unsubscribe();
    };
  }, [toast]); 

  // --- LOGIN / SIGNUP ---

  const signUp = async (email, password, fullName) => {
    // Reset ignore flag just in case
    ignoreAuthUpdates.current = false;
    try {
      const options = { data: { full_name: fullName } };
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "Sign up failed", description: error.message });
      throw error;
    }
  };

  const signIn = async (email, password) => {
    // Reset ignore flag just in case
    ignoreAuthUpdates.current = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message,
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    ignoreAuthUpdates.current = false;
    try {
      const redirectTo = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { access_type: 'offline', prompt: 'consent' }, redirectTo },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "Google login failed", description: error.message });
      throw error;
    }
  };

  // --- SIMPLIFIED LOGOUT ---

  const signOut = () => {
    console.log("LOGOUT: Starting logout process");
    
    // Set flag to ignore subsequent listener events temporarily
    // to prevent race conditions where the listener might try to update state while we are clearing it.
    ignoreAuthUpdates.current = true;

    // 1. Call supabase.auth.signOut() without awaiting the promise (fire and forget pattern)
    // allowing the UI to update immediately. We handle errors in the .then callback.
    supabase.auth.signOut()
      .then(({ error }) => {
        if (error) {
           // Suppress specific "session_not_found" error which happens if token is already invalid
           const isSessionNotFound = 
             (error?.status === 403 && error?.code === 'session_not_found') ||
             (error?.message && error.message.includes('session_not_found'));

           if (isSessionNotFound) {
             console.log("LOGOUT: Session already invalid on server (session_not_found), suppressing error toast.");
           } else {
             console.error("LOGOUT: Server logout error", error);
             toast({
               variant: "destructive",
               title: "Logout Warning",
               description: "Local session cleared, but server reported an error: " + (error.message || "Unknown error"),
               duration: 3000
             });
           }
        } else {
           console.log("LOGOUT: Supabase session ended on server");
        }
      })
      .catch((err) => {
         console.error("LOGOUT: Unexpected error during signOut", err);
      })
      .finally(() => {
         // Reset flag after a delay to allow normal operations again
         setTimeout(() => { ignoreAuthUpdates.current = false; }, 2000);
      });

    // 2. Immediately clear state
    console.log("LOGOUT: signOut called, clearing state");
    
    // Synchronous state updates
    if (isMounted.current) {
        setUser(null);
        setSession(null);
    }

    // 3. Clear local storage
    try {
        clearSession();
        localStorage.removeItem('mc_screen');
        localStorage.removeItem('mc_workout');
    } catch (e) {
        console.error("LOGOUT: Error clearing local storage", e);
    }
    
    console.log("LOGOUT: State cleared, setting screen to 'welcome' (via App effect)");
    console.log("LOGOUT: Logout complete");
  };

  // --- HELPERS ---
  const checkProfileExists = async (userId) => {
    if (!userId) return false;
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', userId);
    return count > 0;
  };

  const getLatestUser = async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
  };

  const value = {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    checkProfileExists,
    getLatestUser,
    user,
    session,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};