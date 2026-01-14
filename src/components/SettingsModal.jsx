
import React from 'react';
import { motion } from 'framer-motion';
import { X, Moon, Sun, Volume2, VolumeX, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';

const SettingsModal = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useSound();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -50 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="bg-card w-full max-w-sm rounded-3xl border border-border shadow-2xl overflow-hidden relative"
      >
        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-black tracking-tight">App Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Appearance
                </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => theme === 'dark' ? toggleTheme() : {}}
                className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    theme === 'light' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm font-bold">Light</span>
                {theme === 'light' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
              </button>

              <button
                onClick={() => theme === 'light' ? toggleTheme() : {}}
                className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    theme === 'dark' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm font-bold">Dark</span>
                {theme === 'dark' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
              </button>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} Sound Effects
            </h3>
            <div 
                onClick={toggleMute}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">App Sounds</span>
                    <span className="text-xs text-muted-foreground">Workout timers & interactions</span>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors relative ${!isMuted ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${!isMuted ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted/30 border-t border-border text-center">
             <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Mind Core Fitness v1.2</p>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
