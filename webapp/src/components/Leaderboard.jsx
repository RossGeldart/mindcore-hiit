import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Dumbbell, User, Crown, Medal, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Leaderboard = ({ compact = false }) => {
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' or 'time'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch Top Stats
      const orderBy = activeTab === 'workouts' ? 'total_workouts' : 'total_minutes';
      const limit = compact ? 5 : 20; 

      // Adding a timestamp to ensure no caching happens
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(limit);
      
      if (statsError) throw statsError;

      if (!statsData || statsData.length === 0) {
        setData([]);
        return;
      }

      // 2. Fetch Profiles for these users
      const userIds = statsData.map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 3. Merge Data
      const combined = statsData.map((stat, index) => {
        const profile = profilesData.find(p => p.id === stat.user_id) || {};
        return { 
          ...stat, 
          full_name: profile.full_name || 'Anonymous User',
          avatar_url: profile.avatar_url,
          rank: index + 1
        };
      });
      
      setData(combined);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaderboard();
    setIsRefreshing(false);
    toast({
      description: "Leaderboard updated",
      duration: 2000
    });
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <div className="w-full space-y-4">
      {!compact && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Top Performers</h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Toggle Switch */}
                <div className="bg-muted p-1 rounded-xl flex items-center relative w-full sm:w-auto flex-1">
                {/* Sliding Background */}
                <motion.div 
                    className="absolute top-1 bottom-1 bg-background shadow-sm rounded-lg"
                    initial={false}
                    animate={{ 
                    x: activeTab === 'workouts' ? 4 : '100%', 
                    width: 'calc(50% - 8px)',
                    left: activeTab === 'workouts' ? 0 : '-4px'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                
                <button
                    onClick={() => setActiveTab('workouts')}
                    className={`flex-1 sm:w-32 py-2 px-4 rounded-lg text-sm font-bold z-10 transition-colors flex items-center justify-center gap-2 ${activeTab === 'workouts' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Dumbbell className="w-3.5 h-3.5" />
                    Workouts
                </button>
                <button
                    onClick={() => setActiveTab('time')}
                    className={`flex-1 sm:w-32 py-2 px-4 rounded-lg text-sm font-bold z-10 transition-colors flex items-center justify-center gap-2 ${activeTab === 'time' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    Time
                </button>
                </div>

                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing || loading} className="shrink-0">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>
          </div>
      )}

      <div className={`bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-sm ${compact ? 'border-none shadow-none bg-transparent' : ''}`}>
        <div className={`${compact ? 'p-0 space-y-1' : 'p-4 space-y-2'}`}>
          {loading ? (
             // Loading Skeletons
             [...Array(compact ? 3 : 5)].map((_, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl animate-pulse ${compact ? 'bg-transparent' : 'bg-background/50'}`}>
                   <div className="w-8 h-8 bg-muted rounded-full" />
                   <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-24" />
                   </div>
                   <div className="h-6 bg-muted rounded w-12" />
                </div>
             ))
          ) : data.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {data.map((user) => (
                <motion.div
                  key={`${user.user_id}-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors group ${compact ? 'hover:bg-muted/50' : 'hover:bg-background/80 border border-transparent hover:border-border'}`}
                >
                  <div className="w-8 flex justify-center shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
                       {user.avatar_url ? (
                         <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="font-semibold text-sm text-foreground truncate">{user.full_name}</div>
                     <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        {activeTab === 'workouts' ? (
                          <>
                             <Dumbbell className="w-3 h-3" />
                             {user.total_workouts} workouts
                          </>
                        ) : (
                          <>
                             <Clock className="w-3 h-3" />
                             {user.total_minutes} mins
                          </>
                        )}
                     </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-primary tabular-nums">
                       {activeTab === 'workouts' ? user.total_workouts : user.total_minutes}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
               <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No stats recorded yet.</p>
               <p className="text-xs mt-1">Be the first to train!</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {!compact && (
          <div className="px-4 py-3 bg-muted/30 border-t border-border text-center text-xs text-muted-foreground">
             Stats updated in real-time
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;