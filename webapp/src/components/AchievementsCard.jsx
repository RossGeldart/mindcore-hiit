
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Medal, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateLevel, BADGE_LEVELS } from '@/lib/levelUtils';
import { cn } from '@/lib/utils';

const AchievementsCard = ({ lastUpdated }) => {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('total_minutes')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          const minutes = data.total_minutes || 0;
          const currentLevel = calculateLevel(minutes);
          // Filter badges that are unlocked (badge level <= user level)
          const unlocked = BADGE_LEVELS.filter(b => b.level <= currentLevel);
          // Sort descending by level to show highest achievements first? 
          // Or ascending to show progression. Let's stick to defined order (ascending).
          setEarnedBadges(unlocked);
        }
      } catch (err) {
        console.error('Error fetching badges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user, lastUpdated]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 w-full animate-pulse h-32"></div>
    );
  }

  if (earnedBadges.length === 0) {
     return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 p-6 w-full flex flex-col items-center text-center gap-2"
        >
             <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Trophy className="w-6 h-6 text-muted-foreground" />
             </div>
             <div>
                <h3 className="text-sm font-bold">No Achievements Yet</h3>
                <p className="text-xs text-muted-foreground mt-1">Complete workouts to level up and earn your first badge!</p>
             </div>
        </motion.div>
     );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 p-4 w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Achievements</h3>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
           {earnedBadges.length} Unlocked
        </span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-4 gap-x-2">
        {earnedBadges.map((badge) => {
           let badgeColor = "text-primary";
           let badgeBg = "bg-primary/10";
           
           if (badge.level >= 20) {
             badgeColor = "text-yellow-500";
             badgeBg = "bg-yellow-500/10";
           } else if (badge.level >= 15) {
             badgeColor = "text-purple-500";
             badgeBg = "bg-purple-500/10";
           } else if (badge.level >= 10) {
             badgeColor = "text-red-500";
             badgeBg = "bg-red-500/10";
           }

           const Icon = badge.level >= 15 ? Medal : Shield;

           return (
             <motion.div 
               key={badge.id}
               className="flex flex-col items-center gap-1.5 text-center"
               whileHover={{ scale: 1.05 }}
             >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center relative transition-colors duration-300", badgeBg)}>
                    <Icon className={cn("w-6 h-6 stroke-[1.5]", badgeColor)} />
                    <div className="absolute -bottom-1.5 bg-card border border-border text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                        LVL {badge.level}
                    </div>
                </div>
                <span className="text-[10px] font-bold leading-tight w-full px-1 mt-1 truncate">
                    {badge.name}
                </span>
             </motion.div>
           );
        })}
      </div>
    </motion.div>
  );
};

export default AchievementsCard;
