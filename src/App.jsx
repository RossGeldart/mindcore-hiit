// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { Volume2, VolumeX, Sun, Moon, Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useSound } from '@/contexts/SoundContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuth, AuthProvider } from '@/contexts/SupabaseAuthContext';
import { initializeWorkoutDatabase, generateWorkout } from '@/lib/workoutGenerator';
import { clearSession, validateSessionStructure } from '@/lib/sessionUtils';

// NEW: Maintenance Page Import
import MaintenancePage from '@/components/MaintenancePage';

// Eager imports
import WelcomeMessage from '@/components/WelcomeMessage';
import TimeSelection from '@/components/TimeSelection';
import DiceScreen from '@/components/DiceScreen';
import WorkoutSummary from '@/components/WorkoutSummary';
import TimerScreen from '@/components/TimerScreen';
import AuthScreen from '@/components/AuthScreen';
import ProfileScreen from '@/components/ProfileScreen';
import BottomNavigation from '@/components/BottomNavigation';
import BadgesScreen from '@/components/BadgesScreen';
import MembersPage from '@/components/MembersPage';
import MemberProfileView from '@/components/MemberProfileView';
import ProfileSetupScreen from '@/components/ProfileSetupScreen';
import PrivacyPolicy from '@/components/PrivacyPolicy';

// NEW: Auth callback + reset password screens
import AuthCallback from '@/components/AuthCallback';
import ResetPasswordScreen from '@/components/ResetPasswordScreen';

// Stats Pages
import StatsStreak from '@/components/StatsStreak';
import StatsMinutes from '@/components/StatsMinutes';
import StatsWorkouts from '@/components/StatsWorkouts';
import LeaderboardPage from '@/components/LeaderboardPage';

// Lazy imports
const AdminDashboard = React.lazy(() => import('@/components/AdminDashboard'));
const AdminUtilities = React.lazy(() => import('@/components/AdminUtilities'));
// Terms is mostly static, but kept lazy to reduce bundle size initially if rarely accessed, though eager is fine too. 
// We will use Lazy as per previous pattern for consistency with secondary pages.
const TermsOfService = React.lazy(() => import('@/components/TermsOfService'));
const SubscriptionScreen = React.lazy(() => import('@/components/SubscriptionScreen'));

const STRIPE_PLANS = {
  monthly: 'prod_TYtLbjvv6GscYH',
  annual: 'prod_TYtMWgdV4gkDpG',
  lifetime: 'prod_TYtNL771NlMIrz'
};

// Define all valid screens
const VALID_SCREENS = [
  'welcome',
  'auth',
  'auth_callback',
  'reset_password',
  'profile',
  'profile_setup',
  'members',
  'member_profile',
  'stats_streak',
  'stats_minutes',
  'stats_workouts',
  'stats_leaderboard',
  'badges',
  'admin',
  'admin_utils',
  'subscription',
  'privacy',
  'terms',
  'time',
  'dice',
  'workoutDisplay',
  'timer'
];

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeInOut' }
};

const PageWrapper = ({ children, className = '' }) => (
  <motion.div
    {...pageTransition}
    className={`w-full h-full ${className}`}
    style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
  >
    {children}
  </motion.div>
);

