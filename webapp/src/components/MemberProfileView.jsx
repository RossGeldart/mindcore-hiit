
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Clock, Activity, ArrowLeft, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { calculateNextLevelProgress } from '@/lib/levelUtils';
import PostsFeed from '@/components/PostsFeed';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Reusing CircularProgress for consistency
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

const MemberProfileView = ({ userId, onBack }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total_minutes: 0, total_workouts: 0 });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch Subscription
            const { data: subscriptionData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            
            setSubscription(subscriptionData);

            // Fetch Stats
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('total_minutes, total_workouts')
                .eq('user_id', userId)
                .maybeSingle();

            if (!statsError && statsData) {
                setStats(statsData);
            }

        } catch (err) {
            console.error("Error fetching member profile:", err);
            setError("Could not load profile.");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [userId]);

  const levelInfo = useMemo(() => calculateNextLevelProgress(stats.total_minutes || 0), [stats.total_minutes]);

  const isVip = useMemo(() => {
      if (profile?.role === 'admin') return true;
      return subscription?.status === 'active' || subscription?.plan_type === 'lifetime' || subscription?.plan_type === 'paid';
  }, [subscription, profile]);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading profile...</p>
          </div>
      );
  }

  if (error || !profile) {
      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <p className="text-destructive mb-4">{error || "User not found."}</p>
            <Button onClick={onBack} variant="outline">Go Back</Button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-muted pt-4 pb-12 px-4 rounded-b-[2.5rem] relative z-10 shadow-sm border-b border-border/50">
            <div className="absolute top-4 left-4 z-50">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-background/50 hover:bg-background">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>
            
            <div className="flex flex-col items-center text-center text-foreground space-y-4 mt-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
                    <div className="w-24 h-24 rounded-full border-[4px] border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                    {profile.avatar_url ? (
                        <img alt={profile.full_name} className="w-full h-full object-cover" src={profile.avatar_url} />
                    ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                    )}
                    </div>
                </motion.div>
                
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
                        {profile.full_name || "Unknown Member"}
                    </h1>
                    
                    {/* Subscription Status Badge */}
                    {isVip ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-wide">VIP</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted/50 border border-border">
                            <span className="text-xs font-medium text-muted-foreground">Basic</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Stats Card */}
        <div className="px-5 -mt-10 relative z-20">
            <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-primary rounded-xl p-4 flex justify-around items-center text-primary-foreground relative overflow-hidden shadow-lg"
            >
            <div className="flex flex-col items-center justify-center gap-1">
                <CircularProgress value={levelInfo.progressPercent} size={60} strokeWidth={4}>
                <div className="text-center">
                    <span className="text-xl font-black leading-none block">{levelInfo.level}</span>
                    <span className="text-[9px] font-bold uppercase opacity-80 block">Lvl</span>
                </div>
                </CircularProgress>
            </div>

            <div className="w-px h-10 bg-primary-foreground/20 rounded-full" />

            <div className="flex flex-col items-center justify-center gap-1">
                <Activity className="w-6 h-6 opacity-90 mb-1" />
                <span className="text-lg font-black leading-none">{stats.total_workouts || 0}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Workouts</span>
            </div>

            <div className="w-px h-10 bg-primary-foreground/20 rounded-full" />

            <div className="flex flex-col items-center justify-center gap-1">
                <Clock className="w-6 h-6 opacity-90 mb-1" />
                <span className="text-lg font-black leading-none">
                    {(stats.total_minutes || 0) < 1000 ? (stats.total_minutes || 0) : ((stats.total_minutes || 0)/60).toFixed(0) + 'h'}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Minutes</span>
            </div>
            </motion.div>
        </div>

        {/* Recent Activity / Posts */}
        <div className="px-5 mt-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Recent Activity
            </h3>
            
            <div className="space-y-4">
                <PostsFeed userId={userId} />
            </div>
        </div>
    </div>
  );
};

export default MemberProfileView;
