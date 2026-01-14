import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, Dumbbell, Layers, AlarmClock, RotateCcw, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/contexts/SoundContext';

const WorkoutSummary = ({ workout, onStartWorkout, onBack }) => {
  const { initAudio } = useSound();

  if (!workout) return null;

  const { totalTime, exercises } = workout;
  const exerciseCount = exercises?.length || 0;

  // Extract workout settings, using defaults if not present
  const workTime = workout.settings?.exerciseTime || workout.workTime || 30;
  const restTime = workout.settings?.restTime || workout.restTime || 15;
  const rounds = workout.settings?.rounds || workout.rounds || 1;

  const handleStart = () => {
    // Explicitly unlock audio context on this user interaction
    initAudio();
    onStartWorkout();
  };

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans overflow-hidden transition-colors duration-300 relative">
      
      {/* Scrollable Container */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pb-32 relative z-10 no-scrollbar">
        
        {/* Header Section */}
        <div className="px-5 pt-6 pb-2">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-3 mb-2 h-8 px-2"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5 mr-1.5" />
            Back
          </Button>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-0.5 text-foreground">Your Plan</h1>
            <p className="text-muted-foreground text-base">Review sequence</p>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="px-5 mb-4">
          <div className="bg-card rounded-xl p-3 grid grid-cols-2 lg:grid-cols-5 gap-3 border border-border shadow-md">
            {/* Duration */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-base leading-none text-foreground">{totalTime}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Duration</div>
              </div>
            </div>
            
            {/* Exercises Count */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <Layers className="w-4 h-4 text-primary" />
              </div>
               <div>
                <div className="font-bold text-base leading-none text-foreground">{exerciseCount}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Exercises</div>
              </div>
            </div>

            {/* Rounds */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <RotateCcw className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-base leading-none text-foreground">{rounds}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Rounds</div>
              </div>
            </div>

            {/* Work Time */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-base leading-none text-foreground">{workTime}s</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Work Time</div>
              </div>
            </div>

            {/* Rest Time */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <AlarmClock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-base leading-none text-foreground">{restTime}s</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Rest Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sequence List */}
        <div className="px-5">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm pt-2 pb-3 z-20 transition-colors duration-300">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sequence</h3>
          </div>
          
          <div className="space-y-2.5">
            {exercises.map((exercise, index) => (
              <motion.div
                key={`${exercise.id}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-card p-2.5 rounded-xl border border-border hover:border-primary/30 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted relative shadow-sm border border-border">
                   {exercise.video_url ? (
                      <video
                        src={exercise.video_url}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                   )}
                   {/* Small index badge overlay */}
                   <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] w-4 h-4 flex items-center justify-center rounded-full text-white font-bold backdrop-blur-md border border-white/10">
                      {index + 1}
                   </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h4 className="font-semibold text-foreground text-sm leading-tight mb-1.5 line-clamp-2">{exercise.name}</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                     <span className="text-[9px] text-primary font-bold uppercase tracking-wide bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
                       {exercise.equipment || "Bodyweight"}
                     </span>
                     {exercise.category && (
                       <span className="text-[9px] text-muted-foreground capitalize">
                         {exercise.category.replace(/-/g, ' ')}
                       </span>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-background via-background/95 to-transparent z-30 safe-area-bottom pointer-events-none">
        <div className="pointer-events-auto">
          <Button 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold tracking-wide rounded-2xl shadow-xl shadow-black/20 dark:shadow-black/40 transition-transform active:scale-[0.98]"
            onClick={handleStart}
          >
            START WORKOUT <Play className="w-5 h-5 ml-2 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;