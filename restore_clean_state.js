#!/usr/bin/env node
/**
 * Quick restore script - automatically generated
 * Run this to restore the clean database state
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function restore() {
  console.log('🔄 Restoring clean database state...');
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const sqlScript = readFileSync('restore_fitcoach_clean_2025-08-30_10-14-02.sql', 'utf8');
    await pool.query(sqlScript);
    console.log('✅ Database restored successfully!');
    console.log('🎯 Clean state: 5 class types, 25 exercises');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  } finally {
    await pool.end();
  }
}

restore();