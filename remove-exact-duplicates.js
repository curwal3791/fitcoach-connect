#!/usr/bin/env node
/**
 * Remove exact duplicate class types, keeping only one of each
 */

import { Pool } from '@neondatabase/serverless';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function removeExactDuplicates() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Find duplicates by grouping by name
    console.log('🔍 Finding duplicate class types...');
    const duplicateQuery = `
      SELECT name, COUNT(*) as count, array_agg(id ORDER BY created_at ASC) as ids
      FROM class_types 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY name
    `;
    
    const duplicates = await pool.query(duplicateQuery);
    
    console.log(`\n📊 Found ${duplicates.rows.length} sets of duplicates:`);
    duplicates.rows.forEach(duplicate => {
      console.log(`  • ${duplicate.name}: ${duplicate.count} copies`);
    });
    
    if (duplicates.rows.length === 0) {
      console.log('\n✨ No duplicates found!');
      return;
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      let totalRemoved = 0;
      
      for (const duplicate of duplicates.rows) {
        const [keepId, ...removeIds] = duplicate.ids;
        
        console.log(`\n🧹 Cleaning up "${duplicate.name}":`);
        console.log(`  ✅ Keeping ID: ${keepId}`);
        console.log(`  ❌ Removing ${removeIds.length} duplicates`);
        
        // For each duplicate ID to remove
        for (const removeId of removeIds) {
          console.log(`    🗑️  Removing duplicate ${removeId}:`);
          
          // First migrate any related data to the kept record
          // Update exercises to point to the kept class type
          const exerciseUpdate = await pool.query(
            'UPDATE exercises SET class_type_id = $1 WHERE class_type_id = $2',
            [keepId, removeId]
          );
          if (exerciseUpdate.rowCount > 0) {
            console.log(`      • Migrated ${exerciseUpdate.rowCount} exercises to kept record`);
          }
          
          // Update routines to point to the kept class type
          const routineUpdate = await pool.query(
            'UPDATE routines SET class_type_id = $1 WHERE class_type_id = $2',
            [keepId, removeId]
          );
          if (routineUpdate.rowCount > 0) {
            console.log(`      • Migrated ${routineUpdate.rowCount} routines to kept record`);
          }
          
          // Update calendar events to point to the kept class type
          const eventUpdate = await pool.query(
            'UPDATE calendar_events SET class_type_id = $1 WHERE class_type_id = $2',
            [keepId, removeId]
          );
          if (eventUpdate.rowCount > 0) {
            console.log(`      • Migrated ${eventUpdate.rowCount} calendar events to kept record`);
          }
          
          // Update programs to point to the kept class type
          const programUpdate = await pool.query(
            'UPDATE programs SET class_type_id = $1 WHERE class_type_id = $2',
            [keepId, removeId]
          );
          if (programUpdate.rowCount > 0) {
            console.log(`      • Migrated ${programUpdate.rowCount} programs to kept record`);
          }
          
          // Now remove the duplicate class type
          const deleteResult = await pool.query(
            'DELETE FROM class_types WHERE id = $1',
            [removeId]
          );
          
          if (deleteResult.rowCount > 0) {
            console.log(`      ✅ Removed duplicate class type`);
            totalRemoved++;
          }
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log(`\n🎉 Cleanup completed successfully!`);
      console.log(`✅ Removed ${totalRemoved} duplicate class types`);
      
      // Show final state
      const finalClasses = await pool.query(`
        SELECT name, is_default, created_at,
               (SELECT COUNT(*) FROM exercises WHERE class_type_id = class_types.id) as exercise_count
        FROM class_types 
        ORDER BY name ASC
      `);
      
      console.log('\n📋 Final class types:');
      finalClasses.rows.forEach((cls, index) => {
        console.log(`  ${index + 1}. ${cls.name} (${cls.exercise_count} exercises)`);
      });
      
      console.log(`\n✨ Database now has exactly ${finalClasses.rows.length} unique class types!`);
      
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

removeExactDuplicates();