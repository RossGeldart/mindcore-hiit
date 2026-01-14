import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, KeyRound, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordScreen = ({ onBack, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('ready'); // 'ready', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const { updatePassword, signOut, user } = useAuth();
  const { toast } = useToast();

  // Check if user has a valid session (they should after clicking the reset link)
  useEffect(() => {
    // Clean URL once we have a session (Supabase has finished processing)
    if (user) {
      window.history.replaceState({}, '', '/');
    }
    
    // If no user after a short delay, the link might be invalid
    const timer = setTimeout(() => {
      if (!user && status === 'ready') {
        setStatus('error');
        setErrorMessage('Your reset link may have expired. Please request a new one.');
      }
    }, 5000); // Increased to 5 seconds to give more time for session

    return () => clearTimeout(timer);
  }, [user, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }

    setStatus('submitting');

    try {
      await updatePassword(password);
      setStatus('success');
      toast({
        title: "Password updated!",
        description: "You can now sign in with your new password.",
        className: "bg-green-600 text-white border-none"
      });

      // Sign out and redirect to login after a delay
      setTimeout(async () => {
        await signOut();
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to update password. Please try again.');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
          <p className="text-muted-foreground mb-6">
            Redirecting you to login...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </motion.div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button onClick={onBack} className="w-full">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Loading overlay while checking session */}
          {!user && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Verifying your link...</p>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Set New Password</h2>
            <p className="text-muted-foreground mt-2">Create a new secure password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="At least 6 characters"
                  required
                  disabled={status === 'submitting' || !user}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Confirm your password"
                  required
                  disabled={status === 'submitting' || !user}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-6"
              disabled={status === 'submitting' || !user}
            >
              {status === 'submitting' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Update Password"
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
