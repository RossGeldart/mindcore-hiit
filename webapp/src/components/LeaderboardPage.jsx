import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';

const LeaderboardPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background p-6 pt-12 pb-28">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
            <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl font-black tracking-tight">Global Rankings</h1>
            <p className="text-xs text-muted-foreground">See how you stack up against the world</p>
        </div>
      </div>

      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
      >
          <Leaderboard />
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;