import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/contexts/SoundContext';

const PRESET_TIMES = [5, 10, 15, 20, 25, 30];

const TimeSelection = ({ selectedTime, setSelectedTime, onNext, onBack, subscription, onUpgrade }) => {
  const { playClick } = useSound();
  const isPremium = subscription && ['active', 'trialing', 'lifetime'].includes(subscription.status);

  const handlePresetSelect = (time) => {
    playClick();
    if (time > 5 && !isPremium) {
      if (onUpgrade) onUpgrade();
      return;
    }
    setSelectedTime(time);
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Header - Compact */}
      <div className="px-5 pt-6 pb-2 shrink-0 z-10 bg-background transition-colors duration-300">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-card -ml-3 mb-2 h-8 px-2"
        >
          <ArrowLeft className="w-5 h-5 mr-1.5" />
          Back
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">DURATION</h2>
        <p className="text-sm text-muted-foreground">Set your workout timer</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 w-full overflow-y-auto px-5 pb-32 relative z-10 pt-2">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {PRESET_TIMES.map((time, index) => {
            const isLocked = time > 5 && !isPremium;
            const isSelected = selectedTime === time;

            return (
              <motion.button
                key={time}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePresetSelect(time)}
                className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center aspect-square transition-all duration-200 btn-touch-target overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-gradient-to-br from-background to-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                } ${isLocked ? 'opacity-90' : ''}`}
              >
                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                     <div className="bg-primary/10 p-1.5 rounded-full mb-1.5">
                        <Lock className="w-5 h-5 text-primary" />
                     </div>
                     <div className="flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                       <Crown className="w-2.5 h-2.5 fill-current" />
                       Premium
                     </div>
                  </div>
                )}

                <Clock className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'} ${isLocked ? 'opacity-40' : ''}`} />
                <div className={`text-3xl font-bold mb-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'} ${isLocked ? 'opacity-40' : ''}`}>
                  {time}
                </div>
                <div className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-muted-foreground/70'} ${isLocked ? 'opacity-40' : ''}`}>
                  MINUTES
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Action Container */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-background via-background/95 to-transparent z-30 pointer-events-none transition-colors duration-300 safe-area-bottom">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={onNext}
            disabled={!selectedTime}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 rounded-2xl shadow-lg shadow-black/20 dark:shadow-black/40 disabled:opacity-30 disabled:grayscale transition-all disabled:bg-muted disabled:text-muted-foreground"
          >
            ROLL THE DICE
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeSelection;