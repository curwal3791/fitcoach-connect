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
  ],
  'Zumba': [
    {
      name: 'Salsa Basic Step',
      description: 'Basic forward and back step with hip movement and arm styling.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Arms, Shoulders',
      modifications: 'Reduce hip movement, step in place',
      safetyNotes: 'Land softly, keep movements controlled',
      isPublic: true
    },
    {
      name: 'Merengue March',
      description: 'Step touch with hip bumps and arm movements to upbeat music.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Hips',
      secondaryMuscles: 'Core, Arms',
      modifications: 'March in place without hip movement',
      safetyNotes: 'Keep knees soft, stay hydrated',
      isPublic: true
    },
    {
      name: 'Reggaeton Bounce',
      description: 'Bouncing movement with shoulder and hip isolations.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Legs',
      secondaryMuscles: 'Shoulders, Arms',
      modifications: 'Reduce bounce intensity, simplify arm movements',
      safetyNotes: 'Maintain core engagement throughout',
      isPublic: true
    },
    {
      name: 'Cumbia Steps',
      description: 'Side-to-side steps with traditional cumbia arm movements.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Arms, Shoulders',
      modifications: 'Step without arm movements first',
      safetyNotes: 'Keep movements flowing and controlled',
      isPublic: true
    },
    {
      name: 'Bachata Hip Circles',
      description: 'Sensual hip circles with weight shifts and arm styling.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Hips',
      secondaryMuscles: 'Legs, Arms',
      modifications: 'Reduce hip movement range',
      safetyNotes: 'Move smoothly, avoid forcing range of motion',
      isPublic: true
    },
    {
      name: 'Soca Jumps',
      description: 'High-energy jumping movements with Caribbean flair.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Step-touch instead of jumping',
      safetyNotes: 'Land softly, take breaks as needed',
      isPublic: true
    },
    {
      name: 'Mambo Forward Basic',
      description: 'Forward and back mambo steps with Cuban motion.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Hips, Arms',
      modifications: 'Step in place without forward movement',
      safetyNotes: 'Keep weight on balls of feet',
      isPublic: true
    },
    {
      name: 'Belly Dance Hip Drops',
      description: 'Isolated hip drops with arm waves and graceful movement.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Core, Hips',
      secondaryMuscles: 'Arms, Shoulders',
      modifications: 'Reduce hip isolation intensity',
      safetyNotes: 'Move within comfortable range of motion',
      isPublic: true
    },
    {
      name: 'Afrobeats Shoulder Bounce',
      description: 'Rhythmic shoulder bouncing with African-inspired movements.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Shoulders, Core',
      secondaryMuscles: 'Arms, Legs',
      modifications: 'Reduce bounce intensity',
      safetyNotes: 'Keep movements loose and relaxed',
      isPublic: true
    },
    {
      name: 'Cool Down Stretch',
      description: 'Gentle stretching movements to wind down from dance session.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'All muscle groups',
      modifications: 'Hold stretches longer for deeper stretch',
      safetyNotes: 'Never bounce in stretches, breathe deeply',
      isPublic: true
    }
  ],
  'Spinning/Indoor Cycling': [
    {
      name: 'Seated Flat Road',
      description: 'Basic seated position with moderate resistance, steady cadence.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Calves, Hamstrings',
      modifications: 'Lower resistance, slower cadence',
      safetyNotes: 'Maintain proper bike setup and posture',
      isPublic: true
    },
    {
      name: 'Standing Climb',
      description: 'Out-of-saddle position with high resistance simulating hill climbing.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Glutes, Quadriceps',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Remain seated with higher resistance',
      safetyNotes: 'Engage core, avoid bouncing in saddle',
      isPublic: true
    },
    {
      name: 'Speed Intervals',
      description: 'High-cadence pedaling with moderate resistance for short bursts.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Cardiovascular, Legs',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Reduce cadence or interval duration',
      safetyNotes: 'Maintain control, don\'t sacrifice form for speed',
      isPublic: true
    },
    {
      name: 'Jumps',
      description: 'Alternating between seated and standing positions rhythmically.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Arms, Shoulders',
      modifications: 'Stay seated or reduce jump frequency',
      safetyNotes: 'Control transitions, land softly in saddle',
      isPublic: true
    },
    {
      name: 'Steady State Endurance',
      description: 'Consistent moderate effort for extended periods building endurance.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Cardiovascular, Legs',
      secondaryMuscles: 'Core, Back',
      modifications: 'Reduce resistance or duration',
      safetyNotes: 'Focus on breathing and pacing',
      isPublic: true
    },
    {
      name: 'Power Sprints',
      description: 'Maximum effort short bursts with recovery periods.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Reduce sprint intensity or duration',
      safetyNotes: 'Warm up thoroughly before sprinting',
      isPublic: true
    },
    {
      name: 'Single Leg Drills',
      description: 'Pedaling with one leg while other rests, improving efficiency.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Quadriceps, Hamstrings',
      secondaryMuscles: 'Glutes, Core',
      modifications: 'Use both legs with focus on smooth pedaling',
      safetyNotes: 'Start with short intervals, build gradually',
      isPublic: true
    },
    {
      name: 'Cadence Build',
      description: 'Gradually increasing pedaling speed while maintaining form.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Smaller cadence increases',
      safetyNotes: 'Maintain smooth pedal stroke throughout',
      isPublic: true
    },
    {
      name: 'Recovery Ride',
      description: 'Easy-paced cycling for active recovery between intense efforts.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Back',
      modifications: 'Even easier pace or shorter duration',
      safetyNotes: 'Focus on relaxation and breathing',
      isPublic: true
    },
    {
      name: 'Cool Down Stretch',
      description: 'Gentle cycling followed by stretching to end session.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Spin bike',
      primaryMuscles: 'Legs, Back',
      secondaryMuscles: 'Hips, Shoulders',
      modifications: 'Extend stretching time',
      safetyNotes: 'Allow heart rate to return to normal',
      isPublic: true
    }
  ],
  'Pilates': [
    {
      name: 'The Hundred',
      description: 'Core strengthening exercise with rhythmic arm pumping and breathing.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Core, Deep abdominals',
      secondaryMuscles: 'Arms, Legs',
      modifications: 'Bend knees, lower legs, or reduce arm pumping',
      safetyNotes: 'Keep lower back pressed to mat, breathe rhythmically',
      isPublic: true
    },
    {
      name: 'Roll Up',
      description: 'Slow controlled movement from lying to sitting, vertebra by vertebra.',
      difficultyLevel: 'Intermediate',
      category: 'flexibility',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Core, Spine',
      secondaryMuscles: 'Hip flexors, Arms',
      modifications: 'Use band assistance or bend knees',
      safetyNotes: 'Move slowly, engage deep abdominals throughout',
      isPublic: true
    },
    {
      name: 'Single Leg Circles',
      description: 'Controlled leg circles while maintaining stable pelvis.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Hip flexors, Core',
      secondaryMuscles: 'Quadriceps, Inner thighs',
      modifications: 'Smaller circles or bent knee',
      safetyNotes: 'Keep pelvis still, start with small movements',
      isPublic: true
    },
    {
      name: 'Plank',
      description: 'Hold strong straight line from head to heels, engaging core.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Core, Shoulders',
      secondaryMuscles: 'Arms, Legs',
      modifications: 'Drop to knees or reduce hold time',
      safetyNotes: 'Avoid sagging hips, breathe consistently',
      isPublic: true
    },
    {
      name: 'Teaser',
      description: 'V-sit position balancing on sitting bones with arms and legs extended.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Core, Hip flexors',
      secondaryMuscles: 'Back, Arms',
      modifications: 'Bend knees or hold behind thighs',
      safetyNotes: 'Lift from core, avoid gripping hip flexors',
      isPublic: true
    },
    {
      name: 'Swimming',
      description: 'Prone position lifting opposite arm and leg alternately.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Back, Glutes',
      secondaryMuscles: 'Shoulders, Hamstrings',
      modifications: 'Lift arms or legs only, or reduce range',
      safetyNotes: 'Keep neck neutral, engage deep abdominals',
      isPublic: true
    },
    {
      name: 'Side Leg Lifts',
      description: 'Lying on side, lift top leg maintaining proper alignment.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Outer thighs, Glutes',
      secondaryMuscles: 'Core, Inner thighs',
      modifications: 'Support head with bottom arm',
      safetyNotes: 'Keep body in straight line, control movement',
      isPublic: true
    },
    {
      name: 'Saw',
      description: 'Seated spinal rotation with forward reach, sawing motion.',
      difficultyLevel: 'Intermediate',
      category: 'flexibility',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Spine, Obliques',
      secondaryMuscles: 'Hamstrings, Arms',
      modifications: 'Sit on cushion or bend knees slightly',
      safetyNotes: 'Rotate from spine, keep hips square',
      isPublic: true
    },
    {
      name: 'Wall Sit',
      description: 'Squat position against wall, engaging legs and core.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Wall',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Core, Calves',
      modifications: 'Higher position or shorter hold time',
      safetyNotes: 'Keep knees aligned over ankles',
      isPublic: true
    },
    {
      name: 'Breathing Exercise',
      description: 'Focused breathing to engage deep core muscles and center mind.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Diaphragm, Deep core',
      secondaryMuscles: 'Pelvic floor, Ribcage',
      modifications: 'Any comfortable position',
      safetyNotes: 'Never force breathing, stay relaxed',
      isPublic: true
    }
  ],
  'CrossFit': [
    {
      name: 'Deadlift',
      description: 'Hip hinge movement lifting weight from floor to standing position.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, plates',
      primaryMuscles: 'Hamstrings, Glutes',
      secondaryMuscles: 'Back, Core',
      modifications: 'Use lighter weight or trap bar',
      safetyNotes: 'Keep back neutral, drive through heels',
      isPublic: true
    },
    {
      name: 'Pull-ups',
      description: 'Hanging from bar, pull body up until chin clears bar.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Pull-up bar',
      primaryMuscles: 'Lats, Biceps',
      secondaryMuscles: 'Rhomboids, Core',
      modifications: 'Use resistance band or assisted machine',
      safetyNotes: 'Full range of motion, control descent',
      isPublic: true
    },
    {
      name: 'Box Jumps',
      description: 'Explosive jump onto elevated platform, step down safely.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Plyo box',
      primaryMuscles: 'Legs, Glutes',
      secondaryMuscles: 'Core, Calves',
      modifications: 'Use lower box or step-ups',
      safetyNotes: 'Land softly, step down to prevent injury',
      isPublic: true
    },
    {
      name: 'Kettlebell Swings',
      description: 'Hip-driven movement swinging kettlebell from between legs to chest.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Kettlebell',
      primaryMuscles: 'Glutes, Hamstrings',
      secondaryMuscles: 'Core, Shoulders',
      modifications: 'Use lighter weight or dumbbell',
      safetyNotes: 'Power from hips, not arms or back',
      isPublic: true
    },
    {
      name: 'Thrusters',
      description: 'Squat to overhead press combination movement with weight.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Barbell or dumbbells',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular system',
      modifications: 'Use lighter weight or separate movements',
      safetyNotes: 'Maintain core stability throughout movement',
      isPublic: true
    },
    {
      name: 'Double Unders',
      description: 'Jump rope passing rope under feet twice per jump.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'Jump rope',
      primaryMuscles: 'Calves, Cardiovascular',
      secondaryMuscles: 'Shoulders, Core',
      modifications: 'Practice single skips first',
      safetyNotes: 'Stay on balls of feet, keep elbows close',
      isPublic: true
    },
    {
      name: 'Wall Balls',
      description: 'Squat and throw medicine ball to target on wall.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Medicine ball, wall',
      primaryMuscles: 'Legs, Shoulders',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Use lighter ball or lower target',
      safetyNotes: 'Catch ball in squat position, aim consistently',
      isPublic: true
    },
    {
      name: 'Rowing',
      description: 'Full-body cardio exercise using rowing machine.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'Rowing machine',
      primaryMuscles: 'Back, Legs',
      secondaryMuscles: 'Arms, Core',
      modifications: 'Adjust resistance or stroke rate',
      safetyNotes: 'Drive with legs first, then back, then arms',
      isPublic: true
    },
    {
      name: 'Handstand Push-ups',
      description: 'Inverted push-up against wall or freestanding.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Wall (optional)',
      primaryMuscles: 'Shoulders, Triceps',
      secondaryMuscles: 'Core, Back',
      modifications: 'Pike push-ups or wall walk-up',
      safetyNotes: 'Build up gradually, use spotter if needed',
      isPublic: true
    },
    {
      name: 'Rope Climb',
      description: 'Climb rope using legs and arms for assistance.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Climbing rope',
      primaryMuscles: 'Arms, Back',
      secondaryMuscles: 'Core, Legs',
      modifications: 'Lying rope pulls or assisted climbs',
      safetyNotes: 'Use proper foot technique, control descent',
      isPublic: true
    }
  ],
  'Barre': [
    {
      name: 'Pliés',
      description: 'Ballet-inspired squats with turned-out legs and core engagement.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Inner thighs, Glutes',
      secondaryMuscles: 'Quadriceps, Core',
      modifications: 'Hold barre for support, reduce range',
      safetyNotes: 'Keep knees aligned over toes',
      isPublic: true
    },
    {
      name: 'Relevés',
      description: 'Rising up on balls of feet, engaging calves and improving balance.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Calves, Ankles',
      secondaryMuscles: 'Core, Stabilizers',
      modifications: 'Hold barre for support',
      safetyNotes: 'Rise and lower with control',
      isPublic: true
    },
    {
      name: 'Attitude Lifts',
      description: 'Standing leg lifts to side with bent knee, ballet-inspired.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Glutes, Outer thighs',
      secondaryMuscles: 'Core, Hip flexors',
      modifications: 'Lower leg height or use barre support',
      safetyNotes: 'Keep hips square, engage core',
      isPublic: true
    },
    {
      name: 'Arabesques',
      description: 'Standing on one leg with other leg extended behind.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Glutes, Hamstrings',
      secondaryMuscles: 'Core, Back',
      modifications: 'Lower leg height or touch toe to floor',
      safetyNotes: 'Keep hips square, lengthen spine',
      isPublic: true
    },
    {
      name: 'Tricep Dips',
      description: 'Seated dips using chair or bench, targeting back of arms.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Chair or bench',
      primaryMuscles: 'Triceps, Shoulders',
      secondaryMuscles: 'Core, Chest',
      modifications: 'Bend knees or reduce range of motion',
      safetyNotes: 'Keep shoulders down, control movement',
      isPublic: true
    },
    {
      name: 'Core Series',
      description: 'Pilates-inspired abdominal exercises with small movements.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Mat',
      primaryMuscles: 'Core, Deep abdominals',
      secondaryMuscles: 'Hip flexors, Back',
      modifications: 'Support head or reduce range',
      safetyNotes: 'Keep lower back protected, breathe consistently',
      isPublic: true
    },
    {
      name: 'Port de Bras',
      description: 'Graceful arm movements coordinated with breathing and posture.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'None',
      primaryMuscles: 'Arms, Shoulders',
      secondaryMuscles: 'Core, Back',
      modifications: 'Seated or simplified arm patterns',
      safetyNotes: 'Move with control, maintain posture',
      isPublic: true
    },
    {
      name: 'Chair Pose Pulses',
      description: 'Small pulsing movements in squat position for endurance.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'None',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Core, Calves',
      modifications: 'Larger range of motion or less time',
      safetyNotes: 'Keep weight in heels, maintain alignment',
      isPublic: true
    },
    {
      name: 'Stretching Sequence',
      description: 'Ballet-inspired stretches for flexibility and recovery.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Hip flexors, Hamstrings',
      secondaryMuscles: 'Calves, Back',
      modifications: 'Use props for support',
      safetyNotes: 'Never force stretches, breathe deeply',
      isPublic: true
    },
    {
      name: 'Balance Challenge',
      description: 'Single-leg stands with various arm and leg movements.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barre or chair',
      primaryMuscles: 'Core, Stabilizers',
      secondaryMuscles: 'Legs, Ankles',
      modifications: 'Hold barre or reduce movement complexity',
      safetyNotes: 'Progress gradually, use support as needed',
      isPublic: true
    }
  ],
  'BodyPump/Barbell Classes': [
    {
      name: 'Squats',
      description: 'Fundamental lower body exercise with barbell across shoulders.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Hamstrings, Core',
      modifications: 'Use lighter weight or bodyweight only',
      safetyNotes: 'Keep chest up, knees aligned over toes',
      isPublic: true
    },
    {
      name: 'Chest Press',
      description: 'Lying chest press with barbell for upper body strength.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, bench, weights',
      primaryMuscles: 'Chest, Triceps',
      secondaryMuscles: 'Shoulders, Core',
      modifications: 'Use lighter weight or dumbbells',
      safetyNotes: 'Use spotter, control the weight throughout',
      isPublic: true
    },
    {
      name: 'Bent-over Rows',
      description: 'Pulling motion with barbell to strengthen back muscles.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Lats, Rhomboids',
      secondaryMuscles: 'Biceps, Core',
      modifications: 'Use lighter weight or supported position',
      safetyNotes: 'Keep back straight, engage core throughout',
      isPublic: true
    },
    {
      name: 'Overhead Press',
      description: 'Standing shoulder press with barbell overhead.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Shoulders, Triceps',
      secondaryMuscles: 'Core, Upper back',
      modifications: 'Seated position or lighter weight',
      safetyNotes: 'Keep core tight, press straight up',
      isPublic: true
    },
    {
      name: 'Lunges',
      description: 'Single-leg strengthening exercise with barbell for resistance.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Quadriceps, Glutes',
      secondaryMuscles: 'Hamstrings, Core',
      modifications: 'Bodyweight only or use support',
      safetyNotes: 'Step back to starting position, avoid knee impact',
      isPublic: true
    },
    {
      name: 'Bicep Curls',
      description: 'Isolated arm exercise targeting biceps with barbell.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Biceps',
      secondaryMuscles: 'Forearms, Core',
      modifications: 'Use lighter weight or dumbbells',
      safetyNotes: 'Keep elbows stable, control the movement',
      isPublic: true
    },
    {
      name: 'Tricep Extensions',
      description: 'Overhead tricep exercise using barbell for arm strength.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Triceps',
      secondaryMuscles: 'Shoulders, Core',
      modifications: 'Use lighter weight or dumbbells',
      safetyNotes: 'Keep elbows pointed forward, control descent',
      isPublic: true
    },
    {
      name: 'Clean and Press',
      description: 'Explosive movement from floor to overhead in one motion.',
      difficultyLevel: 'Advanced',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular system',
      modifications: 'Break into separate movements or lighter weight',
      safetyNotes: 'Learn proper form first, use appropriate weight',
      isPublic: true
    },
    {
      name: 'Upright Rows',
      description: 'Vertical pulling exercise targeting shoulders and upper back.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Barbell, weights',
      primaryMuscles: 'Shoulders, Upper traps',
      secondaryMuscles: 'Biceps, Core',
      modifications: 'Use lighter weight or wider grip',
      safetyNotes: 'Don\'t pull too high, avoid shoulder impingement',
      isPublic: true
    },
    {
      name: 'Cool Down Stretches',
      description: 'Static stretches to end strength training session properly.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'All worked muscles',
      modifications: 'Hold stretches longer or shorter as needed',
      safetyNotes: 'Never bounce, breathe deeply throughout',
      isPublic: true
    }
  ],
  'Aqua Fitness/Water Aerobics': [
    {
      name: 'Water Walking',
      description: 'Forward and backward walking in water for low-impact cardio.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Arms, Cardiovascular',
      modifications: 'Use pool noodle for support',
      safetyNotes: 'Maintain good posture, use water resistance',
      isPublic: true
    },
    {
      name: 'Jumping Jacks',
      description: 'Traditional jumping jacks modified for water resistance.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular system',
      modifications: 'Step-touch variation or slower pace',
      safetyNotes: 'Use water buoyancy, maintain balance',
      isPublic: true
    },
    {
      name: 'Leg Swings',
      description: 'Side-to-side and front-to-back leg movements in water.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Hip flexors, Glutes',
      secondaryMuscles: 'Core, Legs',
      modifications: 'Smaller range of motion or wall support',
      safetyNotes: 'Use pool edge for support if needed',
      isPublic: true
    },
    {
      name: 'Arm Circles',
      description: 'Large and small arm circles using water resistance.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Shoulders, Arms',
      secondaryMuscles: 'Core, Upper back',
      modifications: 'Smaller circles or one arm at a time',
      safetyNotes: 'Keep shoulders relaxed, use full range of motion',
      isPublic: true
    },
    {
      name: 'Cross-Country Skiing',
      description: 'Alternating arm and leg movements simulating skiing motion.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular, Core',
      modifications: 'Slower pace or arms-only variation',
      safetyNotes: 'Coordinate opposite arm and leg movements',
      isPublic: true
    },
    {
      name: 'Water Jogging',
      description: 'Running motion in deep water with or without flotation.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Pool, flotation belt (optional)',
      primaryMuscles: 'Legs, Cardiovascular',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Use flotation belt or shallow water',
      safetyNotes: 'Maintain running form, use proper buoyancy',
      isPublic: true
    },
    {
      name: 'Aqua Zumba',
      description: 'Dance movements adapted for water with Latin music.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular, Core',
      modifications: 'Simpler moves or slower pace',
      safetyNotes: 'Keep movements flowing, enjoy the music',
      isPublic: true
    },
    {
      name: 'Resistance Exercises',
      description: 'Strength training using water resistance and pool equipment.',
      difficultyLevel: 'Intermediate',
      category: 'strength',
      equipmentNeeded: 'Pool, water weights (optional)',
      primaryMuscles: 'Arms, Legs',
      secondaryMuscles: 'Core, Full body',
      modifications: 'Use equipment or bodyweight only',
      safetyNotes: 'Control movements against water resistance',
      isPublic: true
    },
    {
      name: 'Pool Noodle Exercises',
      description: 'Various exercises using pool noodles for resistance and support.',
      difficultyLevel: 'Beginner',
      category: 'strength',
      equipmentNeeded: 'Pool, pool noodles',
      primaryMuscles: 'Core, Arms',
      secondaryMuscles: 'Legs, Stabilizers',
      modifications: 'Different noodle positions or exercises',
      safetyNotes: 'Use noodle safely, maintain proper form',
      isPublic: true
    },
    {
      name: 'Cool Down Float',
      description: 'Gentle floating and stretching to end aqua fitness session.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'Pool',
      primaryMuscles: 'Full body relaxation',
      secondaryMuscles: 'Mind, Nervous system',
      modifications: 'Use flotation aids if needed',
      safetyNotes: 'Relax completely, breathe deeply',
      isPublic: true
    }
  ],
  'Dance Fitness': [
    {
      name: 'Basic Step Touch',
      description: 'Simple side-step with touch, foundation for dance fitness.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Arms, Cardiovascular',
      modifications: 'March in place or smaller steps',
      safetyNotes: 'Land softly, keep movements controlled',
      isPublic: true
    },
    {
      name: 'Grapevine',
      description: 'Traveling step pattern moving side to side with crossovers.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Hip abductors, Balance',
      modifications: 'Step-touch without crossover',
      safetyNotes: 'Watch for other participants, control direction changes',
      isPublic: true
    },
    {
      name: 'Hip Hop Moves',
      description: 'Urban dance movements with attitude and rhythmic flow.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Core, Coordination',
      modifications: 'Simplify moves or reduce intensity',
      safetyNotes: 'Express yourself, stay within comfortable range',
      isPublic: true
    },
    {
      name: 'Latin Dance Steps',
      description: 'Salsa, cha-cha, and merengue-inspired movements.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Hips, Legs',
      secondaryMuscles: 'Core, Arms',
      modifications: 'Reduce hip movement or arm styling',
      safetyNotes: 'Keep movements flowing and rhythmic',
      isPublic: true
    },
    {
      name: 'Jazz Squares',
      description: 'Classic dance move creating square pattern with feet.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Legs, Core',
      secondaryMuscles: 'Balance, Coordination',
      modifications: 'Step-touch or march in place',
      safetyNotes: 'Keep steps controlled, maintain balance',
      isPublic: true
    },
    {
      name: 'Cardio Dance Combo',
      description: 'High-energy combination of various dance styles.',
      difficultyLevel: 'Advanced',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Cardiovascular, Core',
      modifications: 'Break down into simpler moves',
      safetyNotes: 'Stay hydrated, listen to your body',
      isPublic: true
    },
    {
      name: 'Arm Waves',
      description: 'Flowing arm movements creating wave-like motion.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'None',
      primaryMuscles: 'Arms, Shoulders',
      secondaryMuscles: 'Core, Upper back',
      modifications: 'Smaller range or one arm at a time',
      safetyNotes: 'Keep movements smooth and controlled',
      isPublic: true
    },
    {
      name: 'Booty Shakes',
      description: 'Hip and glute isolation movements with rhythm.',
      difficultyLevel: 'Intermediate',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Glutes, Hips',
      secondaryMuscles: 'Core, Legs',
      modifications: 'Reduce intensity or range of motion',
      safetyNotes: 'Move within comfortable range, have fun',
      isPublic: true
    },
    {
      name: 'Cool Down Dance',
      description: 'Slow, flowing movements to gradually lower heart rate.',
      difficultyLevel: 'Beginner',
      category: 'flexibility',
      equipmentNeeded: 'None',
      primaryMuscles: 'Full body',
      secondaryMuscles: 'Mind, Relaxation',
      modifications: 'Even slower pace or seated movements',
      safetyNotes: 'Focus on breathing, enjoy the music',
      isPublic: true
    },
    {
      name: 'Freestyle Expression',
      description: 'Open movement time for personal dance expression.',
      difficultyLevel: 'Beginner',
      category: 'cardio',
      equipmentNeeded: 'None',
      primaryMuscles: 'Variable',
      secondaryMuscles: 'Creativity, Confidence',
      modifications: 'Any movement that feels good',
      safetyNotes: 'Express yourself freely, no judgment',
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