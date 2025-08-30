#!/usr/bin/env node
/**
 * Migration runner script with DATABASE_URL included
 * This will clean and recreate Class Type and Exercise databases
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function runMigration() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Starting Class Type and Exercise database cleanup and recreation...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'migrations', '0001_cleanup_classtype_exercise.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration: 0001_cleanup_classtype_exercise.sql');
    
    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Results:', result.rows?.[0] || 'Database cleaned and recreated');
    
    console.log('\n🔄 Summary of actions taken:');
    console.log('  • Dropped all Class Type and Exercise related tables');
    console.log('  • Recreated clean Class Type and Exercise tables');
    console.log('  • Restored all related tables (routines, calendar_events, etc.)');
    console.log('  • Added proper indexes for performance');
    console.log('\n✨ Your Class Type and Exercise databases are now clean and ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n🔍 This might be due to:');
    console.error('  • Network connectivity issues');
    console.error('  • Database permissions');
    console.error('  • Invalid SQL in migration file');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();