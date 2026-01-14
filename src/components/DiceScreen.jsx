import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSound } from '@/contexts/SoundContext';

const DiceScreen = ({ onRollComplete, onBack }) => {
  const [isRolling, setIsRolling] = useState(false);
  const { playClick } = useSound();

  const handleRoll = () => {
    if (isRolling) return;
    
    playClick();
    setIsRolling(true);
    
    setTimeout(() => {
      onRollComplete();
    }, 2000);
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden items-center justify-center transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-primary opacity-[0.1] blur-[100px]" />
      </div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-md px-5 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">RANDOMISE YOUR WORKOUT</h2>
          <p className="text-base text-muted-foreground">Get a new Core workout every time</p>
        </motion.div>

        <motion.button
          onClick={handleRoll}
          className="relative group rounded-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <motion.div
            animate={isRolling ? {
              rotate: [0, 720],
              scale: [1, 0.9, 1.1, 1]
            } : {}}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="relative w-40 h-40 bg-card rounded-full flex items-center justify-center shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden ring-4 ring-primary/20"
          >
            <img 
              src="https://horizons-cdn.hostinger.com/1fd02af2-c170-47a4-b1b2-c7eaf17ec2ee/7bbd5e87af6a8f0b1ca0de4c5e15ac9b.png" 
              alt="Mind Core Fist Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.button>

        <div className="h-20 flex items-center justify-center mt-6">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.p
                key="rolling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-bold text-primary animate-pulse"
              >
                GENERATING...
              </motion.p>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground text-xs uppercase tracking-widest"
              >
                Tap logo to start
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 bg-gradient-to-t from-background via-background to-transparent z-20 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={onBack}
            variant="ghost"
            disabled={isRolling}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-card h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiceScreen;