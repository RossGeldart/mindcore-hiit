
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, KeyRound, Eye, EyeOff, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordScreen = ({ onBack, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states: 'verifying', 'valid', 'invalid', 'timeout', 'success'
  const [status, setStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // For requesting new link in error state
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  
  const { toast } = useToast();
  
  // Prevent double invocation in strict mode
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    let mounted = true;
    let timeoutId;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/584dc3a8-c0a6-44b2-9a6a-949fcd977f7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ResetPasswordScreen.jsx:useEffect',message:'ResetPasswordScreen mounted - starting verification',data:{href:window.location.href,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion

    // Detect if likely mobile in-app browser
    const isMobileInAppBrowser = (() => {
      if (typeof navigator === 'undefined') return false;
      const ua = navigator.userAgent || '';
      return (
        /FBAN|FBAV|Instagram|Twitter|Line|WhatsApp|Snapchat/i.test(ua) ||
        /GSA|Gmail/i.test(ua) ||
        (/wv|WebView/i.test(ua) && /Mobile/i.test(ua))
      );
    })();

    const verifyToken = async () => {
      // 1. Snapshot the URL immediately
      const currentUrl = window.location.href;
      const urlObj = new URL(currentUrl);
      const searchParams = new URLSearchParams(urlObj.search);
      // Clean hash of the # symbol
      const hashString = urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : urlObj.hash;
      const hashParams = new URLSearchParams(hashString);
      
      // Check for error parameters specifically from Supabase redirects
      const error = searchParams.get('error') || hashParams.get('error');
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
      
      if (error) {
        if (mounted) {
          setStatus('invalid');
          // Simplify error messages for the user
          const userFriendlyError = errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : "The link is invalid or has expired.";
          setErrorMessage(userFriendlyError);
        }
        return;
      }

      // 2. Identify Potential Auth Methods
      const code = searchParams.get('code'); // PKCE code
      const token = searchParams.get('token'); // Legacy magic link token
      const type = searchParams.get('type') || hashParams.get('type') || 'recovery';
      const accessToken = hashParams.get('access_token'); // Implicit flow
      const refreshToken = hashParams.get('refresh_token');

      console.log("[ResetPassword] URL params:", { code: !!code, token: !!token, type, accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/584dc3a8-c0a6-44b2-9a6a-949fcd977f7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ResetPasswordScreen.jsx:verifyToken',message:'Parsed URL params for verification',data:{hasCode:!!code,hasToken:!!token,type,hasAccessToken:!!accessToken,hasRefreshToken:!!refreshToken,fullUrl:currentUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,D'})}).catch(()=>{});
      // #endregion

      try {
        // STRATEGY 0: Wait for Supabase client to auto-detect and process URL tokens
        // The Supabase client with detectSessionInUrl: true should handle this automatically
        // Give it a moment to process
        console.log("[ResetPassword] Waiting for Supabase to auto-process URL...");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/584dc3a8-c0a6-44b2-9a6a-949fcd977f7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ResetPasswordScreen.jsx:verifyToken',message:'Starting Strategy 0 - waiting for auto-detect',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        await new Promise(r => setTimeout(r, 2000));

        // STRATEGY 1: Check Active Session (multiple attempts)
        // Sometimes the session takes a moment to be established
        for (let attempt = 0; attempt < 5; attempt++) {
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/584dc3a8-c0a6-44b2-9a6a-949fcd977f7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ResetPasswordScreen.jsx:verifyToken',message:'Strategy 1 - checking session',data:{attempt:attempt+1,hasSession:!!existingSession,userId:existingSession?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          if (existingSession) {
            console.log("[ResetPassword] Found existing session on attempt", attempt + 1);
            if (mounted) setStatus('valid');
            return;
          }
          
          if (attempt < 4) {
            console.log("[ResetPassword] No session yet, waiting... attempt", attempt + 1);
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        // STRATEGY 2: PKCE Flow (Exchange Code)
        if (code) {
          console.log("[ResetPassword] Attempting PKCE code exchange...");
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/584dc3a8-c0a6-44b2-9a6a-949fcd977f7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ResetPasswordScreen.jsx:verifyToken',message:'Strategy 2 - attempting PKCE exchange',data:{codeLength:code?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("[ResetPassword] PKCE exchange error:", error);
            // PKCE flow state error means user opened in different browser
            if (error.message?.includes('flow state') || error.message?.includes('PKCE') || error.message?.includes('code verifier')) {
              if (isMobileInAppBrowser) {
                throw new Error(
                  "This link opened in your email app instead of your main browser. " +
                  "Please copy the link and paste it into Safari or Chrome, or request a new link below."
                );
              } else {
                throw new Error(
                  "This reset link was opened in a different browser than where you requested it. " +
                  "Please request a new link below."
                );
              }
            }
            throw new Error(`The reset link is invalid or has expired. Please request a new one.`);
          }
          
          if (data?.session) {
             console.log("[ResetPassword] PKCE exchange successful");
             if (mounted) setStatus('valid');
             return;
          } else {
             throw new Error("Could not verify the reset link. Please try again.");
          }
        }

        // STRATEGY 3: Implicit Flow (Hash Processing)
        if (accessToken) {
          console.log("[ResetPassword] Attempting implicit flow session setup...");
          if (refreshToken) {
             const { error } = await supabase.auth.setSession({
               access_token: accessToken,
               refresh_token: refreshToken
             });
             if (error) throw error;
             if (mounted) setStatus('valid');
             return;
          }
          
          // Wait briefly for client auto-detection
          await new Promise(r => setTimeout(r, 1000));
          const { data: { session: rehydratedSession } } = await supabase.auth.getSession();
          if (rehydratedSession) {
             if (mounted) setStatus('valid');
             return;
          }
        }

        // STRATEGY 4: Legacy/Magic Link OTP
        if (token && type === 'recovery') {
          console.log("[ResetPassword] Attempting legacy OTP verification...");
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
          });
          if (error) throw error;
          if (mounted) setStatus('valid');
          return;
        }

        // FAILURE: No valid credentials found
        // If we're on mobile in-app browser and no tokens, give specific guidance
        if (isMobileInAppBrowser) {
          throw new Error(
            "We couldn't verify your reset link. This might be because you opened it in your email app. " +
            "Try copying the full link and pasting it into Safari or Chrome."
          );
        }
        throw new Error("The password reset link is missing or invalid.");

      } catch (err) {
        console.error("[ResetPassword] Verification error:", err);
        if (mounted) {
          setStatus('invalid');
          setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
        }
      }
    };

    // Watchdog to handle cases where verification takes too long or gets stuck
    // Increased to 30 seconds to allow for slow connections
    timeoutId = setTimeout(() => {
        if (mounted && status === 'verifying') {
            setStatus('timeout');
            setErrorMessage("The verification process timed out. Please check your internet connection or request a new link.");
        }
    }, 30000); 

    verifyToken();

    return () => { 
        mounted = false;
        clearTimeout(timeoutId);
    };
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password too short.", description: "Password must be at least 6 characters long." });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      
      if (error) throw error;

      setStatus('success');
      toast({ 
        title: "Success!", 
        description: "Your password has been reset.",
        className: "bg-green-600 text-white border-none"
      });

      await supabase.auth.signOut();
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else window.location.href = '/?screen=auth';
      }, 2000);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update password. Please try again."
      });
      setSubmitting(false);
    }
  };

  const handleRequestNewLink = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
        toast({ variant: "destructive", title: "Email required.", description: "Please enter your email to send a new link." });
        return;
    }
    
    setIsSendingLink(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset`,
        });
        if (error) throw error;
        
        toast({
            title: "Link Sent",
            description: "Check your email for a new reset link.",
            className: "bg-green-600 text-white border-none"
        });
        setTimeout(() => {
            window.location.href = '/?screen=auth';
        }, 2000);
    } catch (err) {
        toast({
            variant: "destructive",
            title: "Error",
            description: err.message
        });
    } finally {
        setIsSendingLink(false);
    }
  };

  // --- Render Error/Timeout State ---
  if (status === 'invalid' || status === 'timeout') {
      return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl text-center z-10"
            >
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Link Expired or Invalid</h2>
                <p className="text-muted-foreground mb-6">
                    {errorMessage}
                </p>
                
                <div className="bg-muted/50 p-4 rounded-xl mb-6">
                    <h3 className="text-sm font-medium mb-3">Request a new link</h3>
                    <form onSubmit={handleRequestNewLink} className="space-y-3">
                        <Input 
                            placeholder="Enter your email" 
                            type="email" 
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="bg-background"
                        />
                        <Button type="submit" className="w-full" disabled={isSendingLink}>
                            {isSendingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send New Link"}
                        </Button>
                    </form>
                </div>

                <Button variant="ghost" onClick={onBack} className="w-full">
                    Back to Login
                </Button>
            </motion.div>
        </div>
      );
  }

  // --- Render Success State ---
  if (status === 'success') {
      return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl text-center"
            >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                <p className="text-muted-foreground mb-6">
                    You can now log in with your new password.
                </p>
                <Button onClick={() => window.location.href = '/?screen=auth'} className="w-full">
                    Proceed to Login
                </Button>
            </motion.div>
        </div>
      );
  }

  // --- Render Main Form (Verifying or Valid) ---
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary opacity-[0.05] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500 opacity-[0.05] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative">
          
          {/* Status Indicator Overlay for Verifying State */}
          {status === 'verifying' && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-sm font-medium text-foreground">Verifying secure link...</p>
              </div>
          )}

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
            <p className="text-muted-foreground mt-2">
              Create a new secure password for your account.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-background/50 border-input focus:ring-primary/50"
                  placeholder="At least 6 characters"
                  required
                  disabled={status === 'verifying'} // Disable input while verifying
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  disabled={status === 'verifying'}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-background/50 border-input focus:ring-primary/50"
                  placeholder="Re-enter password"
                  required
                  disabled={status === 'verifying'}
                  autoComplete="new-password"
                />
                 <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  disabled={status === 'verifying'}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold mt-4"
              disabled={submitting || status === 'verifying'}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                </div>
              ) : status === 'verifying' ? (
                 <span className="opacity-80">Please wait...</span>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
             <Button variant="link" onClick={onBack} className="text-sm text-muted-foreground">
                 Cancel and return to login
             </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordScreen;
