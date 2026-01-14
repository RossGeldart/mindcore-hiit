
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const MemberCard = ({ member, onClick }) => {
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchSubscription = async () => {
      // If subscription is passed in member object (future optimization), use it
      if (member.subscription) {
        setSubscription(member.subscription);
        return;
      }
      
      // Don't fetch for admin if we know they are admin (treat as VIP)
      // But we still might want consistency.
      
      try {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('status, plan_type')
          .eq('user_id', member.id)
          .maybeSingle();
          
        if (isMounted && data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to fetch sub for card", err);
      }
    };

    fetchSubscription();
    
    return () => { isMounted = false; };
  }, [member.id, member.subscription]);

  const isAdmin = member.role === 'admin';
  const isVip = isAdmin || subscription?.status === 'active' || subscription?.plan_type === 'lifetime' || subscription?.plan_type === 'paid';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(member.id)}
      className="bg-card hover:bg-card/80 border border-border/50 rounded-xl p-4 shadow-sm cursor-pointer transition-all flex items-center gap-4 group"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors flex items-center justify-center">
            {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
                <User className="w-6 h-6 text-muted-foreground" />
            )}
        </div>
        {isAdmin && (
             <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-sm border border-background">
                 <Shield className="w-3 h-3" />
             </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground truncate">{member.full_name || 'Anonymous User'}</h4>
            {isAdmin && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                    Admin
                </span>
            )}
        </div>
        
        <div className="mt-1">
             {isVip ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold border border-amber-500/20">
                  <Crown className="w-3 h-3 fill-current" /> VIP
                </span>
             ) : (
                <span className="text-xs text-muted-foreground font-medium">Basic</span>
             )}
        </div>
      </div>
    </motion.div>
  );
};

export default MemberCard;
