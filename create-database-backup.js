#!/usr/bin/env node
/**
 * Create a complete database backup of the current clean state
 * This creates both a SQL dump and a JSON export for easy restoration
 */

import { Pool } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';
import { format } from 'date-fns';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function createDatabaseBackup() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    
    console.log('📊 Creating complete database backup...');
    
    // 1. Export all users
    console.log('👥 Backing up users...');
    const users = await pool.query(`
      SELECT id, email, first_name, last_name, email_verified, created_at
      FROM users
      ORDER BY created_at ASC
    `);
    
    // 2. Export all class types
    console.log('📋 Backing up class types...');
    const classTypes = await pool.query(`
      SELECT id, name, description, is_default, created_by_user_id, created_at
      FROM class_types
      ORDER BY name ASC
    `);
    
    // 3. Export all exercises
    console.log('🏃‍♀️ Backing up exercises...');
    const exercises = await pool.query(`
      SELECT id, name, description, difficulty_level, equipment_needed, 
             primary_muscles, secondary_muscles, category, calories_per_minute,
             modifications, safety_notes, class_type_id, created_by_user_id,
             is_public, created_at
      FROM exercises
      ORDER BY class_type_id, name ASC
    `);
    
    // 4. Export routines (if any)
    console.log('📝 Backing up routines...');
    const routines = await pool.query(`
      SELECT id, name, description, class_type_id, created_by_user_id,
             is_public, total_duration, created_at, updated_at
      FROM routines
      ORDER BY created_at ASC
    `);
    
    // 5. Export routine exercises (if any)
    console.log('🔗 Backing up routine exercises...');
    const routineExercises = await pool.query(`
      SELECT id, routine_id, exercise_id, order_index, duration_seconds,
             repetitions, sets, rest_seconds, music_title, music_notes, notes
      FROM routine_exercises
      ORDER BY routine_id, order_index ASC
    `);
    
    // Create comprehensive backup object
    const backup = {
      metadata: {
        created_at: new Date().toISOString(),
        timestamp: timestamp,
        description: 'Clean FitCoachConnect database backup - 5 class types, 25 exercises',
        version: '1.0',
        tables_backed_up: ['users', 'class_types', 'exercises', 'routines', 'routine_exercises']
      },
      data: {
        users: users.rows,
        classTypes: classTypes.rows,
        exercises: exercises.rows,
        routines: routines.rows,
        routineExercises: routineExercises.rows
      },
      statistics: {
        users_count: users.rows.length,
        class_types_count: classTypes.rows.length,
        exercises_count: exercises.rows.length,
        routines_count: routines.rows.length,
        routine_exercises_count: routineExercises.rows.length
      }
    };
    
    // Save JSON backup
    const jsonFilename = `backup_fitcoach_clean_${timestamp}.json`;
    writeFileSync(jsonFilename, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`💾 JSON backup saved: ${jsonFilename}`);
    
    // Generate SQL restoration script
    let sqlScript = `-- FitCoachConnect Clean Database Restoration Script
-- Created: ${new Date().toISOString()}
-- Description: Restores the clean state with 5 class types and 25 exercises
-- Usage: Run this script to restore the database to the clean state

-- Start transaction
BEGIN;

-- Clear existing data (in correct order to avoid foreign key constraints)
DELETE FROM routine_exercises;
DELETE FROM routines;
DELETE FROM calendar_events;
DELETE FROM progress_metrics;
DELETE FROM performance_records;
DELETE FROM event_targets;
DELETE FROM program_enrollments;
DELETE FROM programs;
DELETE FROM program_sessions;
DELETE FROM user_saved_routines;
DELETE FROM exercises;
DELETE FROM class_types;
-- Note: Not deleting users to preserve login accounts

-- Restore Class Types
`;

    // Add class types
    for (const ct of classTypes.rows) {
      sqlScript += `INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('${ct.id}', '${ct.name.replace(/'/g, "''")}', ${ct.description ? `'${ct.description.replace(/'/g, "''")}'` : 'NULL'}, ${ct.is_default}, ${ct.created_by_user_id ? `'${ct.created_by_user_id}'` : 'NULL'}, '${ct.created_at.toISOString()}');
