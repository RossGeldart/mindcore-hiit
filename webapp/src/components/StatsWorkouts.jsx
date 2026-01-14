
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CalendarDays, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StatsWorkouts = ({ onBack }) => {
  const { user } = useAuth();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [dayStats, setDayStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Realtime subscription for user stats updates
    // Since total workouts comes from user_stats (for consistency with header) or workout_logs count
    // The previous implementation counted logs manually. We will re-fetch logs on stats update.
    const channel = supabase
      .channel('stats_workouts_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTotalWorkouts(data.length);

      const daysCount = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
      };

      data.forEach(log => {
          if (log.completed_at) {
            const date = new Date(log.completed_at);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            if (daysCount[dayName] !== undefined) {
              daysCount[dayName]++;
            }
          }
      });

      const sortedDays = Object.entries(daysCount)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count)
        .filter(d => d.count > 0); 

      setDayStats(sortedDays);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const mostPopularDay = dayStats.length > 0 ? dayStats[0].day : null;

  return (
    <div className="min-h-screen bg-background p-5 pt-16 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Total Workouts</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 p-6 rounded-3xl text-center space-y-1"
        >
            <div className="text-4xl font-black text-green-500">{totalWorkouts}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sessions Completed</div>
        </motion.div>

        {/* Popular Days Breakdown */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-card border border-border rounded-3xl p-5"
        >
             <div className="flex items-center gap-2 mb-4">
                 <CalendarDays className="w-4 h-4 text-primary" />
                 <h3 className="font-bold text-base">Popular Training Days</h3>
             </div>
             
             <div className="space-y-3">
                 {dayStats.length > 0 ? dayStats.map((stat, i) => {
                     const percentage = totalWorkouts > 0 ? (stat.count / totalWorkouts) * 100 : 0;
                     
                     return (
                       <div key={stat.day} className="space-y-1">
                           <div className="flex justify-between text-xs font-medium">
                               <span>{stat.day}</span>
                               <span className="text-muted-foreground">{stat.count} sessions</span>
                           </div>
                           <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 transition={{ delay: i * 0.1, duration: 0.8 }}
                                 className={`h-full ${i === 0 ? 'bg-primary' : 'bg-primary/50'}`}
                               />
                           </div>
                       </div>
                     );
                 }) : (
                     <div className="text-center text-muted-foreground text-xs py-4">No data available yet.</div>
                 )}
             </div>
        </motion.div>

        {/* Insight / Hint Box */}
        {mostPopularDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3"
          >
             <Lightbulb className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
             <div className="space-y-0.5">
                 <h4 className="font-bold text-sm text-yellow-700">Insight</h4>
                 <p className="text-xs text-yellow-900/80 dark:text-yellow-200/80 leading-relaxed">
                    <strong>{mostPopularDay}s</strong> are your power days! Keep it up.
                 </p>
             </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default StatsWorkouts;
