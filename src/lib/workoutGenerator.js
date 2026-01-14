
import { supabase } from '@/lib/customSupabaseClient';

// Initial database structure matching UI IDs
let EXERCISE_DATABASE = {
  dumbbells: { 'full-body': [], 'upper-body': [], 'lower-body': [], 'core': [] },
  bodyweight: { 'full-body': [], 'upper-body': [], 'lower-body': [], 'core': [] },
  kettlebell: { 'full-body': [], 'upper-body': [], 'lower-body': [], 'core': [] },
  core: { 'full-body': [], 'upper-body': [], 'lower-body': [], 'core': [] } // Ensure 'core' exists as a top-level equipment key
};

const normalizeKey = (str) => str.toLowerCase().trim().replace(/[\s_-]+/g, '-');

const getCanonicalEquipment = (folderName) => {
  const lower = folderName.toLowerCase();
  if (lower.includes('dumbbell')) return 'dumbbells';
  if (lower.includes('kettlebell')) return 'kettlebell';
  if (lower.includes('bodyweight') || lower.includes('body weight')) return 'bodyweight';
  // Check for Core as a top-level folder type
  if (lower === 'core') return 'core';
  return normalizeKey(folderName);
};

const getCanonicalCategory = (folderName) => {
  const lower = folderName.toLowerCase();
  if (lower.includes('upper')) return 'upper-body';
  if (lower.includes('lower') || lower.includes('leg') || lower.includes('glute')) return 'lower-body';
  if (lower.includes('core') || lower.includes('abs')) return 'core';
  if (lower.includes('full') || lower.includes('total') || lower.includes('body')) {
    return 'full-body';
  }
  return normalizeKey(folderName);
};

function shouldSkipFile(filename) {
  if (!filename) return true;
  if (filename === '.emptyFolderPlaceholder') return true;
  if (filename.startsWith('.')) return true;
  if (!filename.match(/\.(jpg|jpeg|png|gif|mp4|mov|webm)$/i)) return true;
  return false;
}

export async function initializeWorkoutDatabase() {
  try {
    const BUCKET_NAME = 'Workouts';
    
    const { data: rootItems, error: rootError } = await supabase.storage.from(BUCKET_NAME).list();
    if (rootError) throw rootError;

    const equipmentFolders = rootItems.filter(item => !item.id);

    for (const eqFolder of equipmentFolders) {
      const eqKey = getCanonicalEquipment(eqFolder.name);
      
      if (!EXERCISE_DATABASE[eqKey]) EXERCISE_DATABASE[eqKey] = {};

      const { data: contents, error: contentError } = await supabase.storage.from(BUCKET_NAME).list(eqFolder.name);
      if (contentError) continue;

      const categories = contents.filter(item => !item.id);
      const directFiles = contents.filter(item => item.id);

      // Handle direct files in an equipment folder
      if (directFiles.length > 0) {
        // If the folder is 'core', default direct files to 'core' category
        let categoryKey = 'full-body';
        if (eqKey === 'core') categoryKey = 'core';
        
        if (!EXERCISE_DATABASE[eqKey][categoryKey]) EXERCISE_DATABASE[eqKey][categoryKey] = [];
        
        for (const file of directFiles) {
          if (shouldSkipFile(file.name)) continue;
          
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${eqFolder.name}/${file.name}`);
          const exerciseObj = createExerciseObject(file.name, data.publicUrl, eqKey, categoryKey);
          EXERCISE_DATABASE[eqKey][categoryKey].push(exerciseObj);
        }
      }

      // Handle subfolders (categories)
      for (const cat of categories) {
        const catKey = getCanonicalCategory(cat.name);
        
        if (!EXERCISE_DATABASE[eqKey][catKey]) EXERCISE_DATABASE[eqKey][catKey] = [];

        const { data: exercises, error: exError } = await supabase.storage.from(BUCKET_NAME).list(`${eqFolder.name}/${cat.name}`);
        if (exError) continue;

        for (const ex of exercises) {
          if (shouldSkipFile(ex.name)) continue;
          
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${eqFolder.name}/${cat.name}/${ex.name}`);
          const exerciseObj = createExerciseObject(ex.name, data.publicUrl, eqKey, catKey);
          EXERCISE_DATABASE[eqKey][catKey].push(exerciseObj);
        }
      }
    }
  } catch (err) {
    // Silent error handling in production
    console.warn("Error initializing workout DB", err);
  }
}

