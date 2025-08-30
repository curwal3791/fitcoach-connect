-- SQL Script to drop Class Type and Exercise tables and their dependencies
-- This script will clean up the database so we can recreate these tables fresh

-- Start transaction to ensure atomicity
BEGIN;

-- Drop dependent tables first (in order of dependencies)

-- Drop tables that reference exercises
DROP TABLE IF EXISTS routine_exercises CASCADE;
DROP TABLE IF EXISTS progress_metrics CASCADE;
DROP TABLE IF EXISTS performance_records CASCADE;
DROP TABLE IF EXISTS event_targets CASCADE;

-- Drop tables that reference routines (which reference class_types)
DROP TABLE IF EXISTS user_saved_routines CASCADE;

-- Drop tables that reference class_types
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS routines CASCADE;
DROP TABLE IF EXISTS program_enrollments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

-- Drop the main tables
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS class_types CASCADE;

-- Drop related enums
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS exercise_category CASCADE;

-- Commit the transaction
COMMIT;

-- Verification: List remaining tables (optional)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;