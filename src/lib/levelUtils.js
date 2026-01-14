// Level 0 starts at 0 minutes.
// Level 1 at 10 minutes (Increment: 10).
// Level 2 at 70 minutes (Increment: 60).
// Level 3 at 190 minutes (Increment: 120).
// Level 4 at 430 minutes (Increment: 240).
// Increments double after Level 2.

export const generateThresholds = () => {
  const thresholds = [0]; // Level 0
  let currentTotal = 0;
  let increment = 10; // For Level 1

  // We need thresholds up to Level 20
  for (let level = 1; level <= 20; level++) {
    if (level === 1) {
      increment = 10;
    } else if (level === 2) {
      increment = 60;
    } else {
      increment = increment * 2;
    }
    currentTotal += increment;
    thresholds.push(currentTotal);
  }
  return thresholds;
};

// [0, 10, 70, 190, 430, 910, 1870, 3790, 7630, 15310, 30670, 61390, 122830, 245710, 491470, 983030, 1966150, 3932390, 7864870, 15729830, 31459750]
export const LEVEL_THRESHOLDS = generateThresholds();

export const calculateLevel = (minutes) => {
  if (!minutes || minutes < 0) return 0;
  
  // Iterate backwards to find the highest threshold reached
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (minutes >= LEVEL_THRESHOLDS[i]) {
      return i; // Return the index as the Level (0, 1, 2...)
    }
  }
  return 0;
};

export const calculateNextLevelProgress = (minutes) => {
    const currentLevel = calculateLevel(minutes);
    
    // Max level check
    if (currentLevel >= LEVEL_THRESHOLDS.length - 1) {
       return {
         level: currentLevel,
         currentLevelMin: LEVEL_THRESHOLDS[currentLevel],
         nextLevelMin: LEVEL_THRESHOLDS[currentLevel], // Cap it
         progressPercent: 100,
         minsToNextLevel: 0
       };
    }
    
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
    const nextThreshold = LEVEL_THRESHOLDS[currentLevel + 1];
    
    const range = nextThreshold - currentThreshold;
    const progressIntoLevel = Math.max(0, minutes - currentThreshold);
    const progressPercent = Math.min(100, Math.max(0, (progressIntoLevel / range) * 100));

    return {
      level: currentLevel,
      currentLevelMin: currentThreshold,
      nextLevelMin: nextThreshold,
      progressPercent,
      minsToNextLevel: Math.max(0, nextThreshold - minutes)
    };
};

export const BADGE_LEVELS = [
  { level: 1, name: "Rookie", description: "First steps taken.", minutesRequired: 10, id: 'badge_1' },
  { level: 3, name: "Challenger", description: "Rising to the challenge.", minutesRequired: 190, id: 'badge_3' },
  { level: 5, name: "Achiever", description: "Serious dedication.", minutesRequired: 910, id: 'badge_5' },
  { level: 10, name: "Master", description: "True mastery of self.", minutesRequired: 30670, id: 'badge_10' },
  { level: 15, name: "Grandmaster", description: "Among the elite.", minutesRequired: 983030, id: 'badge_15' },
  { level: 20, name: "Legend", description: "A fitness god.", minutesRequired: 31459750, id: 'badge_20' }
];