const PageSEO = ({ title, description }) => (
  <Helmet>
    <title>{title} | Mind Core HIIT Generator</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={`${title} | Mind Core HIIT Generator`} />
    <meta property="og:description" content={description} />
    <meta property="og:site_name" content="Mind Core HIIT Generator" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${title} | Mind Core HIIT Generator`} />
    <meta name="twitter:description" content={description} />
  </Helmet>
);

const HeaderControls = () => {
  const { isMuted, toggleMute } = useSound();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full border-primary/20 hover:bg-primary/10 bg-background/80 backdrop-blur-sm text-foreground transition-colors"
      >
        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleMute}
        className={`rounded-full border-primary/20 hover:bg-primary/80 transition-colors ${
          isMuted ? 'bg-background/80 text-muted-foreground' : 'bg-primary text-white'
        }`}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>
    </div>
  );
};

const LoadingFallback = ({ message = 'Loading...' }) => (
  <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <p>{message}</p>
  </div>
);

const VerificationLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
    <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
    <p className="text-muted-foreground">Please wait a moment.</p>
  </div>
);

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    // 1. Check path (for /reset and clean URLs)
    const path = window.location.pathname;
    if (path === '/reset') return 'reset_password';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';

    // 2. Check query params
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');
    if (screenParam && VALID_SCREENS.includes(screenParam)) return screenParam;

    // 3. Fallback to localStorage
    const saved = localStorage.getItem('mc_screen');
    if (saved === 'dashboard') return 'profile';
    return saved && VALID_SCREENS.includes(saved) ? saved : 'welcome';
  });

  // Log screen changes
  useEffect(() => {
    console.log(`📱 APP: Screen changed to [${currentScreen}]`);
  }, [currentScreen]);

  const [selectedTime, setSelectedTime] = useState(() => {
    try {
      const item = localStorage.getItem('mc_time');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [generatedWorkout, setGeneratedWorkout] = useState(() => {
    try {
      const item = localStorage.getItem('mc_workout');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [authInitialView, setAuthInitialView] = useState('login');

  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const { playClick, playLetsGo } = useSound();
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const subscriptionRef = useRef(subscription);

  // NEW: If Supabase lands on "/" with auth params (mobile often), force auth_callback screen.
  // Unless it is a reset password flow (which might be handled differently)
  useEffect(() => {
    const url = new URL(window.location.href);
    console.log("🌐 URL Check on Mount:", url.href);
    
    // Explicitly check for reset path
    if (url.pathname === '/reset') {
        console.log("Found /reset path, switching to reset_password screen.");
        setCurrentScreen('reset_password');
        return;
    }

    // Explicitly check for privacy path
    if (url.pathname === '/privacy') {
        console.log("Found /privacy path, switching to privacy screen.");
        setCurrentScreen('privacy');
        return;
    }

    // Explicitly check for terms path
    if (url.pathname === '/terms') {
      console.log("Found /terms path, switching to terms screen.");
      setCurrentScreen('terms');
      return;
    }

    const hasCode = url.searchParams.has('code');
    const typeFromQuery = (url.searchParams.get('type') || '').toLowerCase();

    const hash = (url.hash || '').startsWith('#') ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    const hasAccessToken = hashParams.has('access_token');
    const typeFromHash = (hashParams.get('type') || '').toLowerCase();

    const type = typeFromQuery || typeFromHash;

    console.log("🔑 Auth Params Check:", { hasCode, hasAccessToken, type });

    // Logic: If it looks like a recovery flow, send to reset_password screen directly
    if (type === 'recovery') {
        console.log("Recovery flow detected, forcing reset_password screen.");
        setCurrentScreen('reset_password');
    } else if (hasCode || hasAccessToken) {
        // Standard auth callback
        console.log("Standard auth callback detected.");
        setCurrentScreen('auth_callback');
    }
  }, []);

  // Initial Session Validation on Mount
  useEffect(() => {
    const checkInitialSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session && !validateSessionStructure(session)) {
        await clearSession();
        if (!['welcome', 'auth', 'auth_callback', 'reset_password', 'privacy', 'terms'].includes(currentScreen)) {
          setCurrentScreen('welcome');
        }
      }
    };

    checkInitialSession();
  }, [currentScreen]);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (VALID_SCREENS.includes(currentScreen)) {
      localStorage.setItem('mc_screen', currentScreen);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (selectedTime) localStorage.setItem('mc_time', JSON.stringify(selectedTime));
    else localStorage.removeItem('mc_time');
  }, [selectedTime]);

  useEffect(() => {
    if (generatedWorkout) localStorage.setItem('mc_workout', JSON.stringify(generatedWorkout));
    else localStorage.removeItem('mc_workout');
  }, [generatedWorkout]);

  useEffect(() => {
    subscriptionRef.current = subscription;
  }, [subscription]);

  // Auth Protection & Routing Logic
  useEffect(() => {
    if (loading) return;

    const publicScreens = ['welcome', 'auth', 'privacy', 'terms', 'auth_callback', 'reset_password'];

    // 1. If user is logged out, but on a protected screen -> Redirect to Welcome
    if (!user && !publicScreens.includes(currentScreen)) {
      console.log(`[App] User logged out, redirecting from ${currentScreen} to welcome`);
      setCurrentScreen('welcome');
      return;
    }

    // 2. If user is logged in, but on auth/welcome screen -> Redirect to Profile
    // NOTE: We do NOT redirect away from reset_password even if logged in, because the user might have been auto-logged in by the magic link
    if (user && (currentScreen === 'welcome' || currentScreen === 'auth')) {
      // Don't redirect if we're on reset password screen or privacy or terms!
      if (currentScreen !== 'reset_password' && currentScreen !== 'privacy' && currentScreen !== 'terms') {
          console.log(`[App] User logged in, redirecting from ${currentScreen} to profile`);
          setCurrentScreen('profile');
      }
      return;
    }

    // 3. Special check for workout screens
    const needsWorkout = ['timer', 'workoutDisplay'];
    if (needsWorkout.includes(currentScreen) && !generatedWorkout) {
      setCurrentScreen(user ? 'profile' : 'welcome');
    }
  }, [user, loading, currentScreen, generatedWorkout]);

  const fetchSubscription = useCallback(
    async (withLoading = true) => {
      if (!user) {
        setSubscription(null);
        setSubscriptionLoading(false);
        return;
      }

      if (withLoading) setSubscriptionLoading(true);

      try {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

        if (profile?.role === 'admin') {
          setSubscription({
            status: 'lifetime',
            plan_type: 'lifetime',
            current_period_end: new Date(2099, 11, 31).toISOString()
          });
        } else {
          const { data: subData, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (subError) setSubscription(null);
          else setSubscription(subData);
        }
      } finally {
        setSubscriptionLoading(false);
      }
    },
    [user]
  );

  const syncSubscriptionStatus = useCallback(async () => {
    if (!user) return;

    const currentSub = subscriptionRef.current;
    if (currentSub?.plan_type === 'lifetime' && currentSub?.current_period_end?.includes('2099')) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error || !data) return;
      fetchSubscription(false);
    } catch {
      // no-op
    }
  }, [user, fetchSubscription]);

  useEffect(() => {
    let intervalId;
    if (user && !loading) {
      fetchSubscription(true);
      syncSubscriptionStatus();
      intervalId = setInterval(syncSubscriptionStatus, 5 * 60 * 1000);
    } else if (!user && !loading) {
      setSubscription(null);
      setSubscriptionLoading(false);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [user, loading, fetchSubscription, syncSubscriptionStatus]);

  const effectiveSubscription = useMemo(() => {
    if (!subscription) return null;
    const now = new Date();
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

    let effectiveStatus = subscription.status;
    if (subscription.status === 'canceled' && periodEnd && periodEnd > now) {
      effectiveStatus = 'active';
    }

    return { ...subscription, status: effectiveStatus, original_status: subscription.status };
  }, [subscription]);

  const initiateCheckout = async (planType, userId = null) => {
    const activeUserId = userId || user?.id;

    if (!activeUserId) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in to continue.' });
      setAuthInitialView('login');
      setCurrentScreen('auth');
      return;
    }

    const productId = STRIPE_PLANS[planType];
    if (!productId) {
      toast({ variant: 'destructive', title: 'Configuration Error', description: 'Plan not configured.' });
      return;
    }

    try {
      setIsCheckoutLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: productId, userId: activeUserId, origin: window.location.origin }
      });

      if (error) throw new Error(error.message);
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL returned');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Checkout Failed', description: err.message });
      setIsCheckoutLoading(false);
    }
  };

  useEffect(() => {
    initializeWorkoutDatabase();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      setVerificationSessionId(sessionId);
      setVerifyingPayment(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => window.scrollTo(0, 0), [currentScreen]);

  useEffect(() => {
    if (verifyingPayment && verificationSessionId) {
      const verifyPayment = async () => {
        try {
          const body = { sessionId: verificationSessionId, userId: user?.id };
          const { data, error } = await supabase.functions.invoke('verify-payment', { body });

          if (error) throw error;

          if (data?.success) {
            await fetchSubscription(true);
            toast({ title: 'Success!', description: 'Your subscription is active.' });
            setCurrentScreen(user ? 'profile' : 'auth');
            if (!user) setAuthInitialView('login');
          } else {
            throw new Error(data?.error || 'Verification unsuccessful');
          }
        } catch {
          toast({ variant: 'destructive', title: 'Verification Failed', description: 'Could not verify payment.' });
          setCurrentScreen('profile');
        } finally {
          setVerifyingPayment(false);
          setVerificationSessionId(null);
        }
      };

      if (!loading) verifyPayment();
    }
  }, [verifyingPayment, verificationSessionId, user, loading, fetchSubscription, toast]);

  const handlePlanSelection = (plan) => {
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please sign in to subscribe.' });
      setAuthInitialView('signup');
      setCurrentScreen('auth');
      return;
    }
    initiateCheckout(plan);
  };

  const handleAuthSuccess = () => {
    setCurrentScreen('profile');
  };

  const resetWorkout = () => {
    playClick();
    setCurrentScreen(user ? 'profile' : 'welcome');
    setSelectedTime(null);
    setGeneratedWorkout(null);
  };

  const handleScreenChange = (screen) => {
    if (VALID_SCREENS.includes(screen)) {
      playClick();
      // Handle navigation to /reset path explicitly if needed, but SPA state is preferred for transitions
      // If we are on /reset path and navigate away, we might want to update URL back to / or similar
      if (window.location.pathname === '/reset' && screen !== 'reset_password') {
          window.history.pushState({}, '', '/');
      }
      // If we are on /privacy path and navigate away, go back to root
      if (window.location.pathname === '/privacy' && screen !== 'privacy') {
          window.history.pushState({}, '', '/');
      }
      // If we are on /terms path and navigate away, go back to root
      if (window.location.pathname === '/terms' && screen !== 'terms') {
        window.history.pushState({}, '', '/');
      }
      setCurrentScreen(screen);
    }
  };

  const handleMemberSelect = (memberId) => {
    playClick();
    if (memberId === user?.id) {
      setCurrentScreen('profile');
    } else {
      setSelectedMemberId(memberId);
      setCurrentScreen('member_profile');
    }
  };

  const handleDiceRollComplete = () => {
    const workout = generateWorkout(['bodyweight', 'dumbbells', 'kettlebell'], selectedTime, 'core');
    setGeneratedWorkout(workout);
    handleScreenChange('workoutDisplay');
  };

  const goBack = () => {
    playClick();
    const backMap = {
      auth: 'welcome',
      auth_callback: 'welcome',
      reset_password: 'auth',
      privacy: 'welcome',
      terms: 'welcome',
      profile: 'welcome',
      profile_setup: 'welcome',
      members: 'profile',
      member_profile: 'members',
      subscription: 'profile',
      admin: 'profile',
      admin_utils: 'admin',
      time: 'profile',
      dice: 'time',
      workoutDisplay: 'time',
      timer: 'workoutDisplay',
      stats_streak: 'profile',
      stats_minutes: 'profile',
      stats_workouts: 'profile',
      stats_leaderboard: 'profile',
      badges: 'profile'
    };
    const nextScreen = backMap[currentScreen] || 'welcome';
    handleScreenChange(nextScreen);
  };

  const showFooter = ['stats_leaderboard', 'badges', 'members', 'profile', 'member_profile'].includes(currentScreen);

  const screensWithoutHeader = [
    'welcome',
    'profile',
    'profile_setup',
    'members',
    'member_profile',
    'badges',
    'stats_leaderboard',
    'subscription',
    'privacy',
    'admin',
    'admin_utils',
    'time',
    'dice',
    'workoutDisplay',
    'timer',
    'auth',
    'auth_callback',
    'reset_password',
    'terms'
  ];

  if (loading || subscriptionLoading || verifyingPayment) {
    return verifyingPayment ? (
      <VerificationLoader />
    ) : (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden transition-colors duration-300">
      {!screensWithoutHeader.includes(currentScreen) && <HeaderControls />}

      <div className="max-w-6xl mx-auto px-4"> {/* Max-width container added */}
        <AnimatePresence mode="wait">
          {currentScreen === 'welcome' && (
            <PageWrapper key="welcome">
              <PageSEO
                title="Welcome"
                description="Generate personalized HIIT workouts with AI. Customize by duration, equipment, and intensity. Track your progress, earn badges, and join our fitness community."
              />
              <WelcomeMessage onStart={() => handleScreenChange('auth')} />
            </PageWrapper>
          )}

          {currentScreen === 'auth' && (
            <PageWrapper key="auth">
              <PageSEO title="Login & Signup" description="Create an account to track your HIIT workouts." />
              <AuthScreen
                onBack={() => handleScreenChange('welcome')}
                initialView={authInitialView}
                onLoginSuccess={handleAuthSuccess}
              />
            </PageWrapper>
          )}

          {currentScreen === 'auth_callback' && (
            <PageWrapper key="auth_callback">
              <AuthCallback
                onDone={(next) => setCurrentScreen(next)}
                onError={(message) => {
                  toast({ variant: 'destructive', title: 'Auth callback failed', description: message });
                  setAuthInitialView('login');
                  setCurrentScreen('auth');
                }}
              />
            </PageWrapper>
          )}

          {currentScreen === 'reset_password' && (
            <PageWrapper key="reset_password">
              <ResetPasswordScreen
                onBack={() => {
                    window.history.pushState({}, '', '/');
                    setCurrentScreen('auth');
                }}
                onSuccess={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentScreen('auth');
                }}
              />
            </PageWrapper>
          )}

          {currentScreen === 'profile' && (
            <PageWrapper key="profile">
              <PageSEO title="My Profile" description="Your stats and progress." />
              <ProfileScreen onBack={goBack} onNavigate={handleScreenChange} />
            </PageWrapper>
          )}

          {currentScreen === 'profile_setup' && (
            <PageWrapper key="profile_setup">
              <PageSEO title="Setup Profile" description="Complete your profile to get started." />
              <ProfileSetupScreen onComplete={() => handleScreenChange('profile')} />
            </PageWrapper>
          )}

          {currentScreen === 'members' && (
            <PageWrapper key="members">
              <PageSEO title="Community Members" description="Connect with other fitness enthusiasts." />
              <MembersPage onMemberClick={handleMemberSelect} />
            </PageWrapper>
          )}

          {currentScreen === 'member_profile' && (
            <PageWrapper key="member_profile">
              <PageSEO title="Member Profile" description="Member stats and activity." />
              <MemberProfileView userId={selectedMemberId} onBack={() => handleScreenChange('members')} />
            </PageWrapper>
          )}

          {currentScreen === 'stats_streak' && (
            <PageWrapper key="stats_streak">
              <PageSEO title="Streak Stats" description="Your workout consistency" />
              <StatsStreak onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'stats_minutes' && (
            <PageWrapper key="stats_minutes">
              <PageSEO title="Minutes Stats" description="Time spent working out" />
              <StatsMinutes onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'stats_workouts' && (
            <PageWrapper key="stats_workouts">
              <PageSEO title="Workout Stats" description="Total workouts completed" />
              <StatsWorkouts onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'stats_leaderboard' && (
            <PageWrapper key="stats_leaderboard">
              <PageSEO title="Leaderboard" description="Community rankings" />
              <LeaderboardPage onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'badges' && (
            <PageWrapper key="badges">
              <PageSEO title="Badges" description="Your achievements" />
              <BadgesScreen />
            </PageWrapper>
          )}

          {currentScreen === 'admin' && (
            <PageWrapper key="admin">
              <PageSEO title="Admin Dashboard" description="Manage users and system statistics." />
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard onBack={goBack} />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'admin_utils' && (
            <PageWrapper key="admin_utils">
              <PageSEO title="Admin Utilities" description="System administration tools." />
              <Suspense fallback={<LoadingFallback />}>
                <AdminUtilities onBack={goBack} />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'subscription' && (
            <PageWrapper key="subscription">
              <PageSEO title="Premium Plans" description="Unlock unlimited features." />
              <Suspense fallback={<LoadingFallback />}>
                <SubscriptionScreen
                  onBack={goBack}
                  currentSubscription={effectiveSubscription}
                  onPlanSelect={handlePlanSelection}
                  isCheckoutLoading={isCheckoutLoading}
                />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'privacy' && (
            <PageWrapper key="privacy">
              <PrivacyPolicy onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'terms' && (
            <PageWrapper key="terms">
              <Suspense fallback={<LoadingFallback />}>
                <TermsOfService onBack={goBack} />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'time' && (
            <PageWrapper key="time">
              <TimeSelection
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                onNext={() => handleScreenChange('dice')}
                onBack={goBack}
                subscription={effectiveSubscription}
                onUpgrade={() => handleScreenChange('subscription')}
              />
            </PageWrapper>
          )}

          {currentScreen === 'dice' && (
            <PageWrapper key="dice">
              <DiceScreen onRollComplete={handleDiceRollComplete} onBack={goBack} />
            </PageWrapper>
          )}

          {currentScreen === 'workoutDisplay' && (
            <PageWrapper key="workoutDisplay">
              <WorkoutSummary
                workout={generatedWorkout}
                onStartWorkout={() => {
                  playLetsGo();
                  setCurrentScreen('timer');
                }}
                onBack={goBack}
              />
            </PageWrapper>
          )}

          {currentScreen === 'timer' && (
            <PageWrapper key="timer" className="bg-background">
              <TimerScreen workout={generatedWorkout} onComplete={resetWorkout} onBack={goBack} currentTheme={theme} />
            </PageWrapper>
          )}

          {!VALID_SCREENS.includes(currentScreen) && (
            <div className="h-full min-h-screen flex flex-col items-center justify-center p-4">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Screen Not Found</h2>
              <p className="text-muted-foreground mb-4">Could not load screen: {currentScreen}</p>
              <Button onClick={() => setCurrentScreen('welcome')}>Return Home</Button>
            </div>
          )}
        </AnimatePresence>

        {showFooter && <BottomNavigation currentScreen={currentScreen} onNavigate={handleScreenChange} />}
      </div> {/* End max-w-6xl container */}

      <Toaster />
    </div>
  );
}

function App() {
  const MAINTENANCE_MODE = false;

  if (MAINTENANCE_MODE) {
    return (
      <>
        <Helmet>
          <title>Under Maintenance | Mind Core HIIT Generator</title>
          <meta name="description" content="Mindcore HIIT Generator is temporarily offline while we work on improvements." />
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Helmet>
        <MaintenancePage />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mind Core HIIT Generator</title>
        <meta
          name="description"
          content="Generate personalized HIIT workouts with AI. Customize by duration, equipment, and intensity. Track your progress, earn badges, and join our fitness community."
        />
        <meta property="og:title" content="Mind Core HIIT Generator" />
        <meta
          property="og:description"
          content="Generate personalized HIIT workouts with AI. Customize by duration, equipment, and intensity. Track your progress, earn badges, and join our fitness community."
        />
        <meta property="og:site_name" content="Mind Core HIIT Generator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mind Core HIIT Generator" />
        <meta
          name="twitter:description"
          content="Generate personalized HIIT workouts with AI. Customize by duration, equipment, and intensity. Track your progress, earn badges, and join our fitness community."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
      </Helmet>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;