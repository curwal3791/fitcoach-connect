#!/usr/bin/env node
/**
 * Add Spinning class type back to the database with exercises
 */

import { Pool } from '@neondatabase/serverless';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

// Test user ID
const TEST_USER_ID = '0c982f0e-6872-4d4b-bc97-a4f217d10d8f';

// Spinning class type data
const SPINNING_CLASS = {
  name: "Spinning",
  description: "Indoor cycling class with motivating music and varying intensity levels for cardiovascular fitness and endurance.",
  isDefault: true,
  createdByUserId: TEST_USER_ID,
};

// Default exercises for Spinning class
const SPINNING_EXERCISES = [
  { name: "Warm-Up Ride", description: "Gentle cycling to prepare body for workout", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes, calves", category: "cardio", caloriesPerMinute: 8, modifications: "Lower resistance", safetyNotes: "Start slowly and build intensity" },
  { name: "Hill Climbs", description: "High resistance cycling to simulate uphill riding", difficultyLevel: "Intermediate", equipmentNeeded: "Stationary bike", primaryMuscles: "Quadriceps, glutes", secondaryMuscles: "Hamstrings, core", category: "strength", caloriesPerMinute: 12, modifications: "Reduce resistance", safetyNotes: "Maintain proper form, don't lean too far forward" },
  { name: "Sprint Intervals", description: "High-intensity cycling bursts with recovery periods", difficultyLevel: "Advanced", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes, calves", category: "cardio", caloriesPerMinute: 15, modifications: "Longer recovery periods", safetyNotes: "Monitor heart rate, stop if dizzy" },
  { name: "Seated Flat Road", description: "Steady pace cycling with moderate resistance", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes, calves", category: "cardio", caloriesPerMinute: 10, modifications: "Adjust resistance as needed", safetyNotes: "Maintain steady breathing" },
  { name: "Standing Climbs", description: "Out-of-saddle cycling with high resistance", difficultyLevel: "Intermediate", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core, arms", secondaryMuscles: "Shoulders, back", category: "strength", caloriesPerMinute: 13, modifications: "Stay seated if needed", safetyNotes: "Keep core engaged, don't bounce" },
  { name: "Jumps (Seated/Standing)", description: "Alternating between seated and standing positions", difficultyLevel: "Intermediate", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes, calves", category: "cardio", caloriesPerMinute: 11, modifications: "Reduce frequency of position changes", safetyNotes: "Smooth transitions, control the movement" },
  { name: "Tabata Sprints", description: "20-second all-out efforts with 10-second recovery", difficultyLevel: "Advanced", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs, core", secondaryMuscles: "Cardiovascular system", category: "cardio", caloriesPerMinute: 16, modifications: "Extend recovery periods", safetyNotes: "High intensity - monitor closely" },
  { name: "Recovery Ride", description: "Easy-paced cycling for active recovery", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Lower resistance further", safetyNotes: "Focus on smooth pedal stroke" },
  { name: "Power Intervals", description: "High resistance intervals for strength building", difficultyLevel: "Advanced", equipmentNeeded: "Stationary bike", primaryMuscles: "Quadriceps, glutes", secondaryMuscles: "Hamstrings, core", category: "strength", caloriesPerMinute: 14, modifications: "Reduce resistance or duration", safetyNotes: "Maintain proper posture throughout" },
  { name: "Cool-Down Stretch", description: "Easy cycling followed by stretching routine", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike, mat", primaryMuscles: "Full body", secondaryMuscles: "All muscle groups", category: "flexibility", caloriesPerMinute: 3, modifications: "Extend stretching time", safetyNotes: "Hold stretches for 15-30 seconds" }
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

async function addSpinningClass() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Check current class types
    console.log('📋 Checking current class types...');
    const currentClasses = await pool.query(`
      SELECT id, name 
      FROM class_types 
      WHERE created_by_user_id = $1
      ORDER BY name ASC
    `, [TEST_USER_ID]);
    
    console.log(`Current class types (${currentClasses.rows.length}):`);
    currentClasses.rows.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name}`);
    });

    // Check if Spinning already exists
    const existingSpinning = currentClasses.rows.find(cls => cls.name.toLowerCase() === 'spinning');
    if (existingSpinning) {
      console.log('\n⚠️  Spinning class already exists! Skipping creation.');
      return;
    }

    // Create Spinning class type
    console.log('\n🏃 Adding Spinning class type...');
    const classId = generateId() + '-' + generateId() + '-' + generateId() + '-' + generateId() + '-' + generateId();
    
    const newClass = await pool.query(`
      INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name
    `, [classId, SPINNING_CLASS.name, SPINNING_CLASS.description, SPINNING_CLASS.isDefault, SPINNING_CLASS.createdByUserId]);

    console.log(`✅ Created class type: ${newClass.rows[0].name} (${newClass.rows[0].id.slice(0, 8)})`);

    // Add exercises for Spinning class
    console.log('\n🏋️ Adding Spinning exercises...');
    for (let i = 0; i < SPINNING_EXERCISES.length; i++) {
      const exercise = SPINNING_EXERCISES[i];
      const exerciseId = generateId() + '-' + generateId() + '-' + generateId() + '-' + generateId() + '-' + generateId();
      
      await pool.query(`
        INSERT INTO exercises (
          id, name, description, difficulty_level, equipment_needed, 
          primary_muscles, secondary_muscles, category, calories_per_minute, 
          modifications, safety_notes, class_type_id, created_by_user_id, 
          is_public, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      `, [
        exerciseId, exercise.name, exercise.description, exercise.difficultyLevel,
        exercise.equipmentNeeded, exercise.primaryMuscles, exercise.secondaryMuscles,
        exercise.category, exercise.caloriesPerMinute, exercise.modifications,
        exercise.safetyNotes, classId, TEST_USER_ID, true
      ]);
      
      console.log(`  ✅ Added: ${exercise.name}`);
    }

    // Verify final state
    console.log('\n📊 Final verification...');
    const finalClasses = await pool.query(`
      SELECT id, name 
      FROM class_types 
      WHERE created_by_user_id = $1
      ORDER BY name ASC
    `, [TEST_USER_ID]);
    
    const totalExercises = await pool.query(`
      SELECT COUNT(*) as count
      FROM exercises 
      WHERE created_by_user_id = $1
    `, [TEST_USER_ID]);

    console.log('\n🎉 Addition completed successfully!\n');
    console.log(`📋 Final class types (${finalClasses.rows.length}):`);
    finalClasses.rows.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name}`);
    });
    
    console.log(`\n📊 Total exercises: ${totalExercises.rows[0].count}`);
    console.log('✨ Spinning class and exercises successfully added!');
    
  } catch (error) {
    console.error('❌ Failed to add Spinning class:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addSpinningClass();