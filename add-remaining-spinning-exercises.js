#!/usr/bin/env node
/**
 * Add remaining Spinning exercises
 */

import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const TEST_USER_ID = '0c982f0e-6872-4d4b-bc97-a4f217d10d8f';

// Remaining exercises to add (fixing the category)
const REMAINING_EXERCISES = [
  { name: "Recovery Ride", description: "Easy-paced cycling for active recovery", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike", primaryMuscles: "Legs", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Lower resistance further", safetyNotes: "Focus on smooth pedal stroke" },
  { name: "Power Intervals", description: "High resistance intervals for strength building", difficultyLevel: "Advanced", equipmentNeeded: "Stationary bike", primaryMuscles: "Quadriceps, glutes", secondaryMuscles: "Hamstrings, core", category: "strength", caloriesPerMinute: 14, modifications: "Reduce resistance or duration", safetyNotes: "Maintain proper posture throughout" },
  { name: "Cool-Down Stretch", description: "Easy cycling followed by stretching routine", difficultyLevel: "Beginner", equipmentNeeded: "Stationary bike, mat", primaryMuscles: "Full body", secondaryMuscles: "All muscle groups", category: "flexibility", caloriesPerMinute: 3, modifications: "Extend stretching time", safetyNotes: "Hold stretches for 15-30 seconds" }
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

async function addRemainingExercises() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Find the Spinning class type
    const spinningClass = await pool.query(`
      SELECT id, name 
      FROM class_types 
      WHERE created_by_user_id = $1 AND name = 'Spinning'
    `, [TEST_USER_ID]);

    if (spinningClass.rows.length === 0) {
      console.log('❌ Spinning class not found!');
      return;
    }

    const classId = spinningClass.rows[0].id;
    console.log(`✅ Found Spinning class: ${classId.slice(0, 8)}`);

    // Check current exercises
    const currentExercises = await pool.query(`
      SELECT name FROM exercises WHERE class_type_id = $1
    `, [classId]);

    console.log(`Current Spinning exercises: ${currentExercises.rows.length}`);
    currentExercises.rows.forEach(ex => console.log(`  - ${ex.name}`));

    // Add remaining exercises
    console.log('\n🏋️ Adding remaining exercises...');
    for (const exercise of REMAINING_EXERCISES) {
      // Check if exercise already exists
      const existing = currentExercises.rows.find(ex => ex.name === exercise.name);
      if (existing) {
        console.log(`  ⏭️  ${exercise.name} - already exists, skipping`);
        continue;
      }

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

    // Final verification
    const finalExercises = await pool.query(`
      SELECT name FROM exercises WHERE class_type_id = $1 ORDER BY name
    `, [classId]);

    console.log('\n🎉 Success! Final Spinning exercises:');
    finalExercises.rows.forEach((ex, i) => console.log(`  ${i + 1}. ${ex.name}`));
    console.log(`\n✨ Total: ${finalExercises.rows.length} Spinning exercises`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addRemainingExercises();