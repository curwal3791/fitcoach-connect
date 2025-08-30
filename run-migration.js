#!/usr/bin/env node
/**
 * Migration runner script to clean and recreate Class Type and Exercise databases
 * Usage: node run-migration.js
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Please set your DATABASE_URL and try again.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
    console.error('\n🔍 This might be due to:');
    console.error('  • Invalid DATABASE_URL');
    console.error('  • Network connectivity issues');
    console.error('  • Database permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();