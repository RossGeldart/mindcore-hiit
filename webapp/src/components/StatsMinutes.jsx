
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Zap, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StatsMinutes = ({ onBack }) => {
  const { user } = useAuth();
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Realtime subscription for user stats updates
    const channel = supabase
      .channel('stats_minutes_updates')
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
      const now = new Date();
      const currentDay = now.getDay(); 
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
      
      const monday = new Date(now);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0); 
      
      const mondayISO = monday.toISOString();

      const { data, error } = await supabase
        .from('workout_logs')
        .select('duration_minutes, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', mondayISO)
        .order('completed_at', { ascending: true });

      if (error) throw error;
      
      const { data: stats } = await supabase.from('user_stats').select('total_minutes').eq('user_id', user.id).single();
      setTotalMinutes(stats?.total_minutes || 0);

      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = {};
      weekDays.forEach(d => dayMap[d] = 0);

      if (data && data.length > 0) {
        data.forEach(log => {
            if (!log.completed_at) return;
            const logDate = new Date(log.completed_at);
            const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayMap[dayName] !== undefined) {
                dayMap[dayName] += (log.duration_minutes || 0);
            }
        });
      }

      const chartData = weekDays.map(day => ({
          dayLabel: day.charAt(0), 
          fullDay: day,
          mins: dayMap[day]
      }));

      setWeeklyData(chartData);
      
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const maxVal = Math.max(...weeklyData.map(d => d.mins), 60); 

  return (
    <div className="min-h-screen bg-background p-5 pt-16 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Minutes Trained</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-6 rounded-3xl text-center space-y-1"
        >
            <div className="text-4xl font-black text-blue-500">{totalMinutes}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Active Minutes</div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-card border border-border rounded-3xl p-5"
        >
             <div className="flex items-center gap-2 mb-4">
                 <Calendar className="w-4 h-4 text-primary" />
                 <h3 className="font-bold text-base">This Week</h3>
             </div>

             <div className="flex items-end justify-between h-32 gap-2 px-1">
                 {weeklyData.map((item, index) => (
                     <div key={index} className="flex flex-col items-center gap-1.5 flex-1 group">
                         <div className="w-full relative flex items-end justify-center h-full">
                             {/* Bar */}
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: `${(item.mins / maxVal) * 100}%` }}
                               transition={{ delay: index * 0.1, duration: 0.5 }}
                               className={`w-full max-w-[20px] rounded-t-sm transition-colors min-h-[4px] ${
                                   item.mins > 0 ? 'bg-primary group-hover:bg-primary/80' : 'bg-muted/30'
                               }`}
                             />
                             {item.mins > 0 && (
                                 <div className="absolute -top-6 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                     {item.mins}m
                                 </div>
                             )}
                         </div>
                         <div className="text-[10px] text-muted-foreground font-medium">{item.dayLabel}</div>
                     </div>
                 ))}
             </div>
        </motion.div>
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-3xl bg-muted/30 border border-border flex items-center gap-3"
        >
             <Zap className="w-6 h-6 text-yellow-500 shrink-0" />
             <div className="text-xs">
                 <span className="font-bold text-foreground">Did you know?</span>
                 <p className="text-muted-foreground mt-0.5">Even 15 minutes a day adds up to 90 hours a year!</p>
             </div>
        </motion.div>

      </div>
    </div>
  );
};

export default StatsMinutes;
