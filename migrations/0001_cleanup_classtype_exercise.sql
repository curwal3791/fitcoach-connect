-- Migration: 0001_cleanup_classtype_exercise.sql
-- Description: Clean up Class Type and Exercise databases and recreate them fresh
-- Author: Claude
-- Created: 2025-08-30

-- Start transaction to ensure atomicity
BEGIN;

-- Step 1: Drop dependent tables first (in order of dependencies)
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
DROP TABLE IF EXISTS program_sessions CASCADE;

-- Drop the main tables
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS class_types CASCADE;

-- Drop related enums
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS exercise_category CASCADE;

-- Step 2: Recreate the enums
CREATE TYPE difficulty_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE exercise_category AS ENUM ('strength', 'cardio', 'flexibility', 'balance');

-- Step 3: Recreate class_types table
CREATE TABLE class_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_by_user_id VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Recreate exercises table
CREATE TABLE exercises (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level difficulty_level NOT NULL,
    equipment_needed TEXT,
    primary_muscles TEXT,
    secondary_muscles TEXT,
    category exercise_category NOT NULL,
    calories_per_minute INTEGER,
    modifications TEXT,
    safety_notes TEXT,
    image_url VARCHAR,
    video_url VARCHAR,
    class_type_id VARCHAR REFERENCES class_types(id),
    created_by_user_id VARCHAR REFERENCES users(id),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Recreate routines table
CREATE TABLE routines (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    class_type_id VARCHAR REFERENCES class_types(id),
    created_by_user_id VARCHAR NOT NULL REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    total_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Recreate routine_exercises junction table
CREATE TABLE routine_exercises (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id VARCHAR NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id VARCHAR NOT NULL REFERENCES exercises(id),
    order_index INTEGER NOT NULL,
    duration_seconds INTEGER,
    repetitions INTEGER,
    sets INTEGER,
    rest_seconds INTEGER,
    music_title VARCHAR,
    music_notes TEXT,
    notes TEXT
);

-- Step 7: Recreate calendar_events table
CREATE TABLE calendar_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    class_type_id VARCHAR REFERENCES class_types(id),
    routine_id VARCHAR REFERENCES routines(id),
    title VARCHAR(200) NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    location VARCHAR,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,
    capacity INTEGER,
    allow_waitlist BOOLEAN DEFAULT FALSE,
    session_status VARCHAR DEFAULT 'scheduled',
    session_started_at TIMESTAMP,
    session_completed_at TIMESTAMP,
    session_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 8: Recreate user_saved_routines table
CREATE TABLE user_saved_routines (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    routine_id VARCHAR NOT NULL REFERENCES routines(id),
    saved_at TIMESTAMP DEFAULT NOW()
);

-- Step 9: Recreate program management tables
CREATE TABLE programs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description VARCHAR,
    goal VARCHAR,
    duration_weeks INTEGER NOT NULL,
    class_type_id VARCHAR REFERENCES class_types(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE program_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id VARCHAR NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    routine_id VARCHAR REFERENCES routines(id),
    session_name VARCHAR,
    base_params JSONB,
    progression_rule JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE program_enrollments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id VARCHAR NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    client_id VARCHAR REFERENCES clients(id),
    class_type_id VARCHAR REFERENCES class_types(id),
    start_date TIMESTAMP NOT NULL,
    current_week INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    enrolled_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_targets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    routine_exercise_id VARCHAR REFERENCES routine_exercises(id),
    targets JSONB,
    is_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE progress_metrics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    exercise_id VARCHAR REFERENCES exercises(id),
    routine_id VARCHAR REFERENCES routines(id),
    event_id VARCHAR REFERENCES calendar_events(id),
    routine_exercise_id VARCHAR REFERENCES routine_exercises(id),
    metric_type VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    unit VARCHAR,
    rpe INTEGER,
    notes VARCHAR,
    recorded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES calendar_events(id),
    client_id VARCHAR NOT NULL REFERENCES clients(id),
    exercise_id VARCHAR NOT NULL REFERENCES exercises(id),
    routine_exercise_id VARCHAR REFERENCES routine_exercises(id),
    actual JSONB,
    notes VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 10: Create indexes for better performance
CREATE INDEX idx_class_types_created_by ON class_types(created_by_user_id);
CREATE INDEX idx_exercises_class_type ON exercises(class_type_id);
CREATE INDEX idx_exercises_created_by ON exercises(created_by_user_id);
CREATE INDEX idx_routines_class_type ON routines(class_type_id);
CREATE INDEX idx_routines_created_by ON routines(created_by_user_id);
CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_exercise ON routine_exercises(exercise_id);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_class_type ON calendar_events(class_type_id);
CREATE INDEX idx_progress_client_date ON progress_metrics(client_id, recorded_at);
CREATE INDEX idx_progress_exercise ON progress_metrics(exercise_id);
CREATE INDEX idx_progress_event ON progress_metrics(event_id);

-- Commit the transaction
COMMIT;

-- Success message
SELECT 'Class Type and Exercise databases have been successfully cleaned and recreated!' as result;