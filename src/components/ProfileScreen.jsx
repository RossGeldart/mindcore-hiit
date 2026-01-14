
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Crown, Lock, Settings, HelpCircle, LogOut, Clock, Users, Mail, Play, Bell, Shield, Activity, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import ProfileEdit from '@/components/ProfileEdit';
import SettingsModal from '@/components/SettingsModal';
import NotificationsPanel from '@/components/NotificationsPanel';
import HamburgerMenu from '@/components/HamburgerMenu';
import DailyStreakCard from '@/components/DailyStreakCard';
import AchievementsCard from '@/components/AchievementsCard';
import PersonalBestCard from '@/components/PersonalBestCard';
import PostsFeed from '@/components/PostsFeed';
import { Helmet } from 'react-helmet';
import { calculateNextLevelProgress } from '@/lib/levelUtils';

const CircularProgress = ({ value, max = 100, size = 48, strokeWidth = 3, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, (value / max) * 100));
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-primary-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const ProfileScreen = ({ onBack, onNavigate }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Loading and Profile State
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  
  // Prop to trigger re-fetch in children components
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    
    if (!error) setUnreadCount(count || 0);
  }, [user]);

  const attemptAutoCreateProfile = async () => {
      console.log("Profile not found. Attempting to auto-create...");
      try {
          // Double check if it exists first to avoid conflict errors
          const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
          if (existing) return true;

          const { error: insertError } = await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'New Member',
              avatar_url: user.user_metadata?.avatar_url || null,
              role: 'user'
          });

          if (insertError) throw insertError;
          
          toast({ title: "Profile Initialized", description: "Your profile has been set up automatically." });
          return true; 
      } catch (err) {
          console.error("Auto-create failed:", err);
          return false;
      }
  };

  const fetchStatsAndSub = useCallback(async () => {
    if (!user) return;
    
    // Only set loading on initial load, not background refreshes
    if (statsRefreshKey === 0) {
        setIsProfileLoading(true);
    }
    setProfileError(null);

    try {
        // 1. Fetch Profile Data
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        // 1a. Handle Missing Profile (404 or just empty result)
        if (!profile || profileError) {
             
             // Try auto-create if we haven't already failed at it once
             if (!autoCreateAttempted) {
                 setAutoCreateAttempted(true);
                 const created = await attemptAutoCreateProfile();
                 
                 if (created) {
                     // Retry fetch immediately
                     const retry = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
                     profile = retry.data;
                     if (!profile) throw new Error("Created profile but could not fetch it.");
                 } else {
                     if (onNavigate) {
                         onNavigate('profile_setup');
                         return; // Stop loading here
                     }
                     throw new Error("Profile missing and auto-creation failed.");
                 }
             } else {
                 throw new Error("Profile could not be retrieved.");
             }
        }

        const isUserAdmin = profile?.role === 'admin' || user.email === 'ross@mindcorefitness.com';
        setIsAdmin(isUserAdmin);

        // 2. Fetch Stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('total_minutes, total_workouts')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (statsData) {
          setMinutes(statsData.total_minutes || 0);
          setTotalWorkouts(statsData.total_workouts || 0);
        }

        // 3. Fetch Subscription
        if (isUserAdmin) {
          setSubscription({ status: 'active', plan_type: 'lifetime' });
        } else {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (subData) {
            setSubscription(subData);
          }
        }

        setIsProfileLoading(false); // Success!

    } catch (err) {
        console.error("Error loading profile data:", err);
        setProfileError(err.message);
        setIsProfileLoading(false);
    }
  }, [user, onNavigate, autoCreateAttempted, statsRefreshKey]);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();
    fetchStatsAndSub();

    // Timeout safety for infinite loading
    const timeoutId = setTimeout(() => {
        setIsProfileLoading((loading) => {
            if (loading) {
                setProfileError("Connection timed out. Please check your internet.");
                return false; 
            }
            return loading;
        });
    }, 5000); 

    // Realtime subscription for Notifications
    const notificationChannel = supabase
        .channel('profile_notifications_badge')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            },
            () => {
                fetchUnreadCount();
            }
        )
        .subscribe();
        
    // Realtime subscription for User Stats
    const statsChannel = supabase
        .channel('profile_stats_updates')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'user_stats',
                filter: `user_id=eq.${user.id}`,
            },
            () => {
                console.log("Stats updated realtime - refreshing UI");
                setStatsRefreshKey(prev => prev + 1);
                fetchStatsAndSub();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(notificationChannel);
        supabase.removeChannel(statsChannel);
        clearTimeout(timeoutId);
    };

  }, [user, fetchStatsAndSub, fetchUnreadCount]);

  const levelInfo = useMemo(() => calculateNextLevelProgress(minutes), [minutes]);
  const isPremium = subscription && (['active', 'trialing', 'lifetime'].includes(subscription.status));
  const isLifetimeMember = subscription?.plan_type === 'lifetime';

  // --- UPDATED LOGOUT HANDLER ---
  const handleLogout = () => {
    console.log("PROFILE: Logout button clicked");
    signOut(); // Fire and forget
    
    // Manually navigate immediately to prevent "frozen" feeling
    if (onNavigate) {
        onNavigate('welcome');
    } else if (onBack) {
        onBack();
    }
  };

  const handleCoreBuddy = () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Core Buddy is exclusively available for premium members. Upgrade to unlock!",
        variant: "destructive"
      });
      if (onNavigate) onNavigate('subscription');
      return;
    }
    toast({
      title: "Coming Soon: Social Challenges",
      description: "🚧 Invite friends, create squads, and crush challenges together! This premium social feature is coming soon. 🚀",
    });
  };

  const handleHelpAndSupport = () => {
    toast({
      title: "Need Help?",
      description: "For support, please email us at: ross@mindcorehiitgenerator.com",
      icon: <Mail className="h-5 w-5" />,
      duration: 5000,
    });
  };

  const menuItems = [
    { id: 'profile-edit', label: 'Edit Profile', icon: User, action: () => setShowEditProfile(true) },
    { id: 'membership', label: 'Membership', icon: Crown, action: () => onNavigate && onNavigate('subscription') },
    { id: 'core-buddy', label: 'Core Buddy', icon: Users, action: handleCoreBuddy, isPremiumOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setShowSettings(true) },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, action: handleHelpAndSupport },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock, action: () => onNavigate && onNavigate('privacy') },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Dashboard', icon: Shield, action: () => onNavigate && onNavigate('admin') });
  }

  // Loading State
  if (isProfileLoading) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading your profile stats...</p>
          </div>
      );
  }

  // Error State
  if (profileError) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="bg-destructive/10 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">Unable to Load Profile</h2>
              <p className="text-muted-foreground max-w-sm">{profileError}</p>
              <div className="flex gap-3 mt-4 flex-col w-full max-w-xs">
                  <Button onClick={() => window.location.reload()} className="gap-2 w-full">
                      <RefreshCw className="w-4 h-4" /> Retry
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
      <Helmet>
        <title>My Profile | Mind Core HIIT</title>
        <meta name="description" content="Manage your Mind Core HIIT profile, view stats, and access settings." />
      </Helmet>

      <div className="bg-muted pt-4 pb-12 px-4 rounded-b-[2.5rem] relative z-10 shadow-sm border-b border-border/50 flex-shrink-0">
        <div className="flex justify-between items-center mb-2 text-foreground relative">
          {/* Empty div to balance spacing after removing refresh button */}
          <div className="w-8 h-8 flex items-center justify-center"></div> 
          
          {/* Centered Hamburger Menu */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
             <HamburgerMenu items={menuItems} isPremium={isPremium} onLogout={handleLogout} />
          </div>

          <div className="relative">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(true)}
                className="h-8 w-8 hover:bg-foreground/10 text-foreground rounded-full -mr-2"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center transition-all duration-300 z-10"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center text-center text-foreground space-y-2">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <div className="w-20 h-20 rounded-full border-[3px] border-background shadow-lg overflow-hidden bg-muted flex items-center justify-center relative">
               {user?.user_metadata?.avatar_url ? (
                 <img alt="Profile" className="w-full h-full object-cover" src={user?.user_metadata?.avatar_url} />
               ) : (
                 <User className="w-10 h-10 text-muted-foreground" />
               )}
            </div>
          </motion.div>
          
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                {user?.user_metadata?.full_name || "Madison Smith"}
              </h1>
              {isLifetimeMember && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full shadow-md">
                  <Crown className="w-3 h-3 fill-yellow-500" />
                  VIP
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs font-medium">
              {user?.email || "madisons@example.com"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-20 flex-shrink-0">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-primary rounded-xl p-3 flex justify-around items-center text-primary-foreground relative overflow-hidden shadow-lg"
        >
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-lg pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-black/10 rounded-full blur-lg pointer-events-none" />

          <div className="flex flex-col items-center justify-center gap-1">
            <CircularProgress value={levelInfo.progressPercent} size={56} strokeWidth={4}>
              <div className="text-center">
                 <span className="text-lg font-black leading-none block">{levelInfo.level}</span>
                 <span className="text-[8px] font-bold uppercase opacity-80 block">Lvl</span>
              </div>
            </CircularProgress>
            <div className="text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 block">Level Up</span>
            </div>
          </div>

          <div className="w-px h-8 bg-primary-foreground/20 rounded-full" />

          <div className="flex flex-col items-center justify-center gap-1">
            <CircularProgress value={100} size={56} strokeWidth={4}>
               <div className="flex flex-col items-center">
                 <Activity className="w-3 h-3 mb-0.5 opacity-80" />
                 <span className="text-sm font-black leading-none">{totalWorkouts}</span>
               </div>
            </CircularProgress>
            <div className="text-center">
               <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 block">Workouts</span>
            </div>
          </div>

          <div className="w-px h-8 bg-primary-foreground/20 rounded-full" />

          <div className="flex flex-col items-center justify-center gap-1">
            <CircularProgress value={100} size={56} strokeWidth={4}>
               <div className="flex flex-col items-center">
                 <Clock className="w-3 h-3 mb-0.5 opacity-80" />
                 <span className="text-sm font-black leading-none">{minutes < 1000 ? minutes : (minutes/60).toFixed(0) + 'h'}</span>
               </div>
            </CircularProgress>
            <div className="text-center">
               <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 block">Total Mins</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-3 relative z-20 flex-shrink-0">
        <Button 
            onClick={() => onNavigate && onNavigate('time')}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
            START WORKOUT <Play className="w-4 h-4 fill-current" />
        </Button>
      </div>
      
      {/* Daily Streak Card Section - Passes Refresh Key */}
      <div className="px-5 mt-3 relative z-20 flex-shrink-0">
         <DailyStreakCard lastUpdated={statsRefreshKey} />
      </div>

      {/* Achievements Card Section - Passes Refresh Key */}
      <div className="px-5 mt-3 relative z-20 flex-shrink-0">
          <AchievementsCard lastUpdated={statsRefreshKey} />
      </div>
      
      {/* Personal Best Card Section - Passes Refresh Key */}
      <div className="px-5 mt-3 relative z-20 flex-shrink-0">
          <PersonalBestCard lastUpdated={statsRefreshKey} />
      </div>

      {/* Feed Section */}
      <div className="px-5 mt-6 mb-4 relative z-20">
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                 My Fitness Journey
                 <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">Beta</span>
             </h3>
         </div>
         
         <AnimatePresence>
             {showFeed && (
                 <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                 >
                     <PostsFeed userId={user?.id} />
                 </motion.div>
             )}
         </AnimatePresence>
      </div>
      
      <div className="mb-24"></div>

      <AnimatePresence>
        {showEditProfile && (
          <ProfileEdit 
            onClose={() => setShowEditProfile(false)} 
            onProfileUpdated={() => {
              fetchStatsAndSub();
              setShowEditProfile(false);
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        userId={user?.id}
        onUpdate={fetchUnreadCount}
      />
    </div>
  );
};

export default ProfileScreen;
