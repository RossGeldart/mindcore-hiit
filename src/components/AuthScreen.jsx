import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const AuthScreen = ({ onBack, onSuccess, initialView = 'login' }) => {
  const [view, setView] = useState(initialView); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setShowPassword(false);
    setResetSent(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (error) {
      // Error toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password, fullName);
      
      if (data?.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Check your email",
          description: "We've sent you a verification link. Please check your inbox.",
          className: "bg-green-600 text-white border-none"
        });
        setView('login');
        resetForm();
      } else if (data?.session) {
        // Auto-confirmed (development mode)
        onSuccess?.();
      }
    } catch (error) {
      // Error toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast({
        title: "Email sent",
        description: "Check your inbox for the password reset link.",
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      // Error toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView) => {
    resetForm();
    setView(newView);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <AnimatePresence mode="wait">
              {/* LOGIN VIEW */}
              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Sign in to continue your journey</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="you@example.com"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          placeholder="••••••••"
                          required
                          disabled={loading}
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

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{' '}
                    <button
                      onClick={() => switchView('signup')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </motion.div>
              )}

              {/* SIGNUP VIEW */}
              {view === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
                    <p className="text-muted-foreground mt-2">Start your fitness journey today</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          placeholder="John Doe"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="you@example.com"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          placeholder="At least 6 characters"
                          required
                          disabled={loading}
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
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{' '}
                    <button
                      onClick={() => switchView('login')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* FORGOT PASSWORD VIEW */}
              {view === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {resetSent ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                      <p className="text-muted-foreground mb-6">
                        We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Don't see it? Check your spam folder.
                      </p>
                      <Button onClick={() => switchView('login')} className="w-full">
                        Back to Login
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
                        <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
                      </div>

                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              placeholder="you@example.com"
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full h-12" disabled={loading}>
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                        </Button>
                      </form>

                      <p className="text-center text-sm text-muted-foreground mt-6">
                        Remember your password?{' '}
                        <button
                          onClick={() => switchView('login')}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthScreen;
