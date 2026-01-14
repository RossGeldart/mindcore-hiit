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

// Maintenance Page
import MaintenancePage from '@/components/MaintenancePage';

// Core screens
import WelcomeMessage from '@/components/WelcomeMessage';
import TimeSelection from '@/components/TimeSelection';
import DiceScreen from '@/components/DiceScreen';
import WorkoutSummary from '@/components/WorkoutSummary';
import TimerScreen from '@/components/TimerScreen';
import ProfileScreen from '@/components/ProfileScreen';
import BottomNavigation from '@/components/BottomNavigation';
import BadgesScreen from '@/components/BadgesScreen';
import MembersPage from '@/components/MembersPage';
import MemberProfileView from '@/components/MemberProfileView';
import PrivacyPolicy from '@/components/PrivacyPolicy';

// Auth screens
import AuthScreen from '@/components/AuthScreen';
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
const TermsOfService = React.lazy(() => import('@/components/TermsOfService'));
const SubscriptionScreen = React.lazy(() => import('@/components/SubscriptionScreen'));

const STRIPE_PLANS = {
  monthly: 'prod_TYtLbjvv6GscYH',
  annual: 'prod_TYtMWgdV4gkDpG',
  lifetime: 'prod_TYtNL771NlMIrz'
};

// All valid screens
const VALID_SCREENS = [
  'welcome', 'auth', 'auth_callback', 'reset_password',
  'profile', 'members', 'member_profile',
  'stats_streak', 'stats_minutes', 'stats_workouts', 'stats_leaderboard',
  'badges', 'admin', 'admin_utils', 'subscription',
  'privacy', 'terms', 'time', 'dice', 'workoutDisplay', 'timer'
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
        className="rounded-full border-primary/20 hover:bg-primary/10 bg-background/80 backdrop-blur-sm"
      >
        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleMute}
        className={`rounded-full border-primary/20 hover:bg-primary/80 ${
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

function AppContent() {
  // Determine initial screen from URL
  const [currentScreen, setCurrentScreen] = useState(() => {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const params = new URLSearchParams(url.search);
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    
    // Check for auth callback (code or tokens in URL)
    const hasCode = params.has('code');
    const hasAccessToken = hashParams.has('access_token');
    const type = params.get('type') || hashParams.get('type');
    
    // Auth callback with recovery type -> reset password
    if ((hasCode || hasAccessToken) && type === 'recovery') {
      return 'auth_callback';
    }
    
    // Auth callback route
    if (path === '/auth/callback' || hasCode || hasAccessToken) {
      return 'auth_callback';
    }
    
    // Static routes
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    
    // Screen param
    const screenParam = params.get('screen');
    if (screenParam && VALID_SCREENS.includes(screenParam)) return screenParam;
    
    // Saved screen from localStorage
    const saved = localStorage.getItem('mc_screen');
    if (saved && VALID_SCREENS.includes(saved)) return saved;
    
    return 'welcome';
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    try {
      const item = localStorage.getItem('mc_time');
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  });

  const [generatedWorkout, setGeneratedWorkout] = useState(() => {
    try {
      const item = localStorage.getItem('mc_workout');
      return item ? JSON.parse(item) : null;
    } catch { return null; }
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

  // Persist screen to localStorage
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

  // Auth protection
  useEffect(() => {
    if (loading) return;
    
    const publicScreens = ['welcome', 'auth', 'privacy', 'terms', 'auth_callback', 'reset_password'];
    
    // Redirect logged-out users from protected screens
    if (!user && !publicScreens.includes(currentScreen)) {
      setCurrentScreen('welcome');
      return;
    }
    
    // Redirect logged-in users from auth screens to profile
    if (user && (currentScreen === 'welcome' || currentScreen === 'auth')) {
      setCurrentScreen('profile');
      return;
    }
    
    // Redirect from workout screens if no workout
    if (['timer', 'workoutDisplay'].includes(currentScreen) && !generatedWorkout) {
      setCurrentScreen(user ? 'profile' : 'welcome');
    }
  }, [user, loading, currentScreen, generatedWorkout]);

  // Subscription handling
  const fetchSubscription = useCallback(async (withLoading = true) => {
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

        setSubscription(subError ? null : subData);
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user]);

  const syncSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    const currentSub = subscriptionRef.current;
    if (currentSub?.plan_type === 'lifetime') return;

    try {
      await supabase.functions.invoke('check-subscription');
      fetchSubscription(false);
    } catch { /* ignore */ }
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

  // Checkout
  const initiateCheckout = async (planType) => {
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'Please log in first' });
      setCurrentScreen('auth');
      return;
    }

    const productId = STRIPE_PLANS[planType];
    if (!productId) {
      toast({ variant: 'destructive', title: 'Plan not found' });
      return;
    }

    try {
      setIsCheckoutLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: productId, userId: user.id, origin: window.location.origin }
      });

      if (error) throw new Error(error.message);
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL returned');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Checkout Failed', description: err.message });
      setIsCheckoutLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    initializeWorkoutDatabase();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      setVerificationSessionId(sessionId);
      setVerifyingPayment(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => window.scrollTo(0, 0), [currentScreen]);

  // Payment verification
  useEffect(() => {
    if (verifyingPayment && verificationSessionId && !loading) {
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId: verificationSessionId, userId: user?.id }
          });
          if (error) throw error;
          if (data?.success) {
            await fetchSubscription(true);
            toast({ title: 'Success!', description: 'Your subscription is active.' });
            setCurrentScreen(user ? 'profile' : 'auth');
          } else {
            throw new Error('Verification failed');
          }
        } catch {
          toast({ variant: 'destructive', title: 'Verification Failed' });
          setCurrentScreen('profile');
        } finally {
          setVerifyingPayment(false);
          setVerificationSessionId(null);
        }
      };
      verifyPayment();
    }
  }, [verifyingPayment, verificationSessionId, user, loading, fetchSubscription, toast]);

  // Navigation handlers
  const handleScreenChange = (screen) => {
    if (VALID_SCREENS.includes(screen)) {
      playClick();
      // Clean up URL if needed
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
      setCurrentScreen(screen);
    }
  };

  const handleAuthSuccess = () => setCurrentScreen('profile');

  const resetWorkout = () => {
    playClick();
    setCurrentScreen(user ? 'profile' : 'welcome');
    setSelectedTime(null);
    setGeneratedWorkout(null);
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
    handleScreenChange(backMap[currentScreen] || 'welcome');
  };

  const showFooter = ['stats_leaderboard', 'badges', 'members', 'profile', 'member_profile'].includes(currentScreen);
  const screensWithoutHeader = [
    'welcome', 'profile', 'members', 'member_profile', 'badges', 'stats_leaderboard',
    'subscription', 'privacy', 'admin', 'admin_utils', 'time', 'dice', 'workoutDisplay',
    'timer', 'auth', 'auth_callback', 'reset_password', 'terms'
  ];

  // Loading state
  if (loading || subscriptionLoading || verifyingPayment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden transition-colors duration-300">
      {!screensWithoutHeader.includes(currentScreen) && <HeaderControls />}

      <div className="max-w-6xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {currentScreen === 'welcome' && (
            <PageWrapper key="welcome">
              <PageSEO title="Welcome" description="Generate personalized HIIT workouts" />
              <WelcomeMessage onStart={() => handleScreenChange('auth')} />
            </PageWrapper>
          )}

          {currentScreen === 'auth' && (
            <PageWrapper key="auth">
              <PageSEO title="Login & Signup" description="Create an account" />
              <AuthScreen
                onBack={() => handleScreenChange('welcome')}
                onSuccess={handleAuthSuccess}
                initialView={authInitialView}
              />
            </PageWrapper>
          )}

          {currentScreen === 'auth_callback' && (
            <PageWrapper key="auth_callback">
              <AuthCallback
                onComplete={(screen) => setCurrentScreen(screen)}
                onError={(msg) => {
                  toast({ variant: 'destructive', title: 'Authentication failed', description: msg });
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
              <PageSEO title="My Profile" description="Your stats and progress" />
              <ProfileScreen onBack={goBack} onNavigate={handleScreenChange} />
            </PageWrapper>
          )}

          {currentScreen === 'members' && (
            <PageWrapper key="members">
              <PageSEO title="Community Members" description="Connect with others" />
              <MembersPage onMemberClick={handleMemberSelect} />
            </PageWrapper>
          )}

          {currentScreen === 'member_profile' && (
            <PageWrapper key="member_profile">
              <PageSEO title="Member Profile" description="Member stats" />
              <MemberProfileView userId={selectedMemberId} onBack={() => handleScreenChange('members')} />
            </PageWrapper>
          )}

          {currentScreen === 'stats_streak' && (
            <PageWrapper key="stats_streak">
              <PageSEO title="Streak Stats" description="Your consistency" />
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
              <PageSEO title="Workout Stats" description="Total workouts" />
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
              <PageSEO title="Admin Dashboard" description="Manage users" />
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard onBack={goBack} />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'admin_utils' && (
            <PageWrapper key="admin_utils">
              <PageSEO title="Admin Utilities" description="System tools" />
              <Suspense fallback={<LoadingFallback />}>
                <AdminUtilities onBack={goBack} />
              </Suspense>
            </PageWrapper>
          )}

          {currentScreen === 'subscription' && (
            <PageWrapper key="subscription">
              <PageSEO title="Premium Plans" description="Unlock features" />
              <Suspense fallback={<LoadingFallback />}>
                <SubscriptionScreen
                  onBack={goBack}
                  currentSubscription={effectiveSubscription}
                  onPlanSelect={initiateCheckout}
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
              <Button onClick={() => setCurrentScreen('welcome')}>Return Home</Button>
            </div>
          )}
        </AnimatePresence>

        {showFooter && <BottomNavigation currentScreen={currentScreen} onNavigate={handleScreenChange} />}
      </div>

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
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <MaintenancePage />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mind Core HIIT Generator</title>
        <meta name="description" content="Generate personalized HIIT workouts with AI." />
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
