
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSound } from '@/contexts/SoundContext';
import { Helmet } from 'react-helmet';
import ExerciseVideo from '@/components/ExerciseVideo';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const Confetti = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-primary rounded-full"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: -20, 
            scale: Math.random() * 0.5 + 0.5 
          }}
          animate={{ 
            y: window.innerHeight + 20,
            x: `calc(${Math.random() * window.innerWidth}px + ${Math.random() * 200 - 100}px)`
          }}
          transition={{ 
            duration: Math.random() * 2 + 2, 
            ease: "linear",
            repeat: Infinity 
          }}
          style={{
            backgroundColor: ['var(--primary)', '#FFFFFF', '#323230', '#8E2A34'][Math.floor(Math.random() * 4)]
          }}
        />
      ))}
    </div>
  );
};

const TimerScreen = ({ workout, onComplete, onBack, currentTheme }) => {
  const { toast } = useToast();
  const { playStart, playCountdown, playRest, playGo, playComplete, playClick } = useSound();
  const { user } = useAuth();

  const settings = useMemo(() => {
    if (!workout) return {};
    return workout.settings || {
      rounds: workout.rounds || 1,
      exerciseTime: workout.workTime || 30,
      restTime: workout.restTime || 15,
      // Explicitly set roundRestTime to 0 to prevent any default round rest
      roundRestTime: 0, 
      exercisesPerRound: workout.exercises?.length || 1
    };
  }, [workout]);

  const [currentRound, setCurrentRound] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalDuration, setTotalDuration] = useState(100);
  const [isRunning, setIsRunning] = useState(false); 
  const [isPaused, setIsPaused] = useState(false); 
  const [isResting, setIsResting] = useState(false);
  const [showGetReady, setShowGetReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [getReadyCount, setGetReadyCount] = useState(3);
  const [savingStats, setSavingStats] = useState(false);

  const timerRef = useRef(null);
  const getReadyTimerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const nextPhaseHandlerRef = useRef(null);
  
  // CRITICAL FIX: Ensure exactly one save per session
  const saveAttemptedRef = useRef(false);

  const exercises = workout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  
  const progressPercent = totalDuration > 0 ? (timer / totalDuration) * 100 : 0;
  
  const themeColor = isResting 
    ? (currentTheme === 'light' ? 'text-white' : 'text-foreground') 
    : 'text-primary';
  const themeBg = isResting ? 'bg-foreground' : 'bg-primary';
  const themeStroke = isResting ? 'currentColor' : 'var(--primary)';

  const isVideoPaused = isPaused;

  const startTimerLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (nextPhaseHandlerRef.current) {
             nextPhaseHandlerRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startTimer = useCallback((duration) => {
    setTimer(duration);
    setTotalDuration(duration);
    setIsRunning(true);
    startTimerLoop();
  }, [startTimerLoop]);

  const startGetReadyLoop = useCallback(() => {
    if (getReadyTimerRef.current) clearInterval(getReadyTimerRef.current);

    getReadyTimerRef.current = setInterval(() => {
      setGetReadyCount(prev => {
        if (prev <= 1) {
          clearInterval(getReadyTimerRef.current);
          setShowGetReady(false);
          setIsRunning(true); 
          playGo();
          return 0;
        }
        playCountdown();
        return prev - 1;
      });
    }, 1000);
  }, [playGo, playCountdown]);

  // Watch for the end of Get Ready phase to start the actual exercise
  useEffect(() => {
    if (!showGetReady && getReadyCount === 0 && isRunning && timer === 0) {
        startTimer(settings.exerciseTime);
    }
  }, [showGetReady, getReadyCount, isRunning, settings.exerciseTime, startTimer, timer]);


  const startGetReadyTimer = useCallback(() => {
    // 1. Clear ALL existing timers to prevent conflicts
    if (getReadyTimerRef.current) clearInterval(getReadyTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // 2. Reset state for "Get Ready"
    setShowGetReady(true);
    setIsRunning(false); 
    setIsPaused(false);
    setGetReadyCount(3);
    
    // 3. CRITICAL FIX: Reset timer to 0. 
    // This ensures that when Get Ready finishes, the useEffect above sees timer === 0
    // and correctly triggers startTimer(settings.exerciseTime).
    // Without this, if you skipped a phase where timer was > 0, the next timer would never start.
    setTimer(0); 
    
    playCountdown();
    startGetReadyLoop();
  }, [playCountdown, startGetReadyLoop]);

  const saveWorkoutStats = useCallback(async () => {
    if (!user || !workout) return;
    
    // CRITICAL FIX: Synchronous check preventing re-entry
    if (saveAttemptedRef.current) {
      console.log("Workout save already attempted. Skipping duplicate call.");
      return;
    }
    
    saveAttemptedRef.current = true;
    setSavingStats(true);

    try {
      // Safety Check: Verify no recent logs (last 30 seconds) to prevent duplicate API calls
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      const { data: recentLogs } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', thirtySecondsAgo)
        .limit(1);

      if (recentLogs && recentLogs.length > 0) {
         console.warn("Duplicate save prevented by timestamp check.");
         return;
      }

      const durationMinutes = Math.ceil(workout.totalDuration / 60);

      // We ONLY insert the workout log.
      // The database trigger 'handle_new_workout_log' will automatically update stats
      const { error } = await supabase.from('workout_logs').insert({
        user_id: user.id,
        duration_minutes: durationMinutes,
        workout_type: 'Core HIIT',
        completed_at: new Date().toISOString()
      });

      if (error) throw error;
      console.log("Workout saved successfully.");

    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Could not save stats",
        description: "Your workout was completed but stats couldn't be saved.",
        variant: "destructive"
      });
    } finally {
      setSavingStats(false);
    }
  }, [user, workout, toast]);

  const finishWorkout = useCallback(async () => {
    // Check if already finishing/saved to prevent double execution UI-side
    if (saveAttemptedRef.current) return;

    playComplete();
    setIsRunning(false);
    setIsPaused(true); 
    
    // Call save strictly once
    await saveWorkoutStats();

    setShowCelebration(true);
    setTimeout(() => {
      onComplete();
    }, 4000);
  }, [playComplete, onComplete, saveWorkoutStats]);

  const handleNextPhase = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(getReadyTimerRef.current);

    const totalRounds = settings.rounds || 1;
    const totalExercises = exercises.length;

    // SCENARIO 1: CURRENTLY RESTING
    // If we are currently in a rest period (between exercises), we always transition to the NEXT EXERCISE (Work).
    if (isResting) {
      setIsResting(false);
      
      const nextIndex = currentExerciseIndex + 1;
      
      // If we finished the last exercise of the current list/round...
      if (nextIndex >= totalExercises) {
        
        // Check if there are more rounds
        const isLastRound = currentRound >= totalRounds - 1;
        
        if (isLastRound) {
           // This handles the edge case where we might arrive here unexpectedly
           finishWorkout();
           return;
        }

        // --- NEW ROUND TRANSITION ---
        // Instead of triggering a long round rest, we immediately transition to the
        // first exercise of the NEXT round.
        setCurrentRound(prev => prev + 1);
        setCurrentExerciseIndex(0); 
        
        // Start "Get Ready" for the first exercise of the NEW round immediately
        startGetReadyTimer();
        
      } else {
        // Just move to next exercise in SAME round
        setCurrentExerciseIndex(nextIndex);
        startGetReadyTimer(); 
      }

    } else {
      // SCENARIO 2: CURRENTLY WORKING (Exercise finished)
      // We just finished an exercise interval (Work phase). 
      // We need to decide: Rest? Next Round? Finish?

      const isLastExerciseOfRound = currentExerciseIndex === totalExercises - 1;
      const isLastRound = currentRound >= totalRounds - 1;

      // 1. Is the ENTIRE workout done? (Last exercise of Last round)
      if (isLastExerciseOfRound && isLastRound) {
        finishWorkout();
        return;
      }

      // 2. Continuous Flow Logic:
      // Regardless of whether it's the last exercise of the round or a middle exercise,
      // we ALWAYS go to a REST period first. 
      // This creates the pattern: Work -> Rest -> Work -> Rest ... -> (Next Round) Work
      
      setIsResting(true);
      setIsRunning(true); 
      
      // Use the standard rest time for ALL transitions
      startTimer(settings.restTime);
      playRest();
    }
  }, [isResting, currentExerciseIndex, exercises.length, settings, currentRound, startGetReadyTimer, playRest, finishWorkout, startTimer]);

  useEffect(() => {
    nextPhaseHandlerRef.current = handleNextPhase;
  }, [handleNextPhase]);

  useEffect(() => {
    if (workout && !hasStartedRef.current) {
      hasStartedRef.current = true;
      playStart();
      startGetReadyTimer();
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(getReadyTimerRef.current);
    };
  }, [workout, playStart, startGetReadyTimer]);

  const togglePause = () => {
    playClick();
    
    if (isPaused) {
        setIsPaused(false);
        if (showGetReady) {
            startGetReadyLoop();
        } else {
            setIsRunning(true);
            startTimerLoop();
        }
    } else {
        setIsPaused(true);
        clearInterval(timerRef.current);
        clearInterval(getReadyTimerRef.current);
    }
  };

  const skipPhase = () => {
      // Prevent skipping if we are already saving/finished
      if (saveAttemptedRef.current) return;

      playClick();
      if (isPaused) setIsPaused(false);
      if (nextPhaseHandlerRef.current) nextPhaseHandlerRef.current();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!workout) return null;

  return (
    <div className={`relative h-full flex flex-col bg-background overflow-hidden transition-colors duration-300`}>
      <Helmet>
        <title>{isResting ? 'REST' : 'WORK'} - {formatTime(timer)}</title>
      </Helmet>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 z-[60] bg-background/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <Confetti />
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-extrabold text-foreground mb-6"
            >
              WORKOUT<br/><span className="text-primary">COMPLETE!</span>
            </motion.h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-20 h-20 text-green-500" />
            </motion.div>
            {savingStats && (
               <p className="mt-4 text-muted-foreground animate-pulse">Saving your stats...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section: Video Player Area */}
      <div className="relative w-full h-[35vh] shrink-0 bg-black z-10">
        
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
           <ExerciseVideo 
             exercise={currentExercise} 
             showTitle={false} 
             paused={isVideoPaused}
           />
        </div>

        {/* Contrast Overlay */}
        <div className="absolute inset-0 bg-black/30 z-10" />

        {/* Header Controls (Over Video) */}
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-30">
           <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md w-8 h-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center">
             <div className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full backdrop-blur-md bg-black/30 border border-white/10 mb-0.5 ${isResting ? 'text-white' : 'text-primary'}`}>
              {isResting ? 'REST & RECOVER' : 'HIGH INTENSITY'}
             </div>
             <div className="text-[9px] font-bold text-white/80 uppercase tracking-wider bg-black/30 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
               Round {currentRound + 1} / {settings.rounds}
             </div>
          </div>
          <div className="w-8" />
        </div>

        {/* Main Timer Overlay */}
        <div className="absolute bottom-4 left-4 z-20 w-[80px] h-[80px]">
           <AnimatePresence mode="wait">
            {showGetReady ? (
              // COUNTDOWN MODE
              <motion.div
                key="countdown-mode"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.3 } }}
                className="absolute inset-0 z-40 flex items-center justify-center"
              >
                <motion.div
                  key={getReadyCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-3xl font-black text-primary italic"
                >
                  {getReadyCount}
                </motion.div>
              </motion.div>
            ) : (
              // TIMER MODE
              <motion.div
                 key="timer-mode"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="relative w-full h-full flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm pointer-events-auto"
              >
                 {/* SVG Ring */}
                 <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 260 260">
                   {/* Background Track */}
                   <circle
                     cx="130" cy="130" r="120"
                     fill="transparent"
                     stroke="rgba(255,255,255,0.3)"
                     strokeWidth="12"
                   />
                   {/* Progress Arc */}
                   <motion.circle
                     cx="130" cy="130" r="120"
                     fill="transparent"
                     stroke={themeStroke}
                     strokeWidth="12"
                     strokeLinecap="round"
                     strokeDasharray={2 * Math.PI * 120}
                     animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progressPercent / 100) }}
                     transition={{ duration: 1, ease: "linear" }}
                   />
                 </svg>
                 
                 {/* Timer Text */}
                 <div className="z-10 flex flex-col items-center justify-center">
                    <div className={`font-black tabular-nums leading-none drop-shadow-md ${themeColor}`} style={{ fontSize: '24px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      {formatTime(timer)}
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Middle Section: Controls & Spotify */}
      <div className="shrink-0 bg-background border-b border-border z-20 shadow-md flex flex-col">
        
        {/* Controls */}
        <div className="pt-4 pb-3 flex items-center justify-center w-full">
             {/* Spacer for symmetry */}
             <div className="w-12 mr-5 flex-shrink-0" aria-hidden="true" />

             {/* Play / Pause Button (Center) */}
             <Button
                onClick={togglePause}
                className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 hover:scale-105 ${themeBg} hover:brightness-110 border-4 border-background z-10 flex-shrink-0`}
            >
                {!isPaused ? (
                    <Pause className={`w-6 h-6 ${isResting ? 'fill-background text-background' : 'fill-white text-white'}`} />
                ) : (
                    <Play className={`w-6 h-6 translate-x-0.5 ${isResting ? 'fill-background text-background' : 'fill-white text-white'}`} />
                )}
            </Button>

             {/* Skip / Next Button (Right) */}
             <div className="ml-5 flex-shrink-0">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={skipPhase}
                    className="w-12 h-12 rounded-full border-border bg-card hover:bg-muted text-foreground transition-all"
                >
                    <SkipForward className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* Spotify Player */}
        <div className="px-4 pb-3 w-full max-w-sm mx-auto">
            <iframe 
              style={{borderRadius: "12px"}} 
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO3FJyYF?utm_source=generator&theme=0" 
              width="100%" 
              height="80" 
              frameBorder="0" 
              allowFullScreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              title="Spotify Workout Playlist"
            ></iframe>
        </div>
      </div>

      {/* Bottom Section: Workout Progress (Scrollable) */}
      <div className="flex-1 flex flex-col bg-background z-0 overflow-y-auto">
        {/* Section Header */}
        <div className="px-4 py-2 flex justify-between items-center shrink-0 bg-background sticky top-0 z-10">
          <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Workout Progress</h3>
          <span className="text-muted-foreground text-[10px]">{currentExerciseIndex + 1} / {exercises.length}</span>
        </div>
        
        {/* Exercise List */}
        <div className="px-4 pb-4 space-y-2">
            {exercises.map((ex, idx) => {
                const isCompleted = idx < currentExerciseIndex;
                const isCurrent = idx === currentExerciseIndex;
                
                return (
                <div 
                    key={idx}
                    id={isCurrent ? "current-exercise" : undefined}
                    className={`flex items-center p-3 rounded-xl border transition-all duration-300 ${
                    isCurrent 
                        ? `bg-card border-primary shadow-lg shadow-black/5 dark:shadow-black/20` 
                        : isCompleted 
                        ? 'bg-card border-transparent opacity-40 grayscale' 
                        : 'bg-card border-border opacity-70'
                    }`}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-[10px] font-bold shrink-0 ${
                    isCurrent ? (isResting ? 'bg-foreground text-background' : 'bg-primary text-white') : 'bg-muted text-muted-foreground'
                    }`}>
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`font-medium truncate block ${isCurrent ? 'text-foreground text-base' : 'text-muted-foreground text-sm'}`}>
                            {ex.name}
                        </span>
                        {isCurrent && <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Current Exercise</span>}
                    </div>
                </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default TimerScreen;
