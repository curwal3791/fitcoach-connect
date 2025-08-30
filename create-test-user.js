#!/usr/bin/env node
/**
 * Create a test user for authentication testing
 */

import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Set the DATABASE_URL directly
const DATABASE_URL = "postgresql://neondb_owner:npg_1cqXWMhnH8kp@ep-lively-sky-af108gbp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function createTestUser() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // First, let's see what users exist
    console.log('👥 Checking existing users...');
    const existingUsers = await pool.query('SELECT id, email, first_name, last_name FROM users');
    
    console.log(`Found ${existingUsers.rows.length} existing users:`);
    existingUsers.rows.forEach(user => {
      console.log(`  • ${user.email} (${user.first_name} ${user.last_name})`);
    });

    // Create a test user
    const testEmail = 'test@fitcoach.com';
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    console.log('\n🆕 Creating test user...');
    
    // Check if test user already exists
    const existingTest = await pool.query('SELECT id, email FROM users WHERE email = $1', [testEmail]);
    
    if (existingTest.rows.length > 0) {
      console.log(`✅ Test user already exists: ${testEmail}`);
      console.log('You can log in with:');
      console.log(`  📧 Email: ${testEmail}`);
      console.log(`  🔑 Password: ${testPassword}`);
    } else {
      // Create the test user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, email_verified) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, first_name, last_name`,
        [testEmail, hashedPassword, 'Test', 'User', true]
      );
      
      const newUser = result.rows[0];
      console.log(`✅ Test user created successfully!`);
      console.log(`  👤 Name: ${newUser.first_name} ${newUser.last_name}`);
      console.log(`  📧 Email: ${newUser.email}`);
      console.log(`  🆔 ID: ${newUser.id}`);
      
      console.log('\n🔑 Login Credentials:');
      console.log(`  📧 Email: ${testEmail}`);
      console.log(`  🔑 Password: ${testPassword}`);
    }
    
    console.log('\n🎯 You can now log in to the application at http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUser();