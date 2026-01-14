
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const WelcomeMessage = ({ onStart }) => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://horizons-cdn.hostinger.com/1fd02af2-c170-47a4-b1b2-c7eaf17ec2ee/18e7651e249ff1ba9e731dbed0e236fd.jpg" 
          alt="Athlete doing a plank" 
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-20 px-6 text-center max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 space-y-2"
        >
          <h1 className="text-5xl font-black italic tracking-tighter uppercase drop-shadow-xl leading-none">
            MIND CORE <span className="text-primary">HIIT</span>
          </h1>
          <p className="text-lg font-bold tracking-widest text-gray-300 uppercase">
            GENERATOR
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full space-y-6"
        >
          <Button 
            onClick={onStart}
            className="w-full h-14 rounded-full text-lg font-bold bg-white text-black hover:bg-gray-200 transition-transform hover:scale-105"
          >
            Get Started
          </Button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <button 
              onClick={() => window.location.href = '/privacy'} 
              className="hover:text-white transition-colors underline underline-offset-4"
            >
              Privacy Policy
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={() => window.location.href = '/terms'} 
              className="hover:text-white transition-colors underline underline-offset-4"
            >
              Terms of Service
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
