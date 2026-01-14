
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Timer, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const PersonalBestCard = ({ lastUpdated }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    longestStreak: 0,
    longestWorkout: 0,
    bestWeek: { count: 0, range: 'No data' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // 1. Fetch User Stats for Current Streak
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();

        // 2. Fetch Logs for Longest Workout & Consistent Week
        const { data: logsData, error: logsError } = await supabase
          .from('workout_logs')
          .select('duration_minutes, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true });

        if (statsError && statsError.code !== 'PGRST116') throw statsError; // PGRST116 means no row found, which is fine for new users
        if (logsError) throw logsError;

        // --- Process Longest Workout ---
        let maxDuration = 0;
        if (logsData && logsData.length > 0) {
            maxDuration = Math.max(...logsData.map(l => l.duration_minutes));
        }

        // --- Process Most Consistent Week ---
        let bestWeekCount = 0;
        let bestWeekRange = 'No data';
        
        if (logsData && logsData.length > 0) {
            const weeks = {};
            logsData.forEach(log => {
                const date = new Date(log.completed_at);
                // Get Monday of the week (ISO week date, where Monday is 1, Sunday is 7)
                // In JS getDay() is 0=Sun, 1=Mon...6=Sat
                let dayOfWeek = date.getDay();
                // Adjust to be 0=Mon, 1=Tue ... 6=Sun
                dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 

                const diff = date.getDate() - dayOfWeek; // Day of month minus adjusted day of week
                const monday = new Date(date);
                monday.setDate(diff);
                monday.setHours(0,0,0,0); // Normalize to start of Monday

                const key = monday.toISOString().split('T')[0]; // Use YYYY-MM-DD for consistency
                weeks[key] = (weeks[key] || 0) + 1;
            });

            // Find max
            let maxW = 0;
            let maxKey = null;
            Object.entries(weeks).forEach(([key, count]) => {
                if (count > maxW) {
                    maxW = count;
                    maxKey = key;
                }
            });

            if (maxKey) {
                bestWeekCount = maxW;
                const start = new Date(maxKey);
                const end = new Date(start);
                end.setDate(end.getDate() + 6); // End of week (Sunday)
                
                // Format: "Jan 1 - Jan 7"
                const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                bestWeekRange = `${fmt(start)} - ${fmt(end)}`;
            }
        }
        
        // --- Calculate REAL longest streak from logs ---
        // We compare the historical max with the current streak to display the true "Best"
        let historicalMaxStreak = 0;
        if (logsData && logsData.length > 0) {
            // Get unique dates normalized to strings to avoid time issues
            const datesRaw = logsData.map(l => new Date(l.completed_at).toISOString().split('T')[0]);
            const uniqueDates = [...new Set(datesRaw)].sort();
            
            if (uniqueDates.length > 0) {
                let currentSeq = 1;
                let maxSeq = 1;
                
                // Convert back to Date objects for arithmetic
                const dateObjs = uniqueDates.map(d => new Date(d));

                for (let i = 1; i < dateObjs.length; i++) {
                    const prev = dateObjs[i-1];
                    const curr = dateObjs[i];
                    // Diff in days
                    const diffTime = Math.abs(curr.getTime() - prev.getTime()); // Use getTime() for proper diff
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Round for whole days
                    
                    if (diffDays === 1) {
                        currentSeq++;
                    } else {
                        currentSeq = 1;
                    }
                    maxSeq = Math.max(maxSeq, currentSeq);
                }
                historicalMaxStreak = maxSeq;
            }
        }

        const currentStreak = statsData?.current_streak || 0;

        setMetrics({
            longestStreak: Math.max(currentStreak, historicalMaxStreak), // Display the highest between current and historical
            longestWorkout: maxDuration,
            bestWeek: { count: bestWeekCount, range: bestWeekRange }
        });

      } catch (err) {
        console.error("Error fetching PB:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, lastUpdated]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-lg border border-border/50 p-4 w-full animate-pulse h-32 mt-3"></div>
    );
  }

  // Helper component for metric items
  const MetricItem = ({ icon: Icon, label, value, subtext }) => (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-card/50 border border-border/50 w-full"
    >
        <div className="p-1.5 rounded-full bg-primary/10 flex-shrink-0">
            <Icon className="w-4 h-4 text-primary stroke-[1.5]" />
        </div>
        <div className="flex flex-col flex-grow">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className="text-lg font-extrabold tracking-tight text-foreground leading-tight">{value}</span>
            {subtext && <span className="text-xs text-muted-foreground/70 leading-none mt-0.5">{subtext}</span>}
        </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 p-4 w-full"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Award className="w-4 h-4 text-primary stroke-[1.5]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Bests</h3>
      </div>
      
      <div className="flex flex-col gap-2">
         <MetricItem 
            icon={Zap}
            label="Longest Streak"
            value={`${metrics.longestStreak} Days`}
         />
         <MetricItem 
            icon={Timer}
            label="Longest Workout"
            value={`${metrics.longestWorkout} Minutes`}
         />
         <MetricItem 
            icon={CalendarDays}
            label="Most Consistent Week"
            value={`${metrics.bestWeek.count} Workouts`}
            subtext={metrics.bestWeek.range}
         />
      </div>
    </motion.div>
  );
};

export default PersonalBestCard;
