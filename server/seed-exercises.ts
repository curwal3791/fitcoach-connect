import { db } from './db';
import { exercises, classTypes } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ExerciseData {
  name: string;
  description: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  equipmentNeeded: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  modifications: string;
  safetyNotes: string;
  isPublic: boolean;
}

const exercisesData: { [classType: string]: ExerciseData[] } = {
  'Yoga': [
    {
      name: 'Mountain Pose',
      description: 'Stand tall with feet hip-width apart, arms at sides, engaging core and lengthening spine.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Core, Legs',
      secondaryMuscles: 'Back, Shoulders',
      modifications: 'Stand against wall for support',
      safetyNotes: 'Keep knees slightly soft, avoid locking joints',
      isPublic: true
    },
    {
      name: 'Downward Dog',
      description: 'Form inverted V-shape with hands and feet planted, hips lifted high.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Shoulders, Hamstrings',
      secondaryMuscles: 'Calves, Core',
      modifications: 'Bend knees or use blocks under hands',
      safetyNotes: 'Distribute weight evenly between hands and feet',
      isPublic: true
    },
    {
      name: 'Warrior I',
      description: 'Lunge position with back leg straight, arms raised overhead, front knee bent.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Legs, Glutes',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Use wall for balance or shorten stance',
      safetyNotes: 'Keep front knee aligned over ankle',
      isPublic: true
    },
    {
      name: 'Tree Pose',
      description: 'Balance on one leg with other foot placed on inner thigh or calf.',
      difficultyLevel: 'Intermediate',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Core, Legs',
      secondaryMuscles: 'Ankles, Glutes',
      modifications: 'Use wall for support or keep toe on ground',
      safetyNotes: 'Never place foot on side of knee',
      isPublic: true
    },
    {
      name: 'Child\'s Pose',
      description: 'Kneel with knees apart, sit back on heels, arms extended forward on ground.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Back, Hips',
      secondaryMuscles: 'Shoulders, Arms',
      modifications: 'Place pillow between calves and thighs',
      safetyNotes: 'Avoid if knee problems, modify as needed',
      isPublic: true
    },
    {
      name: 'Cobra Pose',
      description: 'Lie face down, press palms down, lift chest while keeping hips grounded.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Back, Chest',
      secondaryMuscles: 'Shoulders, Arms',
      modifications: 'Keep forearms down for gentler backbend',
      safetyNotes: 'Lift from back muscles, not just arms',
      isPublic: true
    },
    {
      name: 'Pigeon Pose',
      description: 'Hip opener with one leg forward bent, other leg extended back.',
      difficultyLevel: 'Intermediate',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Hips, Glutes',
      secondaryMuscles: 'Quadriceps, Back',
      modifications: 'Use bolster or blocks for support',
      safetyNotes: 'Enter slowly, never force the stretch',
      isPublic: true
    },
    {
      name: 'Triangle Pose',
      description: 'Wide-legged forward fold with one hand reaching toward floor, other reaching up.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Hamstrings, Sides',
      secondaryMuscles: 'Core, Shoulders',
      modifications: 'Use block under bottom hand',
      safetyNotes: 'Keep both sides of torso equally long',
      isPublic: true
    },
    {
      name: 'Crow Pose',
      description: 'Arm balance with knees perched on upper arms, feet lifted off ground.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Arms, Core',
      secondaryMuscles: 'Shoulders, Wrists',
      modifications: 'Keep toes on ground or use block for head',
      safetyNotes: 'Warm up wrists thoroughly before attempting',
      isPublic: true
    },
    {
      name: 'Savasana',
      description: 'Final relaxation pose lying flat on back with arms and legs relaxed.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Yoga mat',
      primaryMuscles: 'Full body relaxation',
      secondaryMuscles: 'Mind, Nervous system',
      modifications: 'Use bolster under knees or eye pillow',
      safetyNotes: 'Allow complete relaxation, avoid fidgeting',
      isPublic: true
    }
  ],
  'HIIT': [
    {
      name: 'Burpees',
      description: 'Full body exercise: squat down, jump back to plank, do push-up, jump forward, jump up.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular system',
      modifications: 'Step back instead of jumping, omit push-up',
      safetyNotes: 'Land softly, maintain proper form throughout',
      isPublic: true
    },
    {
      name: 'Mountain Climbers',
      description: 'Plank position with alternating knee drives toward chest at rapid pace.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Shoulders',
      secondaryMuscles: 'Legs, Cardiovascular',
      modifications: 'Slow down pace or elevate hands on bench',
      safetyNotes: 'Keep hips level, avoid bouncing',
      isPublic: true
    },
    {
      name: 'Jump Squats',
      description: 'Regular squat followed by explosive jump up, landing softly back in squat.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Calves, Core',
      modifications: 'Remove jump, do regular squats',
      safetyNotes: 'Land softly on balls of feet, bend knees on landing',
      isPublic: true
    },
    {
      name: 'High Knees',
      description: 'Running in place while driving knees up toward chest as high as possible.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Hip flexors, Quadriceps',
      secondaryMuscles: 'Calves, Core',
      modifications: 'March in place with lower knee lift',
      safetyNotes: 'Stay on balls of feet, pump arms actively',
      isPublic: true
    },
    {
      name: 'Plank Jacks',
      description: 'Hold plank position while jumping feet apart and together like jumping jacks.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Shoulders',
      secondaryMuscles: 'Legs, Glutes',
      modifications: 'Step feet apart instead of jumping',
      safetyNotes: 'Keep core engaged, avoid sagging hips',
      isPublic: true
    },
    {
      name: 'Tuck Jumps',
      description: 'Jump up bringing knees toward chest, land softly and immediately repeat.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Calves, Core',
      modifications: 'Do regular vertical jumps without tucking knees',
      safetyNotes: 'Land softly, allow brief pause between jumps if needed',
      isPublic: true
    },
    {
      name: 'Russian Twists',
      description: 'Sit with knees bent, lean back slightly, rotate torso side to side.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Obliques',
      secondaryMuscles: 'Hip flexors',
      modifications: 'Keep feet on ground or use lighter weight',
      safetyNotes: 'Keep chest up, rotate from core not arms',
      isPublic: true
    },
    {
      name: 'Star Jumps',
      description: 'Jumping jacks with arms and legs extended wide into star shape.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular system',
      modifications: 'Step side to side instead of jumping',
      safetyNotes: 'Land softly, coordinate arm and leg movements',
      isPublic: true
    },
    {
      name: 'Squat Thrusts',
      description: 'Squat down, place hands on floor, jump feet back to plank, jump feet forward, stand.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Shoulders, Arms',
      modifications: 'Step back and forward instead of jumping',
      safetyNotes: 'Maintain straight line in plank position',
      isPublic: true
    },
    {
      name: 'Sprint Intervals',
      description: 'Alternate between maximum effort running/jogging and recovery walking.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Adjust intensity based on fitness level',
      safetyNotes: 'Warm up properly, gradually increase intensity',
      isPublic: true
    }
  ]
};

export async function seedExercises(userId: string) {
  try {
    console.log('Starting exercise seeding for user:', userId);
    
    // Get user's class types
    const userClassTypes = await db.select().from(classTypes).where(eq(classTypes.createdByUserId, userId));
    console.log('Found class types:', userClassTypes.length);
    
    let totalExercisesCreated = 0;
    
    for (const classType of userClassTypes) {
      const exercisesForClass = exercisesData[classType.name] || [];
      console.log(`Seeding ${exercisesForClass.length} exercises for class type: ${classType.name}`);
      
      for (const exerciseData of exercisesForClass) {
        await db.insert(exercises).values({
          ...exerciseData,
          classTypeId: classType.id,
          createdByUserId: userId,
        });
        totalExercisesCreated++;
      }
    }
    
    console.log(`Successfully seeded ${totalExercisesCreated} exercises for user: ${userId}`);
    return totalExercisesCreated;
  } catch (error) {
    console.error('Error seeding exercises:', error);
    throw error;
  }
}