function createExerciseObject(fileName, url, equipmentId, categoryId) {
  const cleanName = fileName
    .replace(/\.(mp4|mov|webm|m4v)$/i, "") // Explicitly remove video extensions first
    .replace(/\.[^/.]+$/, "") // Catch any other extension
    .replace(/_/g, ' ') 
    .replace(/Mind Core Fitness/gi, '') 
    .replace(/-/g, ' ') 
    .replace(/\(1\)/g, '') // Remove (1) duplicates
    .replace(/\s\s+/g, ' ') 
    .trim();

  const equipmentDisplay = equipmentId.charAt(0).toUpperCase() + equipmentId.slice(1);

  return {
    name: cleanName,
    video_url: url,
    thumbnail_url: url, // Video element can use video URL as poster (browser generates frame) or we can look for specific thumb
    equipment: equipmentDisplay,
    category: categoryId,
    id: fileName 
  };
}

export function generateWorkout(equipmentList, totalMinutes, workoutType) {
  if (!equipmentList || equipmentList.length === 0) return null;

  const targetCategory = getCanonicalCategory(workoutType); 

  let rounds, workTime, restTime, exerciseCount;

  if (totalMinutes <= 5) {
    rounds = 2; workTime = 30; restTime = 15; exerciseCount = 3;
  } else if (totalMinutes <= 10) {
    rounds = 3; workTime = 30; restTime = 15; exerciseCount = 4;
  } else if (totalMinutes <= 15) {
     rounds = 3; workTime = 40; restTime = 20; exerciseCount = 5;
  } else { 
    rounds = 4; workTime = 40; restTime = 20; exerciseCount = 4;
  }
  
  if (totalMinutes >= 20) exerciseCount = 5;
  if (totalMinutes >= 30) exerciseCount = 6;

  const availableExercises = [];

  // Add 'core' to equipment list if workout type is core, to pull from top-level core folder if it exists
  const searchEquipment = [...equipmentList];
  if (workoutType === 'core' && !searchEquipment.includes('core')) {
     searchEquipment.push('core');
  }

  searchEquipment.forEach(eqId => {
    const eqData = EXERCISE_DATABASE[eqId];

    if (eqData) {
      let exercisesForType = [];

      if (targetCategory === 'full-body') {
        const upper = eqData['upper-body'] || [];
        const lower = eqData['lower-body'] || [];
        const core = eqData['core'] || [];
        const full = eqData['full-body'] || [];
        
        exercisesForType = [...full, ...upper, ...lower, ...core];
      } else {
        exercisesForType = eqData[targetCategory] || [];
      }

      exercisesForType.forEach(exercise => {
        availableExercises.push(exercise);
      });
    }
  });

  const uniqueExercises = Array.from(new Map(availableExercises.map(item => [item.name, item])).values());
  const shuffled = [...uniqueExercises].sort(() => Math.random() - 0.5);
  let selectedExercises = shuffled.slice(0, exerciseCount);

  if (selectedExercises.length === 0) {
    selectedExercises.push({
      name: 'Burpees (Fallback)',
      equipment: 'Bodyweight',
      video_url: '', 
      thumbnail_url: '',
      category: 'full-body',
      id: 'fallback-1'
    });
    selectedExercises.push({
      name: 'Jumping Jacks (Fallback)',
      equipment: 'Bodyweight',
      video_url: '', 
      thumbnail_url: '',
      category: 'full-body',
      id: 'fallback-2'
    });
    selectedExercises.push({
      name: 'Squats (Fallback)',
      equipment: 'Bodyweight',
      video_url: '', 
      thumbnail_url: '',
      category: 'full-body',
      id: 'fallback-3'
    });
  }

  return {
    exercises: selectedExercises,
    settings: {
      rounds: rounds,
      exerciseTime: workTime,
      restTime: restTime,
      roundRestTime: 0, // Ensure no rest between rounds
      exercisesPerRound: selectedExercises.length
    },
    totalDuration: totalMinutes * 60, 
    rounds: rounds,
    workTime: workTime,
    restTime: restTime,
    totalTime: `${totalMinutes} min`,
    type: workoutType
  };
}
