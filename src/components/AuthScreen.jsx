import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Loader2, UserPlus, LogIn, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { safeCreateUserStats } from '@/lib/userStatsUtils';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

const AuthScreen = ({ onBack, onLoginSuccess, initialView = 'login' }) => {
  const [view, setView] = useState(initialView); // 'login', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (initialView && ['login', 'signup'].includes(initialView)) setView(initialView);
    setErrorMessage(null);
  }, [initialView]);

  useEffect(() => {
    setErrorMessage(null);
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (view === 'login') {
        const result = await signIn(email, password);
        if (result?.user) {
            toast({
              title: "Welcome back!",
              description: "Successfully logged in.",
            });
            onLoginSuccess(result.user);
        }
      } else if (view === 'signup') {
        // 1. Perform Signup
        const result = await signUp(email, password, fullName);
        
        if (result?.user) {
             // 2. Safely ensure stats exist (Double Check)
             const statsResult = await safeCreateUserStats(result.user.id);

             if (!statsResult.success && !result.statsError) {
                 console.warn("Post-signup stats verification failed:", statsResult.error);
                 toast({
                     variant: "destructive", 
                     title: "Account Created with Warning",
                     description: "We couldn't initialize your stats automatically. They will be created when you first view your profile.",
                 });
             } else if (result.statsError) {
                  toast({
                     variant: "destructive", 
                     title: "Account Created with Warning",
                     description: "We couldn't initialize your stats automatically.",
                 });
             } else {
                 toast({
                    title: "Account created!",
                    description: "Welcome to Mind Core HIIT.",
                 });
             }
             onLoginSuccess(result.user);
        }
      }
    } catch (error) {
      let msg = error.message || "An unexpected error occurred.";
      if (msg.includes("Invalid login credentials")) {
          msg = "Invalid email or password.";
      } else if (msg.includes("already registered")) {
          msg = "This email is already registered. Try logging in.";
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'signup': return 'Create Account';
      default: return 'Welcome Back';
    }
  };

  const getDescription = () => {
    switch(view) {
      case 'signup': return 'Sign up to track your workout progress';
      default: return 'Enter your credentials to access your stats';
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary opacity-[0.05] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary opacity-[0.05] blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
        </Button>
        
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {getTitle()}
            </h2>
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 text-sm text-destructive items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
               <div className="space-y-2">
                 <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type="text"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                     placeholder="John Doe"
                     required
                   />
                 </div>
               </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            {view === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe} 
                    onCheckedChange={setRememberMe} 
                  />
                  <label 
                    htmlFor="remember" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                    Forgot password?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold mt-6"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : view === 'login' ? (
                <>
                  Log In <LogIn className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Sign Up <UserPlus className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthScreen;