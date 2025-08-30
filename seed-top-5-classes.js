#!/usr/bin/env node
/**
 * Seed script for Top 5 Popular Group Fitness Classes and their exercises
 * Creates class types and associated exercises in the database
 */

import { Pool } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

const classTypesData = [
  {
    name: "Yoga",
    description: "A mind-body practice combining physical postures, breathing techniques, and meditation to improve flexibility, strength, balance, and mental well-being.",
    is_default: true
  },
  {
    name: "Zumba",
    description: "A high-energy dance fitness program that combines Latin and international music with dance moves, creating a fun, party-like atmosphere while providing an effective cardio workout.",
    is_default: true
  },
  {
    name: "Spinning/Indoor Cycling",
    description: "An intense cardiovascular workout performed on stationary bikes, featuring music-driven sessions with varied resistance and speed to simulate outdoor cycling conditions.",
    is_default: true
  },
  {
    name: "HIIT",
    description: "A time-efficient workout method alternating between short bursts of intense exercise and brief recovery periods to maximize calorie burn and improve cardiovascular fitness.",
    is_default: true
  },
  {
    name: "Pilates",
    description: "A low-impact exercise method focusing on core strength, flexibility, and body awareness through controlled, precise movements and proper breathing techniques.",
    is_default: true
  }
];

const exercisesData = {
  "Yoga": [
    {
      name: "Downward Facing Dog",
      description: "An inverted V-shape pose with hands and feet on the ground, stretching the entire body",
      difficulty_level: "Beginner",
      equipment_needed: "Yoga mat",
      primary_muscles: "Full body, core, shoulders, hamstrings",
      secondary_muscles: "Arms, calves, back",
      category: "flexibility",
      calories_per_minute: 3,
      modifications: "Place forearms on ground for easier variation, use blocks under hands for support",
      safety_notes: "Keep slight bend in knees if hamstrings are tight, avoid if you have wrist injuries",
      is_public: true
    },
    {
      name: "Child's Pose",
      description: "A resting pose kneeling with arms extended forward and forehead on the ground",
      difficulty_level: "Beginner",
      equipment_needed: "Yoga mat",
      primary_muscles: "Lower back, hips",
      secondary_muscles: "Shoulders, arms",
      category: "flexibility",
      calories_per_minute: 1,
      modifications: "Place pillow under forehead, widen knees for more comfort",
      safety_notes: "Avoid if you have knee injuries, can sit on heels if more comfortable",
      is_public: true
    },
    {
      name: "Warrior I",
      description: "A standing lunge pose with arms raised overhead, building strength and stability",
      difficulty_level: "Intermediate",
      equipment_needed: "Yoga mat",
      primary_muscles: "Legs, glutes, core",
      secondary_muscles: "Arms, shoulders, back",
      category: "strength",
      calories_per_minute: 4,
      modifications: "Use blocks under hands, shorten stance for easier balance",
      safety_notes: "Keep front knee aligned over ankle, avoid if you have hip injuries",
      is_public: true
    },
    {
      name: "Warrior II",
      description: "A wide-legged stance with arms extended parallel to the ground, opening the hips",
      difficulty_level: "Intermediate",
      equipment_needed: "Yoga mat",
      primary_muscles: "Legs, glutes, core",
      secondary_muscles: "Arms, shoulders",
      category: "strength",
      calories_per_minute: 4,
      modifications: "Place forearm on front thigh for support, use wall for balance",
      safety_notes: "Keep front knee tracking over ankle, don't let knee cave inward",
      is_public: true
    },
    {
      name: "Tree Pose",
      description: "A standing balance pose with one foot placed on the opposite leg's thigh or calf",
      difficulty_level: "Intermediate",
      equipment_needed: "Yoga mat",
      primary_muscles: "Core, legs",
      secondary_muscles: "Ankles, feet",
      category: "balance",
      calories_per_minute: 3,
      modifications: "Hold wall for support, place foot on ankle instead of calf/thigh",
      safety_notes: "Never place foot on side of knee, use wall or chair for balance if needed",
      is_public: true
    }
  ],
  "Zumba": [
    {
      name: "Basic Salsa Step",
      description: "A rhythmic step-together-step pattern moving side to side with hip action",
      difficulty_level: "Beginner",
      equipment_needed: "None",
      primary_muscles: "Legs, glutes, core",
      secondary_muscles: "Calves, hip flexors",
      category: "cardio",
      calories_per_minute: 8,
      modifications: "Reduce hip movement, step in place instead of side to side",
      safety_notes: "Wear proper dance shoes, keep movements controlled",
      is_public: true
    },
    {
      name: "Merengue March",
      description: "A simple marching step in place with alternating knee lifts and arm swings",
      difficulty_level: "Beginner",
      equipment_needed: "None",
      primary_muscles: "Legs, core",
      secondary_muscles: "Arms, shoulders",
      category: "cardio",
      calories_per_minute: 7,
      modifications: "Lower knee lifts, reduce arm movement",
      safety_notes: "Land softly on balls of feet, maintain good posture",
      is_public: true
    },
    {
      name: "Reggaeton Bounce",
      description: "A bouncing movement with bent knees and rhythmic up-and-down motion",
      difficulty_level: "Beginner",
      equipment_needed: "None",
      primary_muscles: "Legs, glutes, calves",
      secondary_muscles: "Core, ankles",
      category: "cardio",
      calories_per_minute: 9,
      modifications: "Reduce bounce height, hold onto something for balance",
      safety_notes: "Keep knees soft, land on balls of feet to reduce impact",
      is_public: true
    },
    {
      name: "Cumbia Step",
      description: "A side-to-side stepping pattern with a slight rocking motion",
      difficulty_level: "Beginner",
      equipment_needed: "None",
      primary_muscles: "Legs, core, hips",
      secondary_muscles: "Calves, glutes",
      category: "cardio",
      calories_per_minute: 7,
      modifications: "Smaller steps, less hip movement",
      safety_notes: "Keep weight centered, avoid overextending steps",
      is_public: true
    },
    {
      name: "Cha-Cha-Cha",
      description: "A quick triple-step pattern with a rock step, creating a lively rhythm",
      difficulty_level: "Intermediate",
      equipment_needed: "None",
      primary_muscles: "Legs, calves, core",
      secondary_muscles: "Ankles, hip flexors",
      category: "cardio",
      calories_per_minute: 8,
      modifications: "Slow down the tempo, simplify footwork",
      safety_notes: "Start slowly to learn the pattern, keep movements light and quick",
      is_public: true
    }
  ],
  "Spinning/Indoor Cycling": [
    {
      name: "Seated Flat Road",
      description: "Basic seated pedaling position with moderate resistance for endurance building",
      difficulty_level: "Beginner",
      equipment_needed: "Stationary bike, cycling shoes (optional)",
      primary_muscles: "Quadriceps, hamstrings, calves",
      secondary_muscles: "Glutes, core",
      category: "cardio",
      calories_per_minute: 12,
      modifications: "Lower resistance, slower cadence",
      safety_notes: "Proper bike fit essential, maintain good posture, stay hydrated",
      is_public: true
    },
    {
      name: "Standing Climb",
      description: "Pedaling while standing with high resistance to simulate uphill cycling",
      difficulty_level: "Intermediate",
      equipment_needed: "Stationary bike, cycling shoes (optional)",
      primary_muscles: "Quadriceps, glutes, hamstrings",
      secondary_muscles: "Core, calves, upper body",
      category: "strength",
      calories_per_minute: 15,
      modifications: "Lower resistance, shorter duration",
      safety_notes: "Engage core, don't bounce, maintain controlled movement",
      is_public: true
    },
    {
      name: "Seated Climb",
      description: "Seated pedaling with increased resistance to build leg strength",
      difficulty_level: "Beginner",
      equipment_needed: "Stationary bike, cycling shoes (optional)",
      primary_muscles: "Quadriceps, hamstrings, glutes",
      secondary_muscles: "Calves, core",
      category: "strength",
      calories_per_minute: 13,
      modifications: "Moderate resistance increase, maintain comfortable cadence",
      safety_notes: "Keep upper body relaxed, don't grip handlebars too tightly",
      is_public: true
    },
    {
      name: "Jumps (Seated to Standing)",
      description: "Alternating between seated and standing positions in rhythm",
      difficulty_level: "Intermediate",
      equipment_needed: "Stationary bike, cycling shoes (optional)",
      primary_muscles: "Full body, core, legs",
      secondary_muscles: "Arms, shoulders",
      category: "cardio",
      calories_per_minute: 14,
      modifications: "Longer intervals between position changes, lower resistance",
      safety_notes: "Smooth transitions, engage core, maintain bike control",
      is_public: true
    },
    {
      name: "Sprints",
      description: "High-speed pedaling with moderate resistance for short bursts",
      difficulty_level: "Advanced",
      equipment_needed: "Stationary bike, cycling shoes (optional)",
      primary_muscles: "Quadriceps, hamstrings, calves",
      secondary_muscles: "Glutes, core, cardiovascular system",
      category: "cardio",
      calories_per_minute: 18,
      modifications: "Shorter sprint intervals, lower resistance",
      safety_notes: "Proper warm-up essential, maintain control, cool down properly",
      is_public: true
    }
  ],
  "HIIT": [
    {
      name: "Burpees",
      description: "A full-body movement combining a squat, plank, push-up, and jump",
      difficulty_level: "Advanced",
      equipment_needed: "None",
      primary_muscles: "Full body, core, legs, chest",
      secondary_muscles: "Arms, shoulders, back",
      category: "cardio",
      calories_per_minute: 15,
      modifications: "Step back instead of jumping, remove push-up, no jump at the end",
      safety_notes: "Land softly, maintain good form throughout, modify as needed",
      is_public: true
    },
    {
      name: "Mountain Climbers",
      description: "A plank position with alternating knee drives toward the chest",
      difficulty_level: "Intermediate",
      equipment_needed: "None",
      primary_muscles: "Core, shoulders, legs",
      secondary_muscles: "Arms, glutes, cardiovascular system",
      category: "cardio",
      calories_per_minute: 12,
      modifications: "Slow down the pace, place hands on elevated surface",
      safety_notes: "Maintain plank position, keep hips level, engage core",
      is_public: true
    },
    {
      name: "Jump Squats",
      description: "Squatting down and explosively jumping up, landing softly",
      difficulty_level: "Intermediate",
      equipment_needed: "None",
      primary_muscles: "Quadriceps, glutes, hamstrings",
      secondary_muscles: "Calves, core",
      category: "strength",
      calories_per_minute: 13,
      modifications: "Regular squats without jumping, smaller jump height",
      safety_notes: "Land softly on balls of feet, keep knees aligned, proper squat form",
      is_public: true
    },
    {
      name: "High Knees",
      description: "Running in place while lifting knees as high as possible",
      difficulty_level: "Beginner",
      equipment_needed: "None",
      primary_muscles: "Hip flexors, quadriceps, calves",
      secondary_muscles: "Core, glutes",
      category: "cardio",
      calories_per_minute: 10,
      modifications: "Lower knee height, marching in place instead of running",
      safety_notes: "Land on balls of feet, maintain good posture, pump arms naturally",
      is_public: true
    },
    {
      name: "Push-ups",
      description: "A classic upper body exercise lowering and pressing the body up from the ground",
      difficulty_level: "Intermediate",
      equipment_needed: "None",
      primary_muscles: "Chest, shoulders, triceps",
      secondary_muscles: "Core, back",
      category: "strength",
      calories_per_minute: 8,
      modifications: "Knee push-ups, wall push-ups, incline push-ups",
      safety_notes: "Keep body in straight line, lower slowly, full range of motion",
      is_public: true
    }
  ],
  "Pilates": [
    {
      name: "The Hundred",
      description: "Lying on back, pumping arms while holding legs in tabletop position",
      difficulty_level: "Intermediate",
      equipment_needed: "Pilates mat",
      primary_muscles: "Core, abdominals",
      secondary_muscles: "Hip flexors, arms",
      category: "strength",
      calories_per_minute: 5,
      modifications: "Keep head down, bend knees, reduce arm pumping",
      safety_notes: "Keep lower back pressed into mat, breathe rhythmically",
      is_public: true
    },
    {
      name: "Roll Up",
      description: "Slowly rolling up from lying to seated position using core control",
      difficulty_level: "Intermediate",
      equipment_needed: "Pilates mat",
      primary_muscles: "Core, abdominals, hip flexors",
      secondary_muscles: "Spine, back",
      category: "flexibility",
      calories_per_minute: 4,
      modifications: "Bend knees, use hands for assistance, partial roll up",
      safety_notes: "Move slowly and controlled, don't force the movement",
      is_public: true
    },
    {
      name: "Single Leg Circles",
      description: "Lying down, drawing circles in the air with one extended leg",
      difficulty_level: "Beginner",
      equipment_needed: "Pilates mat",
      primary_muscles: "Hip flexors, core, glutes",
      secondary_muscles: "Inner thighs, outer thighs",
      category: "flexibility",
      calories_per_minute: 3,
      modifications: "Smaller circles, bend supporting leg, hold thigh for support",
      safety_notes: "Keep hips stable, control the movement, don't let back arch",
      is_public: true
    },
    {
      name: "Rolling Like a Ball",
      description: "Balancing on tailbone and rolling backward and forward",
      difficulty_level: "Intermediate",
      equipment_needed: "Pilates mat",
      primary_muscles: "Core, abdominals, back",
      secondary_muscles: "Hip flexors, spine",
      category: "balance",
      calories_per_minute: 4,
      modifications: "Hold behind thighs, smaller rolling motion, rock gently",
      safety_notes: "Keep chin to chest, control the roll, avoid rolling on neck",
      is_public: true
    },
    {
      name: "Single Leg Stretch",
      description: "Alternating knee-to-chest pulls while extending the opposite leg",
      difficulty_level: "Beginner",
      equipment_needed: "Pilates mat",
      primary_muscles: "Core, hip flexors",
      secondary_muscles: "Glutes, hamstrings",
      category: "flexibility",
      calories_per_minute: 5,
      modifications: "Keep head down, higher leg extension, slower pace",
      safety_notes: "Keep lower back pressed into mat, switch legs smoothly",
      is_public: true
    }
  ]
};

async function seedDatabase() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🌱 Starting to seed database with Top 5 Popular Classes...');
    
    // Insert class types and store their IDs
    const classTypeIds = {};
    
    console.log('\n📋 Creating Class Types:');
    for (const classType of classTypesData) {
      const result = await pool.query(
        `INSERT INTO class_types (name, description, is_default) 
         VALUES ($1, $2, $3) 
         RETURNING id, name`,
        [classType.name, classType.description, classType.is_default]
      );
      
      classTypeIds[classType.name] = result.rows[0].id;
      console.log(`  ✅ ${classType.name} (ID: ${result.rows[0].id})`);
    }
    
    // Insert exercises for each class type
    console.log('\n🏃‍♀️ Creating Exercises:');
    let totalExercises = 0;
    
    for (const [className, exercises] of Object.entries(exercisesData)) {
      console.log(`\n  📝 ${className} exercises:`);
      const classTypeId = classTypeIds[className];
      
      for (const exercise of exercises) {
        const result = await pool.query(
          `INSERT INTO exercises (
            name, description, difficulty_level, equipment_needed, 
            primary_muscles, secondary_muscles, category, calories_per_minute,
            modifications, safety_notes, class_type_id, is_public
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, name`,
          [
            exercise.name, exercise.description, exercise.difficulty_level,
            exercise.equipment_needed, exercise.primary_muscles, exercise.secondary_muscles,
            exercise.category, exercise.calories_per_minute, exercise.modifications,
            exercise.safety_notes, classTypeId, exercise.is_public
          ]
        );
        
        console.log(`    ✅ ${exercise.name} (${exercise.difficulty_level})`);
        totalExercises++;
      }
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${classTypesData.length} Class Types created`);
    console.log(`  • ${totalExercises} Exercises created`);
    console.log('  • All exercises linked to their respective class types');
    
    console.log('\n🏆 Popular Class Types Added:');
    classTypesData.forEach((classType, index) => {
      console.log(`  ${index + 1}. ${classType.name}`);
    });
    
    console.log('\n✨ Your database is now populated with the top 5 popular fitness classes and their key exercises!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();