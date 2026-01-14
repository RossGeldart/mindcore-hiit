
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Calendar as CalendarIcon, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StatsStreak = ({ onBack }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchLogs();

    // Realtime subscription for user stats updates
    const channel = supabase
      .channel('stats_streak_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const dates = data.map(d => new Date(d.completed_at).toDateString());
      setLogs(dates);

      const { data: stats } = await supabase.from('user_stats').select('current_streak').eq('user_id', user.id).single();
      setCurrentStreak(stats?.current_streak || 0);
      setBestStreak(stats?.current_streak || 0); 
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const isWorkoutDay = (date) => {
    if (!date) return false;
    return logs.includes(date.toDateString());
  };

  const isToday = (date) => {
      if(!date) return false;
      return date.toDateString() === new Date().toDateString();
  }

  return (
    <div className="min-h-screen bg-background p-5 pt-16 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Streak Stats</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Hero Card */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-6 rounded-3xl text-center space-y-1 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-10">
                <Flame className="w-20 h-20" />
            </div>
            <div className="text-4xl font-black text-orange-500">{currentStreak}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Streak</div>
        </motion.div>

        {/* Calendar View */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-base">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1.5">
             {days.map((date, i) => (
                 <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold relative ${
                     !date ? '' : isWorkoutDay(date) ? 'bg-primary text-primary-foreground shadow-sm' : isToday(date) ? 'bg-muted border border-primary text-foreground' : 'bg-muted/30 text-muted-foreground'
                 }`}>
                     {date && date.getDate()}
                     {date && isWorkoutDay(date) && (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1">
                             <Flame className="w-2.5 h-2.5 text-orange-300 fill-orange-300" />
                         </motion.div>
                     )}
                 </div>
             ))}
          </div>
        </motion.div>

        {/* Motivational */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-card border border-border rounded-3xl p-5 flex items-center gap-3"
        >
            <div className="p-2.5 bg-yellow-500/10 rounded-2xl shrink-0">
                <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
                <h3 className="font-bold text-sm text-foreground">Consistency is Key</h3>
                <p className="text-[10px] text-muted-foreground">Workout 3x a week to maintain streak!</p>
            </div>
        </motion.div>

      </div>
    </div>
  );
};

export default StatsStreak;
