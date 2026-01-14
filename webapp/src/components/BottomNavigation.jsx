
import React from 'react';
import { Trophy, Medal, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'stats_leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Medal },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          // Highlight 'members' tab even if viewing a specific member profile
          const isActive = currentScreen === item.id || (item.id === 'members' && currentScreen === 'member_profile');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full group"
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-current/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
