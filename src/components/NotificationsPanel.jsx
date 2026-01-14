
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, Trash2, Calendar, Trophy, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const getIcon = (title) => {
    if (title.includes('Workout')) return <Dumbbell className="w-5 h-5 text-blue-500" />;
    if (title.includes('Goal')) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (title.includes('Milestone')) return <Trophy className="w-5 h-5 text-purple-500" />;
    return <Bell className="w-5 h-5 text-primary" />;
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  }).format(new Date(notification.created_at));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`relative flex gap-4 p-4 rounded-2xl border mb-3 transition-colors ${
        notification.is_read ? 'bg-card border-border/50' : 'bg-primary/5 border-primary/20'
      }`}
    >
      <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        notification.is_read ? 'bg-muted' : 'bg-background shadow-sm'
      }`}>
        {getIcon(notification.title)}
      </div>
      
      <div className="flex-1 pr-8">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-semibold ${notification.is_read ? 'text-foreground' : 'text-primary'}`}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
            {formattedDate}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-snug">
          {notification.message}
        </p>
        
        <div className="flex gap-2 mt-3">
           {!notification.is_read && (
             <button 
               onClick={() => onMarkRead(notification.id)}
               className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
             >
               <Check className="w-3 h-3" /> Mark read
             </button>
           )}
           <button 
             onClick={() => onDelete(notification.id)}
             className="text-xs font-medium text-destructive hover:underline flex items-center gap-1"
           >
             <Trash2 className="w-3 h-3" /> Delete
           </button>
        </div>
      </div>
      
      {!notification.is_read && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </motion.div>
  );
};

const NotificationsPanel = ({ isOpen, onClose, userId, onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!userId) {
        setLoading(false);
        return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();

      const channel = supabase
        .channel('public:notifications_panel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev]);
              toast({
                title: payload.new.title,
                description: payload.new.message,
              });
              onUpdate?.(); 
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
              onUpdate?.(); 
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
              onUpdate?.(); 
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, userId]);

  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
      
    if (error) {
      fetchNotifications();
    } else {
      onUpdate?.(); 
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
       fetchNotifications();
    } else {
        toast({ description: "All notifications marked as read" });
        onUpdate?.(); 
    }
  };

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
        fetchNotifications();
    } else {
        onUpdate?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background border-l shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Notifications</h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
               {loading ? (
                 <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
                   ))}
                 </div>
               ) : notifications.length === 0 ? (
                 <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-medium">No notifications yet</p>
                    <p className="text-sm opacity-70 mt-1">Updates on your workouts and achievements will appear here.</p>
                 </div>
               ) : (
                 <div className="space-y-1">
                   {notifications.map(notification => (
                     <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onMarkRead={handleMarkRead}
                        onDelete={handleDelete}
                     />
                   ))}
                 </div>
               )}
            </ScrollArea>

            {notifications.length > 0 && (
                <div className="p-4 border-t bg-muted/10">
                    <Button 
                        variant="outline" 
                        className="w-full text-xs" 
                        onClick={handleMarkAllRead}
                        disabled={!notifications.some(n => !n.is_read)}
                    >
                        Mark all as read
                    </Button>
                </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