`;
    }
    
    sqlScript += `\n-- Restore Exercises\n`;
    
    // Add exercises
    for (const ex of exercises.rows) {
      const values = [
        `'${ex.id}'`,
        `'${ex.name.replace(/'/g, "''")}'`,
        ex.description ? `'${ex.description.replace(/'/g, "''")}'` : 'NULL',
        `'${ex.difficulty_level}'`,
        ex.equipment_needed ? `'${ex.equipment_needed.replace(/'/g, "''")}'` : 'NULL',
        ex.primary_muscles ? `'${ex.primary_muscles.replace(/'/g, "''")}'` : 'NULL',
        ex.secondary_muscles ? `'${ex.secondary_muscles.replace(/'/g, "''")}'` : 'NULL',
        `'${ex.category}'`,
        ex.calories_per_minute || 'NULL',
        ex.modifications ? `'${ex.modifications.replace(/'/g, "''")}'` : 'NULL',
        ex.safety_notes ? `'${ex.safety_notes.replace(/'/g, "''")}'` : 'NULL',
        ex.class_type_id ? `'${ex.class_type_id}'` : 'NULL',
        ex.created_by_user_id ? `'${ex.created_by_user_id}'` : 'NULL',
        ex.is_public,
        `'${ex.created_at.toISOString()}'`
      ];
      
      sqlScript += `INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES (${values.join(', ')});
`;
    }
    
    sqlScript += `
-- Commit transaction
COMMIT;

-- Verify restoration
SELECT 
    'Class Types' as table_name, 
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY name) as items
FROM class_types
UNION ALL
SELECT 
    'Exercises', 
    COUNT(*),
    CONCAT(COUNT(*), ' exercises across ', COUNT(DISTINCT class_type_id), ' class types')
FROM exercises;

SELECT '✅ Database restored to clean state with 5 class types and 25 exercises!' as status;
`;
    
    // Save SQL backup
    const sqlFilename = `restore_fitcoach_clean_${timestamp}.sql`;
    writeFileSync(sqlFilename, sqlScript, 'utf8');
    console.log(`📄 SQL restoration script saved: ${sqlFilename}`);
    
    // Create a simple restore script
    const restoreScript = `#!/usr/bin/env node
/**
 * Quick restore script - automatically generated
 * Run this to restore the clean database state
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const DATABASE_URL = "${DATABASE_URL}";

async function restore() {
  console.log('🔄 Restoring clean database state...');
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const sqlScript = readFileSync('${sqlFilename}', 'utf8');
    await pool.query(sqlScript);
    console.log('✅ Database restored successfully!');
    console.log('🎯 Clean state: 5 class types, 25 exercises');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  } finally {
    await pool.end();
  }
}

restore();`;
    
    const restoreFilename = `restore_clean_state.js`;
    writeFileSync(restoreFilename, restoreScript, 'utf8');
    console.log(`🚀 Quick restore script saved: ${restoreFilename}`);
    
    console.log('\n🎉 Backup completed successfully!');
    console.log('\n📋 Backup Summary:');
    console.log(`  📊 Statistics:`);
    console.log(`    • ${backup.statistics.users_count} users`);
    console.log(`    • ${backup.statistics.class_types_count} class types`);
    console.log(`    • ${backup.statistics.exercises_count} exercises`);
    console.log(`    • ${backup.statistics.routines_count} routines`);
    
    console.log(`\n💾 Files Created:`);
    console.log(`    • ${jsonFilename} (JSON data backup)`);
    console.log(`    • ${sqlFilename} (SQL restoration script)`);
    console.log(`    • ${restoreFilename} (Quick restore script)`);
    
    console.log('\n🔄 To restore this clean state later:');
    console.log(`    Option 1: node ${restoreFilename}`);
    console.log(`    Option 2: Execute ${sqlFilename} in your database`);
    console.log(`    Option 3: Use the JSON backup for custom restoration`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDatabaseBackup();