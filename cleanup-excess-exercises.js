#!/usr/bin/env node
/**
 * Clean up excess exercises - keep only 5 exercises per class type (the original ones we created)
 */

import { Pool } from '@neondatabase/serverless';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

// Original exercise names for each class type (the 5 we want to keep)
const ORIGINAL_EXERCISES = {
  'Yoga': [
    'Downward Facing Dog',
    "Child's Pose", 
    'Warrior I',
    'Warrior II',
    'Tree Pose'
  ],
  'Zumba': [
    'Basic Salsa Step',
    'Merengue March',
    'Reggaeton Bounce', 
    'Cumbia Step',
    'Cha-Cha-Cha'
  ],
  'Spinning/Indoor Cycling': [
    'Seated Flat Road',
    'Standing Climb',
    'Seated Climb',
    'Jumps (Seated to Standing)',
    'Sprints'
  ],
  'HIIT': [
    'Burpees',
    'Mountain Climbers',
    'Jump Squats',
    'High Knees', 
    'Push-ups'
  ],
  'Pilates': [
    'The Hundred',
    'Roll Up',
    'Single Leg Circles',
    'Rolling Like a Ball',
    'Single Leg Stretch'
  ]
};

async function cleanupExcessExercises() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔍 Analyzing exercises by class type...');
    
    // Get all class types and their exercises
    const classTypesQuery = `
      SELECT ct.id, ct.name,
             array_agg(e.id ORDER BY e.created_at ASC) as exercise_ids,
             array_agg(e.name ORDER BY e.created_at ASC) as exercise_names,
             COUNT(e.id) as exercise_count
      FROM class_types ct
      LEFT JOIN exercises e ON ct.id = e.class_type_id
      GROUP BY ct.id, ct.name
      ORDER BY ct.name
    `;
    
    const classTypes = await pool.query(classTypesQuery);
    
    console.log('\n📊 Current exercise counts:');
    classTypes.rows.forEach(ct => {
      const expected = ORIGINAL_EXERCISES[ct.name]?.length || 0;
      const actual = ct.exercise_count;
      const status = actual > expected ? `❌ ${actual - expected} excess` : actual === expected ? '✅ correct' : '⚠️  missing';
      console.log(`  • ${ct.name}: ${actual} exercises (expected ${expected}) - ${status}`);
    });
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      let totalRemoved = 0;
      
      for (const ct of classTypes.rows) {
        const originalExercises = ORIGINAL_EXERCISES[ct.name];
        if (!originalExercises) {
          console.log(`⚠️  No original exercise list for ${ct.name}, skipping...`);
          continue;
        }
        
        const exerciseNames = ct.exercise_names || [];
        const exerciseIds = ct.exercise_ids || [];
        
        if (exerciseNames.length <= originalExercises.length) {
          console.log(`✅ ${ct.name}: Already has correct number of exercises`);
          continue;
        }
        
        console.log(`\n🧹 Cleaning up ${ct.name}:`);
        console.log(`  📊 Current: ${exerciseNames.length} exercises`);
        console.log(`  🎯 Target: ${originalExercises.length} exercises`);
        
        // Find exercises to keep (original ones) and remove (extras)
        const keepExercises = [];
        const removeExerciseIds = [];
        
        // First, try to keep exercises that match our original names
        for (let i = 0; i < exerciseNames.length; i++) {
          const exerciseName = exerciseNames[i];
          const exerciseId = exerciseIds[i];
          
          if (originalExercises.includes(exerciseName) && keepExercises.length < originalExercises.length) {
            keepExercises.push({ name: exerciseName, id: exerciseId });
            console.log(`    ✅ Keeping: ${exerciseName}`);
          } else {
            removeExerciseIds.push(exerciseId);
            console.log(`    ❌ Removing: ${exerciseName}`);
          }
        }
        
        // If we don't have enough matches, keep the first few exercises regardless of name
        if (keepExercises.length < originalExercises.length) {
          const needed = originalExercises.length - keepExercises.length;
          console.log(`    ⚠️  Only found ${keepExercises.length} matching exercises, keeping first ${needed} others`);
          
          // Move some from remove back to keep
          const toKeep = removeExerciseIds.splice(0, needed);
          for (let i = 0; i < toKeep.length; i++) {
            const idx = exerciseIds.indexOf(toKeep[i]);
            keepExercises.push({ name: exerciseNames[idx], id: toKeep[i] });
            console.log(`    ✅ Keeping: ${exerciseNames[idx]}`);
          }
        }
        
        // Remove excess exercises
        if (removeExerciseIds.length > 0) {
          // Remove from routine_exercises first (foreign key constraint)
          const routineExerciseDelete = await pool.query(
            'DELETE FROM routine_exercises WHERE exercise_id = ANY($1)',
            [removeExerciseIds]
          );
          if (routineExerciseDelete.rowCount > 0) {
            console.log(`    🔗 Removed ${routineExerciseDelete.rowCount} routine exercise links`);
          }
          
          // Remove the exercises
          const exerciseDelete = await pool.query(
            'DELETE FROM exercises WHERE id = ANY($1)',
            [removeExerciseIds]
          );
          
          console.log(`    ✅ Removed ${exerciseDelete.rowCount} excess exercises`);
          totalRemoved += exerciseDelete.rowCount;
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log(`\n🎉 Cleanup completed successfully!`);
      console.log(`✅ Removed ${totalRemoved} excess exercises`);
      
      // Show final state
      const finalQuery = `
        SELECT ct.name, COUNT(e.id) as exercise_count
        FROM class_types ct
        LEFT JOIN exercises e ON ct.id = e.class_type_id
        GROUP BY ct.id, ct.name
        ORDER BY ct.name
      `;
      
      const finalState = await pool.query(finalQuery);
      
      console.log('\n📋 Final exercise counts:');
      finalState.rows.forEach(ct => {
        const expected = ORIGINAL_EXERCISES[ct.name]?.length || 0;
        const status = ct.exercise_count === expected ? '✅' : '❌';
        console.log(`  ${status} ${ct.name}: ${ct.exercise_count} exercises`);
      });
      
      const totalExercises = finalState.rows.reduce((sum, ct) => sum + ct.exercise_count, 0);
      console.log(`\n✨ Database now has ${totalExercises} total exercises across 5 class types!`);
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupExcessExercises();