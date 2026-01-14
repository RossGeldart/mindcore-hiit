
import React, { useState } from 'react';
import { User, Loader2, ArrowRight, Sparkles, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { safeCreateUserStats } from '@/lib/userStatsUtils';

const ProfileSetupScreen = ({ onComplete }) => {
  const { user, signOut, getLatestUser } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null); // { message, code, retryable }

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    // App router will redirect to welcome/auth
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setErrorState(null);
    setIsLoading(true);

    try {
        console.log("Starting profile creation sequence...");

        // 1. Validate Context User
        let activeUser = user;
        
        // If context user is missing, try to fetch fresh from Supabase
        if (!activeUser || !activeUser.id) {
            console.log("Context user missing or incomplete. Fetching latest from Supabase...");
            activeUser = await getLatestUser();
        }

        if (!activeUser || !activeUser.id) {
             throw new Error("No authenticated user found. Please sign in again.");
        }

        console.log("Active User ID for Profile Creation:", activeUser.id);

        // 2. Strict ID Verification: Compare 'activeUser.id' with 'auth.uid()' equivalent from server
        // We get the user again directly to ensure the session token matches the ID we are about to use.
        // This prevents "inserting for ID X while authenticated as ID Y" scenarios.
        const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !serverUser) {
             console.error("Server session verification failed:", userError);
             throw new Error("Failed to verify active session with server. Please sign in again.");
        }

        if (serverUser.id !== activeUser.id) {
             console.error(`Security Mismatch! Context ID: ${activeUser.id}, Server ID: ${serverUser.id}`);
             throw new Error("Security check failed: User ID mismatch. Please sign out and try again.");
        }

        // 3. Attempt Profile Insertion
        // We explicitly use the verified 'activeUser.id'
        const { error: insertError } = await supabase.from('profiles').insert({
            id: activeUser.id,
            email: activeUser.email,
            full_name: fullName || 'New Member',
            role: 'user', // Default role
            avatar_url: activeUser?.user_metadata?.avatar_url || null
        });

        if (insertError) {
            console.error("Profile Insert Error:", insertError);
            throw insertError;
        }

        // 4. Initialize User Stats (Using safe utility)
        const statsResult = await safeCreateUserStats(activeUser.id);
        
        if (!statsResult.success) {
            // We log the error but don't block the profile creation success entirely, 
            // as the user can now access the app and the trigger might have worked anyway.
            console.warn("Stats creation warning:", statsResult.error);
        }

        toast({
            title: "Profile Created! 🎉",
            description: "You're all set to start your fitness journey.",
        });

        if (onComplete) onComplete();
        else window.location.reload(); 

    } catch (err) {
        console.error("Profile Setup Critical Failure:", err);
        
        let msg = err.message || "Failed to create profile.";
        let retryable = true;

        // Handle specific Postgres error codes
        if (err.code === '23503') { // foreign_key_violation
            msg = "Account synchronization error: User record mismatch. Please sign out and create your account again.";
            retryable = false;
        } else if (err.code === '23505') { // unique_violation
            // If profile exists, we just proceed
             console.log("Profile already exists, proceeding...");
             if (onComplete) onComplete();
             return;
        }

        setErrorState({ message: msg, code: err.code, retryable });
        
        toast({
            variant: "destructive",
            title: "Setup Failed",
            description: msg
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (errorState) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-md bg-card border border-destructive/20 rounded-2xl p-8 shadow-lg text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Setup Error</h2>
                <p className="text-muted-foreground mb-6">
                    {errorState.message}
                </p>
                <div className="space-y-3">
                    {errorState.retryable && (
                        <Button 
                            onClick={(e) => handleSubmit(e)} 
                            className="w-full" 
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Try Again
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={handleSignOut} 
                        className="w-full hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out & Re-authenticate
                    </Button>
                </div>
                {errorState.code && (
                    <p className="mt-6 text-xs text-muted-foreground/50 font-mono">
                        Error Code: {errorState.code}
                    </p>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
       <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
                  <User className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Complete Your Profile</h1>
              <p className="text-muted-foreground text-lg">
                  Let's get you set up to track your HIIT workouts.
              </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border shadow-sm">
              <div className="space-y-3">
                  <Label htmlFor="full-name" className="text-base">What should we call you?</Label>
                  <Input 
                    id="full-name"
                    type="text" 
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-14 text-lg"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Visible on leaderboards
                  </p>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold mt-4" disabled={isLoading}>
                  {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setting up...
                      </>
                  ) : (
                      <>
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                  )}
              </Button>
          </form>
       </div>
    </div>
  );
};

export default ProfileSetupScreen;
