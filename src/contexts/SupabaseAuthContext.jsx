import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

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
  const isMounted = useRef(true);

  // Initialize auth state
  useEffect(() => {
    isMounted.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[Auth] Session init error:', error);
        } else if (currentSession) {
          if (isMounted.current) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        }
      } catch (err) {
        console.error("[Auth] Initialization error:", err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      
      console.log(`[Auth] State changed: ${event}`);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "Sign up failed", description: error.message });
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (error) {
      const message = error.message === "Invalid login credentials" 
        ? "Incorrect email or password." 
        : error.message;
      toast({ variant: "destructive", title: "Login failed", description: message });
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "Google login failed", description: error.message });
      throw error;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      });
      if (error) throw error;
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Reset failed", description: error.message });
      throw error;
    }
  };

  // Update user password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem('mc_screen');
  };

  // Check if user has a profile
  const checkProfileExists = async (userId) => {
    if (!userId) return false;
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', userId);
    return count > 0;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    checkProfileExists
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
