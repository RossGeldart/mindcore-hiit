
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const DailyStreakCard = ({ lastUpdated }) => {
  const { user } = useAuth();
  const [completedDays, setCompletedDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeeklyLogs();
    }
  }, [user, lastUpdated]);

  const fetchWeeklyLogs = async () => {
    try {
      // Get start of current week (Monday)
      const now = new Date();
      const currentDay = now.getDay(); // 0-6 (Sun-Sat)
      // Calculate diff to get to Monday. If Sun (0), subtract 6. Else subtract currentDay - 1.
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      
      const monday = new Date(now);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      
      const mondayISO = monday.toISOString();

      const { data, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', mondayISO);

      if (error) throw error;

      // Process logs to find which days have workouts
      // Days: 0 (Mon) to 6 (Sun)
      const activeDays = new Set();
      
      data.forEach(log => {
        const logDate = new Date(log.completed_at);
        // getDay() returns 0 for Sunday, 1 for Monday.
        // We want 0 for Monday, 6 for Sunday.
        let dayIndex = logDate.getDay(); 
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        
        activeDays.add(dayIndex);
      });

      setCompletedDays(Array.from(activeDays));
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 p-4 w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Weekly Streak</h3>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
           {completedDays.length}/7 Days
        </span>
      </div>
      
      <div className="flex justify-between items-center gap-1">
        {days.map((day, index) => {
          const isCompleted = completedDays.includes(index);
          const isToday = (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) === index;
          
          return (
            <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
               <div className="relative">
                 <motion.div 
                   className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300",
                     isCompleted 
                       ? "bg-primary border-transparent text-primary-foreground shadow-md shadow-primary/20" 
                       : isToday
                         ? "bg-background border-primary text-primary shadow-sm"
                         : "bg-muted/40 border-transparent text-muted-foreground"
                   )}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : day}
                 </motion.div>
                 {isToday && !isCompleted && (
                   <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyStreakCard;
