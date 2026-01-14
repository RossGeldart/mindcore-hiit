import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Star, Loader2, Trophy, Medal } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { calculateLevel, BADGE_LEVELS, LEVEL_THRESHOLDS } from '@/lib/levelUtils';
import Confetti from '@/components/Confetti';

const BadgeItem = ({ badge, currentLevel, index }) => {
  const isUnlocked = currentLevel >= badge.level;
  
  // Calculate distinct visual styles based on badge tier
  let badgeColor = "text-primary";
  let badgeFill = "fill-primary/10";
  
  if (badge.level >= 20) {
    badgeColor = "text-yellow-500";
    badgeFill = "fill-yellow-500/20";
  } else if (badge.level >= 15) {
    badgeColor = "text-purple-500";
    badgeFill = "fill-purple-500/20";
  } else if (badge.level >= 10) {
    badgeColor = "text-red-500";
    badgeFill = "fill-red-500/20";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
      className={`relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 group overflow-hidden ${
        isUnlocked 
          ? 'bg-card border-border shadow-lg hover:shadow-xl hover:-translate-y-1' 
          : 'bg-muted/40 border-dashed border-muted-foreground/20 grayscale opacity-70'
      }`}
    >
      {/* Background Glow for unlocked */}
      {isUnlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br from-${badgeColor.replace('text-', '')}/5 to-transparent pointer-events-none`} />
      )}

      {/* Badge Icon Container */}
      <div className="relative mb-4">
        {badge.level >= 15 ? (
             <Medal 
                className={`w-24 h-24 drop-shadow-md transition-colors duration-300 ${
                    isUnlocked ? `${badgeColor} ${badgeFill} stroke-[1.5]` : 'text-muted-foreground/30 fill-muted/30 stroke-[1]'
                }`} 
            />
        ) : (
            <Shield 
                className={`w-24 h-24 drop-shadow-md transition-colors duration-300 ${
                    isUnlocked ? `${badgeColor} ${badgeFill} stroke-[1.5]` : 'text-muted-foreground/30 fill-muted/30 stroke-[1]'
                }`} 
            />
        )}
        
        
        {/* Level Number or Lock Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isUnlocked ? (
             <div className="flex flex-col items-center justify-center leading-none mt-1">
                <span className={`text-[10px] font-bold uppercase mb-1 opacity-70 ${badgeColor}`}>
                  Level
                </span>
                <span className={`text-3xl font-black tracking-tighter ${badgeColor}`}>
                  {badge.level}
                </span>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground/50 mb-1" />
             </div>
          )}
        </div>

        {/* Shine effect for high tiers */}
        {isUnlocked && badge.level >= 10 && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 1, 0] }}
             transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
             className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent skew-x-12"
           />
        )}
      </div>

      {/* Text Content */}
      <div className="text-center z-10 w-full space-y-1">
        <h3 className={`font-black text-sm uppercase tracking-wide ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
          {badge.name}
        </h3>
        <p className="text-[11px] text-muted-foreground font-medium">
          {isUnlocked ? badge.description : `Unlocks at Level ${badge.level}`}
        </p>
      </div>
    </motion.div>
  );
};

const BadgesScreen = () => {
  const { user } = useAuth();
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('total_minutes')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setMinutes(data.total_minutes || 0);
        }
      } catch (err) {
        console.error('Error fetching stats for badges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const currentLevel = calculateLevel(minutes);
  
  // Find the next locked badge
  const nextBadge = BADGE_LEVELS.find(b => b.level > currentLevel);

  useEffect(() => {
    if (!loading && currentLevel >= 1) {
      const hasSeenConfetti = sessionStorage.getItem(`mc_badges_level_${currentLevel}`);
      if (!hasSeenConfetti) {
        setShowConfetti(true);
        sessionStorage.setItem(`mc_badges_level_${currentLevel}`, 'true');
      }
    }
  }, [loading, currentLevel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4 relative">
      {showConfetti && <Confetti count={150} duration={3000} />}
      
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-2 ring-4 ring-background shadow-xl border border-primary/20"
            >
                <Trophy className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Hall of Legends</h1>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Your journey from Rookie to Legend. You are currently <span className="text-primary font-bold">Level {currentLevel}</span> with <span className="font-mono font-medium text-foreground">{minutes}</span> minutes.
            </p>
            
            {nextBadge ? (
               <div className="mt-6 px-5 py-2.5 bg-secondary/50 rounded-full text-sm font-medium text-muted-foreground border border-border">
                  Next Objective: <span className="font-bold text-foreground">{nextBadge.name}</span> (Level {nextBadge.level})
               </div>
            ) : (
                <div className="mt-6 px-5 py-2.5 bg-yellow-500/10 rounded-full text-sm font-bold text-yellow-600 border border-yellow-500/20 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" /> Legend Status Achieved
               </div>
            )}
        </div>

        {/* Badges Grid - 2x3 Layout on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
          {BADGE_LEVELS.map((badge, index) => (
            <BadgeItem 
              key={badge.id} 
              badge={badge} 
              currentLevel={currentLevel} 
              index={index} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgesScreen;