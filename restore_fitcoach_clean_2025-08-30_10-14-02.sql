-- FitCoachConnect Clean Database Restoration Script
-- Created: 2025-08-30T15:14:03.689Z
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
INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('a5972625-6c08-426d-99ea-6807b872a5ac', 'HIIT', 'A time-efficient workout method alternating between short bursts of intense exercise and brief recovery periods to maximize calorie burn and improve cardiovascular fitness.', true, NULL, '2025-08-30T19:26:29.414Z');
INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('0a34553b-5b07-483d-bbb1-fb56063e0093', 'Pilates', 'A low-impact exercise method focusing on core strength, flexibility, and body awareness through controlled, precise movements and proper breathing techniques.', true, NULL, '2025-08-30T19:26:29.483Z');
INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('d76daaa0-57fe-49ce-9416-66518ff2ddb2', 'Spinning/Indoor Cycling', 'An intense cardiovascular workout performed on stationary bikes, featuring music-driven sessions with varied resistance and speed to simulate outdoor cycling conditions.', true, NULL, '2025-08-30T19:26:29.360Z');
INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('0c35993c-aea0-4700-9420-5e0cfbdc57b4', 'Yoga', 'A mind-body practice combining physical postures, breathing techniques, and meditation to improve flexibility, strength, balance, and mental well-being.', true, NULL, '2025-08-30T19:26:29.187Z');
INSERT INTO class_types (id, name, description, is_default, created_by_user_id, created_at) 
VALUES ('354f249a-3ca2-448b-b452-8ad978e18423', 'Zumba', 'A high-energy dance fitness program that combines Latin and international music with dance moves, creating a fun, party-like atmosphere while providing an effective cardio workout.', true, NULL, '2025-08-30T19:26:29.301Z');

-- Restore Exercises
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('ff60a6da-b531-46c4-959e-3be96c655859', 'Roll Up', 'Slowly rolling up from lying to seated position using core control', 'Intermediate', 'Pilates mat', 'Core, abdominals, hip flexors', 'Spine, back', 'flexibility', 4, 'Bend knees, use hands for assistance, partial roll up', 'Move slowly and controlled, don''t force the movement', '0a34553b-5b07-483d-bbb1-fb56063e0093', NULL, true, '2025-08-30T19:26:30.854Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('fa4815fe-1f83-4b48-af65-3bdc2d043a39', 'Rolling Like a Ball', 'Balancing on tailbone and rolling backward and forward', 'Intermediate', 'Pilates mat', 'Core, abdominals, back', 'Hip flexors, spine', 'balance', 4, 'Hold behind thighs, smaller rolling motion, rock gently', 'Keep chin to chest, control the roll, avoid rolling on neck', '0a34553b-5b07-483d-bbb1-fb56063e0093', NULL, true, '2025-08-30T19:26:30.981Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('e6ddb968-d605-4cd3-a3a4-0843b1f343aa', 'Single Leg Circles', 'Lying down, drawing circles in the air with one extended leg', 'Beginner', 'Pilates mat', 'Hip flexors, core, glutes', 'Inner thighs, outer thighs', 'flexibility', 3, 'Smaller circles, bend supporting leg, hold thigh for support', 'Keep hips stable, control the movement, don''t let back arch', '0a34553b-5b07-483d-bbb1-fb56063e0093', NULL, true, '2025-08-30T19:26:30.918Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('82d2b784-2744-4c58-b48f-42bed41f079a', 'Single Leg Stretch', 'Alternating knee-to-chest pulls while extending the opposite leg', 'Beginner', 'Pilates mat', 'Core, hip flexors', 'Glutes, hamstrings', 'flexibility', 5, 'Keep head down, higher leg extension, slower pace', 'Keep lower back pressed into mat, switch legs smoothly', '0a34553b-5b07-483d-bbb1-fb56063e0093', NULL, true, '2025-08-30T19:26:31.042Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('1b752a64-16e1-4a52-bc2c-c9a756a04962', 'The Hundred', 'Lying on back, pumping arms while holding legs in tabletop position', 'Intermediate', 'Pilates mat', 'Core, abdominals', 'Hip flexors, arms', 'strength', 5, 'Keep head down, bend knees, reduce arm pumping', 'Keep lower back pressed into mat, breathe rhythmically', '0a34553b-5b07-483d-bbb1-fb56063e0093', NULL, true, '2025-08-30T19:26:30.796Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('41d8aa45-add3-4fb1-b0a8-2e93c304ba8e', 'Child''s Pose', 'A resting pose kneeling with arms extended forward and forehead on the ground', 'Beginner', 'Yoga mat', 'Lower back, hips', 'Shoulders, arms', 'flexibility', 1, 'Place pillow under forehead, widen knees for more comfort', 'Avoid if you have knee injuries, can sit on heels if more comfortable', '0c35993c-aea0-4700-9420-5e0cfbdc57b4', NULL, true, '2025-08-30T19:26:29.636Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('571e784d-0a37-4953-899b-4ce94a28035f', 'Downward Facing Dog', 'An inverted V-shape pose with hands and feet on the ground, stretching the entire body', 'Beginner', 'Yoga mat', 'Full body, core, shoulders, hamstrings', 'Arms, calves, back', 'flexibility', 3, 'Place forearms on ground for easier variation, use blocks under hands for support', 'Keep slight bend in knees if hamstrings are tight, avoid if you have wrist injuries', '0c35993c-aea0-4700-9420-5e0cfbdc57b4', NULL, true, '2025-08-30T19:26:29.544Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('8b70adfe-0daf-4c3d-a907-c4b6f9549faf', 'Tree Pose', 'A standing balance pose with one foot placed on the opposite leg''s thigh or calf', 'Intermediate', 'Yoga mat', 'Core, legs', 'Ankles, feet', 'balance', 3, 'Hold wall for support, place foot on ankle instead of calf/thigh', 'Never place foot on side of knee, use wall or chair for balance if needed', '0c35993c-aea0-4700-9420-5e0cfbdc57b4', NULL, true, '2025-08-30T19:26:29.812Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('9dbbe198-94f7-4cb2-85d5-3e7822fb32c6', 'Warrior I', 'A standing lunge pose with arms raised overhead, building strength and stability', 'Intermediate', 'Yoga mat', 'Legs, glutes, core', 'Arms, shoulders, back', 'strength', 4, 'Use blocks under hands, shorten stance for easier balance', 'Keep front knee aligned over ankle, avoid if you have hip injuries', '0c35993c-aea0-4700-9420-5e0cfbdc57b4', NULL, true, '2025-08-30T19:26:29.697Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('019b216e-6238-49c1-a4be-da535059237e', 'Warrior II', 'A wide-legged stance with arms extended parallel to the ground, opening the hips', 'Intermediate', 'Yoga mat', 'Legs, glutes, core', 'Arms, shoulders', 'strength', 4, 'Place forearm on front thigh for support, use wall for balance', 'Keep front knee tracking over ankle, don''t let knee cave inward', '0c35993c-aea0-4700-9420-5e0cfbdc57b4', NULL, true, '2025-08-30T19:26:29.758Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('10174ad7-1a94-4b77-bffc-9ab174342f5e', 'Basic Salsa Step', 'A rhythmic step-together-step pattern moving side to side with hip action', 'Beginner', 'None', 'Legs, glutes, core', 'Calves, hip flexors', 'cardio', 8, 'Reduce hip movement, step in place instead of side to side', 'Wear proper dance shoes, keep movements controlled', '354f249a-3ca2-448b-b452-8ad978e18423', NULL, true, '2025-08-30T19:26:29.866Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('b1235d83-75a9-488c-8590-0bb94dde14f2', 'Cha-Cha-Cha', 'A quick triple-step pattern with a rock step, creating a lively rhythm', 'Intermediate', 'None', 'Legs, calves, core', 'Ankles, hip flexors', 'cardio', 8, 'Slow down the tempo, simplify footwork', 'Start slowly to learn the pattern, keep movements light and quick', '354f249a-3ca2-448b-b452-8ad978e18423', NULL, true, '2025-08-30T19:26:30.114Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('cd6c75e3-fe0f-46fb-9dbd-2cbecef77fad', 'Cumbia Step', 'A side-to-side stepping pattern with a slight rocking motion', 'Beginner', 'None', 'Legs, core, hips', 'Calves, glutes', 'cardio', 7, 'Smaller steps, less hip movement', 'Keep weight centered, avoid overextending steps', '354f249a-3ca2-448b-b452-8ad978e18423', NULL, true, '2025-08-30T19:26:30.051Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('76c75489-4e60-410a-beee-6d03ae34a19c', 'Merengue March', 'A simple marching step in place with alternating knee lifts and arm swings', 'Beginner', 'None', 'Legs, core', 'Arms, shoulders', 'cardio', 7, 'Lower knee lifts, reduce arm movement', 'Land softly on balls of feet, maintain good posture', '354f249a-3ca2-448b-b452-8ad978e18423', NULL, true, '2025-08-30T19:26:29.928Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('dc4ca698-aa64-49c9-83bd-7fae91daba20', 'Reggaeton Bounce', 'A bouncing movement with bent knees and rhythmic up-and-down motion', 'Beginner', 'None', 'Legs, glutes, calves', 'Core, ankles', 'cardio', 9, 'Reduce bounce height, hold onto something for balance', 'Keep knees soft, land on balls of feet to reduce impact', '354f249a-3ca2-448b-b452-8ad978e18423', NULL, true, '2025-08-30T19:26:29.988Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('f39d7e3f-a461-420e-a191-bd6d46889a78', 'Burpees', 'A full-body movement combining a squat, plank, push-up, and jump', 'Advanced', 'None', 'Full body, core, legs, chest', 'Arms, shoulders, back', 'cardio', 15, 'Step back instead of jumping, remove push-up, no jump at the end', 'Land softly, maintain good form throughout, modify as needed', 'a5972625-6c08-426d-99ea-6807b872a5ac', NULL, true, '2025-08-30T19:26:30.486Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('d47c13ba-afa3-46ba-9fed-ee2b715d4d26', 'High Knees', 'Running in place while lifting knees as high as possible', 'Beginner', 'None', 'Hip flexors, quadriceps, calves', 'Core, glutes', 'cardio', 10, 'Lower knee height, marching in place instead of running', 'Land on balls of feet, maintain good posture, pump arms naturally', 'a5972625-6c08-426d-99ea-6807b872a5ac', NULL, true, '2025-08-30T19:26:30.665Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('dc0b8f08-ad54-45fd-968d-d2b0ffb9f00d', 'Jump Squats', 'Squatting down and explosively jumping up, landing softly', 'Intermediate', 'None', 'Quadriceps, glutes, hamstrings', 'Calves, core', 'strength', 13, 'Regular squats without jumping, smaller jump height', 'Land softly on balls of feet, keep knees aligned, proper squat form', 'a5972625-6c08-426d-99ea-6807b872a5ac', NULL, true, '2025-08-30T19:26:30.612Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('a2c91559-6c59-4650-9b2d-53de55aeda3d', 'Mountain Climbers', 'A plank position with alternating knee drives toward the chest', 'Intermediate', 'None', 'Core, shoulders, legs', 'Arms, glutes, cardiovascular system', 'cardio', 12, 'Slow down the pace, place hands on elevated surface', 'Maintain plank position, keep hips level, engage core', 'a5972625-6c08-426d-99ea-6807b872a5ac', NULL, true, '2025-08-30T19:26:30.548Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('60c1780e-3d9c-4dd1-b753-c23ffd0da034', 'Push-ups', 'A classic upper body exercise lowering and pressing the body up from the ground', 'Intermediate', 'None', 'Chest, shoulders, triceps', 'Core, back', 'strength', 8, 'Knee push-ups, wall push-ups, incline push-ups', 'Keep body in straight line, lower slowly, full range of motion', 'a5972625-6c08-426d-99ea-6807b872a5ac', NULL, true, '2025-08-30T19:26:30.733Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('f1e156f6-f61b-463b-9acb-900ddbad7758', 'Jumps (Seated to Standing)', 'Alternating between seated and standing positions in rhythm', 'Intermediate', 'Stationary bike, cycling shoes (optional)', 'Full body, core, legs', 'Arms, shoulders', 'cardio', 14, 'Longer intervals between position changes, lower resistance', 'Smooth transitions, engage core, maintain bike control', 'd76daaa0-57fe-49ce-9416-66518ff2ddb2', NULL, true, '2025-08-30T19:26:30.360Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('49b59b4f-3ec0-4231-b269-1e40ad3cc4a7', 'Seated Climb', 'Seated pedaling with increased resistance to build leg strength', 'Beginner', 'Stationary bike, cycling shoes (optional)', 'Quadriceps, hamstrings, glutes', 'Calves, core', 'strength', 13, 'Moderate resistance increase, maintain comfortable cadence', 'Keep upper body relaxed, don''t grip handlebars too tightly', 'd76daaa0-57fe-49ce-9416-66518ff2ddb2', NULL, true, '2025-08-30T19:26:30.297Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('255332c0-bc2a-4914-931e-bb7eda0279d4', 'Seated Flat Road', 'Basic seated pedaling position with moderate resistance for endurance building', 'Beginner', 'Stationary bike, cycling shoes (optional)', 'Quadriceps, hamstrings, calves', 'Glutes, core', 'cardio', 12, 'Lower resistance, slower cadence', 'Proper bike fit essential, maintain good posture, stay hydrated', 'd76daaa0-57fe-49ce-9416-66518ff2ddb2', NULL, true, '2025-08-30T19:26:30.175Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('90082242-2bf5-4004-97c0-6aa13ce99889', 'Sprints', 'High-speed pedaling with moderate resistance for short bursts', 'Advanced', 'Stationary bike, cycling shoes (optional)', 'Quadriceps, hamstrings, calves', 'Glutes, core, cardiovascular system', 'cardio', 18, 'Shorter sprint intervals, lower resistance', 'Proper warm-up essential, maintain control, cool down properly', 'd76daaa0-57fe-49ce-9416-66518ff2ddb2', NULL, true, '2025-08-30T19:26:30.423Z');
INSERT INTO exercises (id, name, description, difficulty_level, equipment_needed, primary_muscles, secondary_muscles, category, calories_per_minute, modifications, safety_notes, class_type_id, created_by_user_id, is_public, created_at) 
VALUES ('2e1544ac-21a3-4949-a694-e6a4109ded37', 'Standing Climb', 'Pedaling while standing with high resistance to simulate uphill cycling', 'Intermediate', 'Stationary bike, cycling shoes (optional)', 'Quadriceps, glutes, hamstrings', 'Core, calves, upper body', 'strength', 15, 'Lower resistance, shorter duration', 'Engage core, don''t bounce, maintain controlled movement', 'd76daaa0-57fe-49ce-9416-66518ff2ddb2', NULL, true, '2025-08-30T19:26:30.236Z');

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
