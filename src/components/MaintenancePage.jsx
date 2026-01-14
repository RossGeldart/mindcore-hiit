
import React from 'react';
import { motion } from 'framer-motion';
import { Construction, Mail } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#3b0764] p-4 font-sans text-slate-100 overflow-hidden relative">
      {/* Background ambient effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl text-center"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 md:p-12">
          
          {/* Animated Icon */}
          <motion.div 
            className="mb-8 flex justify-center"
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-sm">
              <Construction className="w-12 h-12 text-blue-200" />
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 mb-6 tracking-tight drop-shadow-sm">
            Temporarily Offline
          </h1>

          <p className="text-lg md:text-xl text-blue-100/90 font-medium leading-relaxed mb-8">
            Mindcore HIIT Generator is temporarily offline while we work on improvements.
          </p>

          <div className="w-16 h-1 bg-white/20 mx-auto rounded-full mb-8" />

          <div className="space-y-6">
            <p className="text-slate-300">
              Please check back soon.
            </p>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-slate-400 mb-2">For urgent issues, contact</p>
              <a 
                href="mailto:ross@mindcorehiitgenerator.com" 
                className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors font-semibold text-lg group"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                ross@mindcorehiitgenerator.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Mind Core. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
