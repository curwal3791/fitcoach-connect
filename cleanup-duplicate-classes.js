#!/usr/bin/env node
/**
 * Cleanup script to remove duplicate class types and keep only the 5 original ones
 */

import { Pool } from '@neondatabase/serverless';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

// The 5 class types we want to keep (original ones you specified)
const KEEP_CLASS_TYPES = [
  'Yoga',
  'Zumba', 
  'Spinning/Indoor Cycling',
  'HIIT',
  'Pilates'
];

async function cleanupDuplicateClasses() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // First, let's see all class types
    console.log('📋 Checking all class types...');
    const allClasses = await pool.query(`
      SELECT id, name, is_default, created_by_user_id, created_at 
      FROM class_types 
      ORDER BY created_at ASC
    `);
    
    console.log(`\n📊 Found ${allClasses.rows.length} class types total:`);
    allClasses.rows.forEach((cls, index) => {
      const isKeep = KEEP_CLASS_TYPES.includes(cls.name);
      const marker = isKeep ? '✅ KEEP' : '❌ REMOVE';
      console.log(`  ${index + 1}. ${cls.name} (${cls.is_default ? 'Default' : 'Custom'}) - ${marker}`);
    });

    // Find class types to keep and to remove
    const classesToKeep = allClasses.rows.filter(cls => KEEP_CLASS_TYPES.includes(cls.name));
    const classesToRemove = allClasses.rows.filter(cls => !KEEP_CLASS_TYPES.includes(cls.name));
    
    console.log(`\n🎯 Plan:`);
    console.log(`  ✅ Keep: ${classesToKeep.length} class types`);
    console.log(`  ❌ Remove: ${classesToRemove.length} class types`);
    
    if (classesToRemove.length === 0) {
      console.log('\n✨ No cleanup needed! Database is already clean.');
      return;
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      // Remove dependent data first
      console.log('\n🧹 Cleaning up dependent data...');
      
      for (const cls of classesToRemove) {
        console.log(`  🗑️  Removing data for: ${cls.name}`);
        
        // Remove exercises for this class type
        const exerciseResult = await pool.query(
          'DELETE FROM exercises WHERE class_type_id = $1',
          [cls.id]
        );
        console.log(`    • Removed ${exerciseResult.rowCount} exercises`);
        
        // Remove routines for this class type  
        const routineResult = await pool.query(
          'DELETE FROM routines WHERE class_type_id = $1',
          [cls.id]
        );
        console.log(`    • Removed ${routineResult.rowCount} routines`);
        
        // Remove calendar events for this class type
        const eventResult = await pool.query(
          'DELETE FROM calendar_events WHERE class_type_id = $1',
          [cls.id]
        );
        console.log(`    • Removed ${eventResult.rowCount} calendar events`);
        
        // Remove programs for this class type
        const programResult = await pool.query(
          'DELETE FROM programs WHERE class_type_id = $1',
          [cls.id]
        );
        console.log(`    • Removed ${programResult.rowCount} programs`);
      }
      
      // Now remove the class types themselves
      console.log('\n🗑️  Removing duplicate class types...');
      const classIds = classesToRemove.map(cls => cls.id);
      
      const deleteResult = await pool.query(
        `DELETE FROM class_types WHERE id = ANY($1)`,
        [classIds]
      );
      
      console.log(`    ✅ Removed ${deleteResult.rowCount} duplicate class types`);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log('\n🎉 Cleanup completed successfully!');
      
      // Show final state
      const finalClasses = await pool.query(`
        SELECT name, is_default, created_at 
        FROM class_types 
        ORDER BY name ASC
      `);
      
      console.log('\n📋 Final class types:');
      finalClasses.rows.forEach((cls, index) => {
        console.log(`  ${index + 1}. ${cls.name} (${cls.is_default ? 'Default' : 'Custom'})`);
      });
      
      console.log(`\n✨ Database now has exactly ${finalClasses.rows.length} class types - the 5 you specified!`);
      
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

cleanupDuplicateClasses();