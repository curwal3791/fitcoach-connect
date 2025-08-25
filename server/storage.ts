import {
  users,
  classTypes,
  exercises,
  routines,
  routineExercises,
  calendarEvents,
  userSavedRoutines,
  clients,
  clientNotes,
  attendance,
  progressMetrics,
  programs,
  programSessions,
  programEnrollments,
  eventTargets,
  readinessChecks,
  performanceRecords,
  type User,
  type UpsertUser,
  type ClassType,
  type Exercise,
  type Routine,
  type RoutineExercise,
  type CalendarEvent,
  type UserSavedRoutine,
  type Client,
  type ClientNote,
  type Attendance,
  type ProgressMetric,
  type Program,
  type ProgramSession,
  type ProgramEnrollment,
  type EventTarget,
  type ReadinessCheck,
  type PerformanceRecord,
  type InsertClassType,
  type InsertExercise,
  type InsertRoutine,
  type InsertRoutineExercise,
  type InsertCalendarEvent,
  type InsertUserSavedRoutine,
  type InsertClient,
  type InsertClientNote,
  type InsertAttendance,
  type InsertProgressMetric,
  type InsertProgram,
  type InsertProgramSession,
  type InsertProgramEnrollment,
  type InsertEventTarget,
  type InsertReadinessCheck,
  type InsertPerformanceRecord,
  eventClients,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; passwordHash: string; firstName?: string; lastName?: string; emailVerified?: boolean }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Class Type operations
  getClassTypes(userId?: string): Promise<ClassType[]>;
  createClassType(classType: InsertClassType): Promise<ClassType>;
  updateClassType(id: string, classType: Partial<InsertClassType>): Promise<ClassType>;
  deleteClassType(id: string): Promise<void>;
  createDefaultExercisesForClass(classType: ClassType, userId: string): Promise<void>;

  // Exercise operations
  getExercises(filters?: {
    search?: string;
    category?: string;
    difficulty?: string;
    equipment?: string;
    classType?: string;
    userId?: string;
  }): Promise<(Exercise & { classType?: ClassType })[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;

  // Routine operations
  getRoutines(userId: string): Promise<(Routine & { classType?: ClassType; exerciseCount: number })[]>;
  getRoutine(id: string): Promise<Routine | undefined>;
  getRoutineWithExercises(id: string): Promise<(Routine & { 
    classType?: ClassType; 
    exercises: (RoutineExercise & { exercise: Exercise })[] 
  }) | undefined>;
  createRoutine(routine: InsertRoutine): Promise<Routine>;
  updateRoutine(id: string, routine: Partial<InsertRoutine>): Promise<Routine>;
  deleteRoutine(id: string): Promise<void>;
  duplicateRoutine(id: string, newName: string, userId: string): Promise<Routine>;

  // Routine Exercise operations
  getRoutineExercises(routineId: string): Promise<(RoutineExercise & { exercise: Exercise })[]>;
  addExerciseToRoutine(routineExercise: InsertRoutineExercise): Promise<RoutineExercise>;
  updateRoutineExercise(id: string, routineExercise: Partial<InsertRoutineExercise>): Promise<RoutineExercise>;
  removeExerciseFromRoutine(id: string): Promise<void>;
  reorderRoutineExercises(routineId: string, exerciseIds: string[]): Promise<void>;

  // Calendar operations
  getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<(CalendarEvent & { classType?: ClassType; routine?: Routine })[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;

  // Community operations
  getCommunityRoutines(filters?: { search?: string; classType?: string }): Promise<(Routine & { 
    classType?: ClassType; 
    createdBy: User;
    exerciseCount: number 
  })[]>;
  saveRoutine(userId: string, routineId: string): Promise<UserSavedRoutine>;
  unsaveRoutine(userId: string, routineId: string): Promise<void>;
  getUserSavedRoutines(userId: string): Promise<(UserSavedRoutine & { routine: Routine & { classType?: ClassType } })[]>;

  // Dashboard stats
  getUserStats(userId: string): Promise<{
    totalRoutines: number;
    totalExercises: number;
    weeklyClasses: number;
    avgDuration: number;
    classTypes: number;
  }>;

  // Analytics operations
  getAnalyticsData(userId: string): Promise<{
    weeklyActivity: Array<{ week: string; routines: number; classes: number }>;
    popularExercises: Array<{ name: string; count: number; category: string }>;
    classTypeDistribution: Array<{ name: string; count: number; percentage: number }>;
    monthlyTrends: Array<{ month: string; totalMinutes: number; avgDuration: number }>;
  }>;

  // Client Management operations
  getClients(trainerId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Client Notes operations
  getClientNotes(clientId: string): Promise<ClientNote[]>;
  createClientNote(note: InsertClientNote): Promise<ClientNote>;
  deleteClientNote(id: string): Promise<void>;

  // Attendance operations
  getAttendanceForEvent(eventId: string): Promise<(Attendance & { client: Client })[]>;
  getClientAttendance(clientId: string, limit?: number): Promise<(Attendance & { event: CalendarEvent })[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;

  // Progress Metrics operations
  getClientProgress(clientId: string, exerciseId?: string): Promise<ProgressMetric[]>;
  createProgressMetric(metric: InsertProgressMetric): Promise<ProgressMetric>;
  getProgressMetricsForRoutine(clientId: string, routineId: string): Promise<ProgressMetric[]>;

  // Coach Console operations
  getEventConsoleData(eventId: string, userId: string): Promise<any>;
  startEventSession(eventId: string, userId: string): Promise<CalendarEvent>;
  completeEventSession(eventId: string, userId: string, sessionNotes?: string): Promise<any>;
  recordAttendance(eventId: string, clientId: string, status: string): Promise<void>;
  recordSessionMetrics(eventId: string, metrics: any[]): Promise<void>;

  // Program Management operations
  getPrograms(userId: string): Promise<(Program & { classType?: ClassType; enrollmentCount: number })[]>;
  getProgram(id: string): Promise<Program | undefined>;
  getProgramWithSessions(id: string): Promise<(Program & { 
    classType?: ClassType; 
    sessions: (ProgramSession & { routine?: Routine })[] 
  }) | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program>;
  deleteProgram(id: string): Promise<void>;

  // Program Session operations
  getProgramSessions(programId: string): Promise<(ProgramSession & { routine?: Routine })[]>;
  createProgramSession(session: InsertProgramSession): Promise<ProgramSession>;
  updateProgramSession(id: string, session: Partial<InsertProgramSession>): Promise<ProgramSession>;
  deleteProgramSession(id: string): Promise<void>;
  generateScheduleForProgram(programId: string, weeks: number): Promise<CalendarEvent[]>;

  // Program Enrollment operations
  getProgramEnrollments(programId: string): Promise<(ProgramEnrollment & { client?: Client; classType?: ClassType })[]>;
  enrollInProgram(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment>;
  updateProgramEnrollment(id: string, enrollment: Partial<InsertProgramEnrollment>): Promise<ProgramEnrollment>;
  unenrollFromProgram(id: string): Promise<void>;

  // Event Targets operations
  getEventTargets(eventId: string): Promise<(EventTarget & { routineExercise?: RoutineExercise & { exercise: Exercise } })[]>;
  createEventTargets(targets: InsertEventTarget[]): Promise<EventTarget[]>;
  updateEventTarget(id: string, target: Partial<InsertEventTarget>): Promise<EventTarget>;

  // Readiness Check operations
  getClientReadiness(clientId: string, date?: Date): Promise<ReadinessCheck[]>;
  createReadinessCheck(check: InsertReadinessCheck): Promise<ReadinessCheck>;
  getLatestReadiness(clientId: string): Promise<ReadinessCheck | undefined>;

  // Performance Record operations
  getPerformanceRecords(eventId: string, clientId?: string): Promise<(PerformanceRecord & { exercise: Exercise })[]>;
  createPerformanceRecord(record: InsertPerformanceRecord): Promise<PerformanceRecord>;
  applyProgression(eventId: string): Promise<any>;

  // Data seeding operations
  seedDefaultData(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { email: string; passwordHash: string; firstName?: string; lastName?: string; emailVerified?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: userData.emailVerified,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Class Type operations
  async getClassTypes(userId?: string): Promise<ClassType[]> {
    const query = db.select().from(classTypes);
    if (userId) {
      return await query.where(
        sql`${classTypes.isDefault} = true OR ${classTypes.createdByUserId} = ${userId}`
      );
    }
    return await query.where(eq(classTypes.isDefault, true));
  }

  async createClassType(classType: InsertClassType): Promise<ClassType> {
    const [newClassType] = await db.insert(classTypes).values(classType).returning();
    return newClassType;
  }

  async updateClassType(id: string, classType: Partial<InsertClassType>): Promise<ClassType> {
    const [updated] = await db
      .update(classTypes)
      .set(classType)
      .where(eq(classTypes.id, id))
      .returning();
    return updated;
  }

  async deleteClassType(id: string): Promise<void> {
    await db.delete(classTypes).where(eq(classTypes.id, id));
  }

  async createDefaultExercisesForClass(classType: ClassType, userId: string): Promise<void> {
    const defaultExercises = this.getDefaultExercisesForClassType(classType.name);
    
    for (const exercise of defaultExercises) {
      await this.createExercise({
        ...exercise,
        classTypeId: classType.id,
        createdByUserId: userId,
        isPublic: true,
      });
    }
  }

  private getDefaultExercisesForClassType(className: string): Omit<InsertExercise, 'createdByUserId' | 'isPublic'>[] {
    const name = className.toLowerCase();
    
    if (name.includes('yoga')) {
      return [
        { name: "Child's Pose", description: "Restorative yoga pose for relaxation and gentle stretching", difficultyLevel: "Beginner", equipmentNeeded: "Yoga mat", primaryMuscles: "Back, hips", secondaryMuscles: "Shoulders", category: "flexibility", caloriesPerMinute: 2, modifications: "Wide-knee child's pose", safetyNotes: "Listen to your body" },
        { name: "Downward Dog", description: "Foundational yoga pose that stretches and strengthens", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Shoulders, hamstrings", secondaryMuscles: "Core, calves", category: "flexibility", caloriesPerMinute: 3, modifications: "Hands on blocks", safetyNotes: "Distribute weight evenly" },
        { name: "Warrior I", description: "Standing yoga pose that builds strength and stability", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Legs, core", secondaryMuscles: "Shoulders, back", category: "balance", caloriesPerMinute: 3, modifications: "Use wall for support", safetyNotes: "Keep front knee over ankle" },
        { name: "Warrior II", description: "Strong standing pose that opens hips and strengthens legs", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Legs, core", secondaryMuscles: "Arms, back", category: "balance", caloriesPerMinute: 4, modifications: "Hands on hips", safetyNotes: "Keep torso upright" },
        { name: "Tree Pose", description: "Standing balance pose that improves focus and stability", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Legs, core", secondaryMuscles: "Ankles", category: "balance", caloriesPerMinute: 2, modifications: "Toe on ground for balance", safetyNotes: "Avoid placing foot on knee" },
        { name: "Cat-Cow Stretch", description: "Spinal mobility exercise alternating between arch and round", difficultyLevel: "Beginner", equipmentNeeded: "Yoga mat", primaryMuscles: "Spine, core", secondaryMuscles: "Shoulders", category: "flexibility", caloriesPerMinute: 2, modifications: "Seated version", safetyNotes: "Move slowly" },
        { name: "Cobra Pose", description: "Backbend that strengthens the spine and opens the chest", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Back, core", secondaryMuscles: "Arms", category: "flexibility", caloriesPerMinute: 3, modifications: "Keep forearms down", safetyNotes: "Don't overarch" },
        { name: "Triangle Pose", description: "Standing pose that stretches sides and strengthens legs", difficultyLevel: "Intermediate", equipmentNeeded: "Yoga mat", primaryMuscles: "Legs, core", secondaryMuscles: "Back, arms", category: "flexibility", caloriesPerMinute: 3, modifications: "Hand on shin", safetyNotes: "Keep both legs straight" },
        { name: "Seated Forward Fold", description: "Calming seated pose that stretches the spine and hamstrings", difficultyLevel: "Beginner", equipmentNeeded: "Yoga mat", primaryMuscles: "Hamstrings, back", secondaryMuscles: "Calves", category: "flexibility", caloriesPerMinute: 2, modifications: "Bend knees slightly", safetyNotes: "Don't force the stretch" },
        { name: "Savasana", description: "Final relaxation pose for complete rest and integration", difficultyLevel: "Beginner", equipmentNeeded: "Yoga mat", primaryMuscles: "None", secondaryMuscles: "None", category: "flexibility", caloriesPerMinute: 1, modifications: "Use props for comfort", safetyNotes: "Stay warm and still" }
      ];
    }
    
    if (name.includes('hiit')) {
      return [
        { name: "Burpees", description: "Full-body explosive movement combining squat, plank, and jump", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 12, modifications: "Step back instead of jump", safetyNotes: "Land softly" },
        { name: "Mountain Climbers", description: "High-intensity plank exercise with alternating knee drives", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Core, shoulders", secondaryMuscles: "Legs", category: "cardio", caloriesPerMinute: 10, modifications: "Slow tempo", safetyNotes: "Keep hips level" },
        { name: "Jump Squats", description: "Explosive lower body exercise adding jump to basic squat", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Glutes, quads", secondaryMuscles: "Calves, core", category: "cardio", caloriesPerMinute: 11, modifications: "Regular squats", safetyNotes: "Land with soft knees" },
        { name: "High Knees", description: "Running in place while lifting knees to hip level", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes", category: "cardio", caloriesPerMinute: 9, modifications: "March in place", safetyNotes: "Keep core engaged" },
        { name: "Jumping Jacks", description: "Classic cardio exercise jumping feet wide with arms overhead", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 8, modifications: "Step touch", safetyNotes: "Land on balls of feet" },
        { name: "Sprint Intervals", description: "Maximum effort running intervals for cardiovascular fitness", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Legs", secondaryMuscles: "Core, arms", category: "cardio", caloriesPerMinute: 15, modifications: "Jog in place", safetyNotes: "Proper warm-up essential" },
        { name: "Plank Jacks", description: "Plank position with jumping jack leg movement", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Core, shoulders", secondaryMuscles: "Legs", category: "cardio", caloriesPerMinute: 8, modifications: "Step feet out", safetyNotes: "Maintain plank form" },
        { name: "Squat Thrusts", description: "Dynamic movement from squat to plank and back", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 10, modifications: "Step back", safetyNotes: "Control the movement" },
        { name: "Box Step-ups", description: "Explosive step-up movement for power and conditioning", difficultyLevel: "Intermediate", equipmentNeeded: "Box or step", primaryMuscles: "Glutes, quads", secondaryMuscles: "Calves, core", category: "cardio", caloriesPerMinute: 7, modifications: "Regular step-ups", safetyNotes: "Step down controlled" },
        { name: "Battle Ropes", description: "Intense upper body cardio using heavy training ropes", difficultyLevel: "Advanced", equipmentNeeded: "Battle ropes", primaryMuscles: "Arms, shoulders", secondaryMuscles: "Core, back", category: "cardio", caloriesPerMinute: 13, modifications: "Lighter ropes", safetyNotes: "Maintain posture" }
      ];
    }
    
    if (name.includes('pilates')) {
      return [
        { name: "The Hundred", description: "Classic Pilates exercise focusing on core strength and breathing", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Arms", category: "strength", caloriesPerMinute: 4, modifications: "Bend knees", safetyNotes: "Keep lower back pressed down" },
        { name: "Single Leg Circles", description: "Controlled leg circles to improve hip mobility and stability", difficultyLevel: "Beginner", equipmentNeeded: "Mat", primaryMuscles: "Hip flexors", secondaryMuscles: "Core, glutes", category: "flexibility", caloriesPerMinute: 3, modifications: "Smaller circles", safetyNotes: "Keep hips stable" },
        { name: "Roll Up", description: "Spinal articulation exercise rolling up from lying to sitting", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Hip flexors", category: "strength", caloriesPerMinute: 4, modifications: "Use assistance", safetyNotes: "Move vertebra by vertebra" },
        { name: "Teaser", description: "Advanced core exercise balancing on sit bones with straight legs", difficultyLevel: "Advanced", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Hip flexors", category: "strength", caloriesPerMinute: 5, modifications: "Bent knees", safetyNotes: "Don't strain neck" },
        { name: "Swan", description: "Back extension exercise strengthening posterior chain", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Back extensors", secondaryMuscles: "Glutes", category: "strength", caloriesPerMinute: 4, modifications: "Hands remain down", safetyNotes: "Lift from back, not arms" },
        { name: "Side Plank", description: "Lateral core strengthening exercise in side-lying position", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Obliques", secondaryMuscles: "Shoulders, glutes", category: "strength", caloriesPerMinute: 4, modifications: "Knees down", safetyNotes: "Keep body in straight line" },
        { name: "Leg Pull Front", description: "Plank variation with leg lifts for core and shoulder stability", difficultyLevel: "Advanced", equipmentNeeded: "Mat", primaryMuscles: "Core, shoulders", secondaryMuscles: "Glutes", category: "strength", caloriesPerMinute: 5, modifications: "Hold plank only", safetyNotes: "Don't let hips sag" },
        { name: "Spine Stretch Forward", description: "Seated forward flexion for spinal mobility and hamstring stretch", difficultyLevel: "Beginner", equipmentNeeded: "Mat", primaryMuscles: "Spine", secondaryMuscles: "Hamstrings", category: "flexibility", caloriesPerMinute: 2, modifications: "Sit on cushion", safetyNotes: "Round spine sequentially" },
        { name: "Double Leg Stretch", description: "Core exercise with coordinated arm and leg movements", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Arms, legs", category: "strength", caloriesPerMinute: 4, modifications: "Keep head down", safetyNotes: "Don't let back arch" },
        { name: "Corkscrew", description: "Advanced exercise combining core strength with spinal rotation", difficultyLevel: "Advanced", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Hip flexors", category: "strength", caloriesPerMinute: 5, modifications: "Smaller circles", safetyNotes: "Control the movement" }
      ];
    }
    
    if (name.includes('crossfit')) {
      return [
        { name: "Wall Balls", description: "Functional movement throwing medicine ball to target on wall", difficultyLevel: "Intermediate", equipmentNeeded: "Medicine ball", primaryMuscles: "Legs, shoulders", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 10, modifications: "Lighter ball", safetyNotes: "Full squat depth" },
        { name: "Box Jumps", description: "Explosive jump onto elevated platform for power development", difficultyLevel: "Intermediate", equipmentNeeded: "Plyo box", primaryMuscles: "Glutes, quads", secondaryMuscles: "Calves", category: "cardio", caloriesPerMinute: 9, modifications: "Step-ups", safetyNotes: "Land softly, step down" },
        { name: "Kettlebell Swings", description: "Hip-hinge movement generating power through posterior chain", difficultyLevel: "Intermediate", equipmentNeeded: "Kettlebell", primaryMuscles: "Glutes, hamstrings", secondaryMuscles: "Core, shoulders", category: "strength", caloriesPerMinute: 8, modifications: "Lighter weight", safetyNotes: "Drive with hips" },
        { name: "Push Press", description: "Overhead pressing movement using leg drive for assistance", difficultyLevel: "Intermediate", equipmentNeeded: "Barbell or dumbbells", primaryMuscles: "Shoulders", secondaryMuscles: "Legs, core", category: "strength", caloriesPerMinute: 6, modifications: "Lighter weight", safetyNotes: "Keep core tight" },
        { name: "Pull-ups", description: "Upper body pulling exercise for back and arm strength", difficultyLevel: "Advanced", equipmentNeeded: "Pull-up bar", primaryMuscles: "Back, arms", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 7, modifications: "Assisted pull-ups", safetyNotes: "Full range of motion" },
        { name: "Thrusters", description: "Combination front squat and overhead press movement", difficultyLevel: "Advanced", equipmentNeeded: "Barbell or dumbbells", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 11, modifications: "Lighter weight", safetyNotes: "Keep chest up" },
        { name: "Double Unders", description: "Jump rope technique passing rope twice per jump", difficultyLevel: "Advanced", equipmentNeeded: "Jump rope", primaryMuscles: "Calves", secondaryMuscles: "Core, shoulders", category: "cardio", caloriesPerMinute: 12, modifications: "Single unders", safetyNotes: "Stay on balls of feet" },
        { name: "Deadlifts", description: "Fundamental hip-hinge movement lifting weight from ground", difficultyLevel: "Intermediate", equipmentNeeded: "Barbell", primaryMuscles: "Hamstrings, glutes", secondaryMuscles: "Back, core", category: "strength", caloriesPerMinute: 6, modifications: "Lighter weight", safetyNotes: "Keep back straight" },
        { name: "Rowing", description: "Full-body cardio exercise using rowing machine", difficultyLevel: "Intermediate", equipmentNeeded: "Rowing machine", primaryMuscles: "Back, legs", secondaryMuscles: "Core, arms", category: "cardio", caloriesPerMinute: 10, modifications: "Slower pace", safetyNotes: "Drive with legs first" },
        { name: "Handstand Push-ups", description: "Inverted pressing movement for shoulder and core strength", difficultyLevel: "Advanced", equipmentNeeded: "Wall", primaryMuscles: "Shoulders", secondaryMuscles: "Core, triceps", category: "strength", caloriesPerMinute: 8, modifications: "Pike push-ups", safetyNotes: "Build up gradually" }
      ];
    }
    
    if (name.includes('strength')) {
      return [
        { name: "Squats", description: "Fundamental lower body exercise targeting glutes and quadriceps", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Glutes, quadriceps", secondaryMuscles: "Core, calves", category: "strength", caloriesPerMinute: 5, modifications: "Chair-assisted", safetyNotes: "Keep knees behind toes" },
        { name: "Push-ups", description: "Upper body exercise targeting chest, shoulders, and triceps", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Chest, shoulders, triceps", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 6, modifications: "Knee push-ups", safetyNotes: "Maintain straight line" },
        { name: "Lunges", description: "Unilateral leg exercise for strength and balance", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Glutes, quadriceps", secondaryMuscles: "Hamstrings, calves", category: "strength", caloriesPerMinute: 6, modifications: "Stationary lunges", safetyNotes: "Keep front knee over ankle" },
        { name: "Plank", description: "Isometric core exercise in push-up position", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Core", secondaryMuscles: "Shoulders, glutes", category: "strength", caloriesPerMinute: 4, modifications: "Knee plank", safetyNotes: "Keep body straight" },
        { name: "Dumbbell Rows", description: "Back strengthening exercise using pulling motion", difficultyLevel: "Intermediate", equipmentNeeded: "Dumbbells", primaryMuscles: "Back", secondaryMuscles: "Biceps, core", category: "strength", caloriesPerMinute: 5, modifications: "Lighter weights", safetyNotes: "Keep back straight" },
        { name: "Overhead Press", description: "Shoulder exercise pressing weight above head", difficultyLevel: "Intermediate", equipmentNeeded: "Dumbbells", primaryMuscles: "Shoulders", secondaryMuscles: "Core, triceps", category: "strength", caloriesPerMinute: 5, modifications: "Seated press", safetyNotes: "Don't arch back" },
        { name: "Romanian Deadlifts", description: "Hip-hinge movement targeting posterior chain", difficultyLevel: "Intermediate", equipmentNeeded: "Dumbbells", primaryMuscles: "Hamstrings, glutes", secondaryMuscles: "Back, core", category: "strength", caloriesPerMinute: 6, modifications: "Bodyweight", safetyNotes: "Keep chest up" },
        { name: "Bicep Curls", description: "Isolation exercise for bicep muscle development", difficultyLevel: "Beginner", equipmentNeeded: "Dumbbells", primaryMuscles: "Biceps", secondaryMuscles: "Forearms", category: "strength", caloriesPerMinute: 3, modifications: "Lighter weights", safetyNotes: "Control the negative" },
        { name: "Tricep Dips", description: "Bodyweight exercise targeting tricep muscles", difficultyLevel: "Intermediate", equipmentNeeded: "Chair or bench", primaryMuscles: "Triceps", secondaryMuscles: "Shoulders", category: "strength", caloriesPerMinute: 4, modifications: "Feet on ground", safetyNotes: "Don't go too low" },
        { name: "Calf Raises", description: "Lower leg exercise for calf muscle development", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Calves", secondaryMuscles: "Ankles", category: "strength", caloriesPerMinute: 3, modifications: "Hold wall", safetyNotes: "Full range of motion" }
      ];
    }
    
    if (name.includes('barre')) {
      return [
        { name: "Pliés", description: "Ballet-inspired squat variation with turned-out legs", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Glutes, inner thighs", secondaryMuscles: "Calves", category: "strength", caloriesPerMinute: 4, modifications: "Hold barre", safetyNotes: "Keep knees over toes" },
        { name: "Relevés", description: "Calf raises in ballet first position for strength and grace", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Calves", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 3, modifications: "Hold support", safetyNotes: "Rise slowly" },
        { name: "Leg Lifts at Barre", description: "Standing leg extensions for glute and hip strength", difficultyLevel: "Intermediate", equipmentNeeded: "Barre or chair", primaryMuscles: "Glutes, hip flexors", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 4, modifications: "Lower height", safetyNotes: "Keep hips square" },
        { name: "Thigh Dancing", description: "Small isometric movements in deep plié position", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Quadriceps, glutes", secondaryMuscles: "Inner thighs", category: "strength", caloriesPerMinute: 5, modifications: "Less depth", safetyNotes: "Don't bounce" },
        { name: "Seat Work", description: "Glute-focused exercises in all-fours position", difficultyLevel: "Intermediate", equipmentNeeded: "Mat", primaryMuscles: "Glutes", secondaryMuscles: "Hamstrings, core", category: "strength", caloriesPerMinute: 4, modifications: "Lower range", safetyNotes: "Keep hips level" },
        { name: "Port de Bras", description: "Flowing arm movements for upper body and posture", difficultyLevel: "Beginner", equipmentNeeded: "Light weights", primaryMuscles: "Arms, shoulders", secondaryMuscles: "Core, back", category: "strength", caloriesPerMinute: 3, modifications: "No weights", safetyNotes: "Move with control" },
        { name: "Pretzel", description: "Targeted glute exercise in side-lying position", difficultyLevel: "Advanced", equipmentNeeded: "Mat", primaryMuscles: "Glutes", secondaryMuscles: "Hip flexors, core", category: "strength", caloriesPerMinute: 4, modifications: "Smaller movements", safetyNotes: "Don't roll forward" },
        { name: "Core Burner", description: "Intense abdominal sequence with small movements", difficultyLevel: "Advanced", equipmentNeeded: "Mat", primaryMuscles: "Core", secondaryMuscles: "Hip flexors", category: "strength", caloriesPerMinute: 5, modifications: "Larger movements", safetyNotes: "Don't pull neck" },
        { name: "Balance Challenge", description: "Single-leg exercises for stability and strength", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, core", secondaryMuscles: "Ankles", category: "balance", caloriesPerMinute: 4, modifications: "Hold support", safetyNotes: "Engage core" },
        { name: "Final Stretch", description: "Flexibility sequence to lengthen worked muscles", difficultyLevel: "Beginner", equipmentNeeded: "Mat", primaryMuscles: "Full body", secondaryMuscles: "None", category: "flexibility", caloriesPerMinute: 2, modifications: "Less depth", safetyNotes: "Breathe deeply" }
      ];
    }
    
    if (name.includes('spinning') || name.includes('cycling')) {
      return [
        { name: "Warm-up Ride", description: "Gentle cycling to prepare muscles and joints", difficultyLevel: "Beginner", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Lower resistance", safetyNotes: "Proper bike setup essential" },
        { name: "Seated Climb", description: "Increased resistance simulation of uphill cycling", difficultyLevel: "Intermediate", equipmentNeeded: "Spin bike", primaryMuscles: "Glutes, quadriceps", secondaryMuscles: "Core, calves", category: "cardio", caloriesPerMinute: 9, modifications: "Moderate resistance", safetyNotes: "Maintain cadence" },
        { name: "Standing Climb", description: "Out-of-saddle riding for maximum power output", difficultyLevel: "Advanced", equipmentNeeded: "Spin bike", primaryMuscles: "Glutes, quadriceps", secondaryMuscles: "Core, arms", category: "cardio", caloriesPerMinute: 12, modifications: "Seated option", safetyNotes: "Core engagement crucial" },
        { name: "Sprint Intervals", description: "High-intensity short bursts at maximum effort", difficultyLevel: "Advanced", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "Core, cardiovascular", category: "cardio", caloriesPerMinute: 15, modifications: "Longer intervals", safetyNotes: "Proper recovery essential" },
        { name: "Jumps", description: "Alternating between seated and standing positions", difficultyLevel: "Intermediate", equipmentNeeded: "Spin bike", primaryMuscles: "Legs, core", secondaryMuscles: "Arms", category: "cardio", caloriesPerMinute: 10, modifications: "Slower transitions", safetyNotes: "Smooth transitions" },
        { name: "Isolations", description: "Single-leg focused work for muscle imbalance correction", difficultyLevel: "Intermediate", equipmentNeeded: "Spin bike", primaryMuscles: "Individual leg muscles", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 7, modifications: "Both legs", safetyNotes: "Equal work both sides" },
        { name: "Recovery Spin", description: "Easy-paced cycling for active recovery", difficultyLevel: "Beginner", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "Cardiovascular", category: "cardio", caloriesPerMinute: 5, modifications: "Even slower", safetyNotes: "Focus on form" },
        { name: "Tabata Cycling", description: "4-minute high-intensity protocol with specific timing", difficultyLevel: "Advanced", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "Cardiovascular", category: "cardio", caloriesPerMinute: 14, modifications: "Longer work periods", safetyNotes: "All-out effort required" },
        { name: "Endurance Ride", description: "Sustained moderate effort for cardiovascular fitness", difficultyLevel: "Intermediate", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "Core, cardiovascular", category: "cardio", caloriesPerMinute: 8, modifications: "Shorter duration", safetyNotes: "Pace yourself" },
        { name: "Cool-down Spin", description: "Gentle cycling to gradually lower heart rate", difficultyLevel: "Beginner", equipmentNeeded: "Spin bike", primaryMuscles: "Legs", secondaryMuscles: "None", category: "cardio", caloriesPerMinute: 4, modifications: "Even gentler", safetyNotes: "Gradual reduction" }
      ];
    }
    
    if (name.includes('kickboxing')) {
      return [
        { name: "Jab-Cross Combo", description: "Basic boxing combination with lead and rear hand punches", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Arms, shoulders", secondaryMuscles: "Core, legs", category: "cardio", caloriesPerMinute: 8, modifications: "Slower pace", safetyNotes: "Keep guard up" },
        { name: "Front Kicks", description: "Straight kick using ball of foot to target", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, core", secondaryMuscles: "Hip flexors", category: "cardio", caloriesPerMinute: 9, modifications: "Knee lifts", safetyNotes: "Pull toes back" },
        { name: "Roundhouse Kicks", description: "Circular kick using shin or instep", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Legs, core", secondaryMuscles: "Glutes, obliques", category: "cardio", caloriesPerMinute: 10, modifications: "Low kicks", safetyNotes: "Turn hips over" },
        { name: "Hook Punches", description: "Circular punch targeting side of opponent", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Arms, shoulders", secondaryMuscles: "Core, obliques", category: "cardio", caloriesPerMinute: 8, modifications: "Body punches", safetyNotes: "Rotate from core" },
        { name: "Knee Strikes", description: "Close-range strikes using knee joint", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Hip flexors, core", secondaryMuscles: "Legs, glutes", category: "cardio", caloriesPerMinute: 9, modifications: "Standing knees", safetyNotes: "Drive knee up" },
        { name: "Duck and Weave", description: "Defensive movement to avoid punches", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, core", secondaryMuscles: "Back", category: "cardio", caloriesPerMinute: 7, modifications: "Slower movement", safetyNotes: "Keep eyes on target" },
        { name: "Side Kicks", description: "Lateral kick using heel or blade of foot", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Legs, obliques", secondaryMuscles: "Core, glutes", category: "cardio", caloriesPerMinute: 9, modifications: "Standing leg lifts", safetyNotes: "Turn supporting foot" },
        { name: "Boxing Footwork", description: "Movement patterns for positioning and mobility", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, calves", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Slower steps", safetyNotes: "Stay on balls of feet" },
        { name: "Combination Drills", description: "Flowing sequences combining punches and kicks", difficultyLevel: "Advanced", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Cardiovascular", category: "cardio", caloriesPerMinute: 11, modifications: "Simpler combos", safetyNotes: "Focus on form" },
        { name: "Heavy Bag Work", description: "Practicing techniques on heavy training bag", difficultyLevel: "Intermediate", equipmentNeeded: "Heavy bag, gloves", primaryMuscles: "Full body", secondaryMuscles: "Cardiovascular", category: "cardio", caloriesPerMinute: 10, modifications: "Pad work", safetyNotes: "Proper hand protection" }
      ];
    }
    
    if (name.includes('zumba')) {
      return [
        { name: "Salsa Steps", description: "Basic salsa footwork adapted for fitness", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Legs, calves", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 7, modifications: "Step touch", safetyNotes: "Stay light on feet" },
        { name: "Merengue March", description: "Simple marching steps with hip movement", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Legs, glutes", secondaryMuscles: "Core, hips", category: "cardio", caloriesPerMinute: 6, modifications: "In place", safetyNotes: "Let hips move naturally" },
        { name: "Reggaeton Bounce", description: "Urban dance move with knee bouncing", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, glutes", secondaryMuscles: "Core, hips", category: "cardio", caloriesPerMinute: 8, modifications: "Smaller bounces", safetyNotes: "Bend knees" },
        { name: "Cumbia Steps", description: "Colombian dance with side-to-side movement", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, hips", secondaryMuscles: "Core, arms", category: "cardio", caloriesPerMinute: 7, modifications: "Step touch", safetyNotes: "Follow the rhythm" },
        { name: "Belly Dance Moves", description: "Isolated hip and torso movements", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Core, hips", secondaryMuscles: "Back, glutes", category: "cardio", caloriesPerMinute: 5, modifications: "Smaller movements", safetyNotes: "Focus on isolation" },
        { name: "Cha Cha Cha", description: "Triple step ballroom dance movement", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, calves", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Walking steps", safetyNotes: "Quick-quick-slow rhythm" },
        { name: "Bollywood Arms", description: "Expressive arm movements from Indian dance", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Arms, shoulders", secondaryMuscles: "Core, back", category: "cardio", caloriesPerMinute: 4, modifications: "Smaller range", safetyNotes: "Graceful movements" },
        { name: "Samba Bounce", description: "Brazilian dance with bouncing knee action", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Legs, glutes", secondaryMuscles: "Core, calves", category: "cardio", caloriesPerMinute: 8, modifications: "Less bounce", safetyNotes: "Continuous knee bend" },
        { name: "Hip Hop Moves", description: "Urban street dance with attitude", difficultyLevel: "Intermediate", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 8, modifications: "Simpler moves", safetyNotes: "Express yourself" },
        { name: "Cool Down Stretch", description: "Gentle stretching with Latin music", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "None", category: "flexibility", caloriesPerMinute: 3, modifications: "Deeper stretches", safetyNotes: "Breathe and relax" }
      ];
    }
    
    if (name.includes('aqua') || name.includes('water')) {
      return [
        { name: "Water Walking", description: "Forward and backward walking in chest-deep water", difficultyLevel: "Beginner", equipmentNeeded: "Pool", primaryMuscles: "Legs", secondaryMuscles: "Core, arms", category: "cardio", caloriesPerMinute: 5, modifications: "Shallow water", safetyNotes: "Use water buoyancy" },
        { name: "Aqua Jogging", description: "Running motion in deep water with flotation", difficultyLevel: "Intermediate", equipmentNeeded: "Pool, flotation belt", primaryMuscles: "Legs, core", secondaryMuscles: "Arms", category: "cardio", caloriesPerMinute: 8, modifications: "Slower pace", safetyNotes: "Maintain good form" },
        { name: "Water Jumping Jacks", description: "Classic exercise adapted for water resistance", difficultyLevel: "Beginner", equipmentNeeded: "Pool", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 6, modifications: "Arms only", safetyNotes: "Use water resistance" },
        { name: "Pool Push-ups", description: "Push-ups using pool edge for upper body strength", difficultyLevel: "Intermediate", equipmentNeeded: "Pool edge", primaryMuscles: "Chest, arms", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 4, modifications: "Inclined position", safetyNotes: "Secure hand placement" },
        { name: "Water Kicks", description: "Leg kicks in various directions for strength", difficultyLevel: "Beginner", equipmentNeeded: "Pool", primaryMuscles: "Legs, glutes", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 4, modifications: "Hold pool edge", safetyNotes: "Controlled movements" },
        { name: "Cross-Country Skiing", description: "Skiing motion adapted for water exercise", difficultyLevel: "Intermediate", equipmentNeeded: "Pool", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 7, modifications: "Smaller range", safetyNotes: "Opposite arm/leg" },
        { name: "Water Squats", description: "Squat exercise with water resistance and buoyancy", difficultyLevel: "Beginner", equipmentNeeded: "Pool", primaryMuscles: "Glutes, legs", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 5, modifications: "Shallow squats", safetyNotes: "Full range of motion" },
        { name: "Arm Circles", description: "Large arm circles against water resistance", difficultyLevel: "Beginner", equipmentNeeded: "Pool", primaryMuscles: "Shoulders, arms", secondaryMuscles: "Core", category: "strength", caloriesPerMinute: 3, modifications: "Smaller circles", safetyNotes: "Both directions" },
        { name: "Flutter Kicks", description: "Rapid alternating leg kicks holding pool edge", difficultyLevel: "Intermediate", equipmentNeeded: "Pool edge", primaryMuscles: "Legs, core", secondaryMuscles: "Hip flexors", category: "cardio", caloriesPerMinute: 6, modifications: "Slower kicks", safetyNotes: "Keep legs straight" },
        { name: "Water Planks", description: "Plank position using water buoyancy and noodles", difficultyLevel: "Intermediate", equipmentNeeded: "Pool noodles", primaryMuscles: "Core", secondaryMuscles: "Shoulders", category: "strength", caloriesPerMinute: 4, modifications: "Shorter holds", safetyNotes: "Maintain straight line" }
      ];
    }
    
    // Default exercises for any other class type  
    return [
      { name: "Basic Warm-up", description: "Light movement to prepare the body for exercise", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "cardio", caloriesPerMinute: 3, modifications: "Adjust intensity as needed", safetyNotes: "Start slowly" },
      { name: "Cool-down Stretch", description: "Gentle stretching to help muscles recover", difficultyLevel: "Beginner", equipmentNeeded: "None", primaryMuscles: "Full body", secondaryMuscles: "Core", category: "flexibility", caloriesPerMinute: 2, modifications: "Hold stretches as comfortable", safetyNotes: "Never bounce while stretching" }
    ];
  }

  // Exercise operations
  async getExercises(filters?: {
    search?: string;
    category?: string;
    difficulty?: string;
    equipment?: string;
    classType?: string;
    userId?: string;
  }): Promise<(Exercise & { classType?: ClassType })[]> {
    // Use leftJoin to include exercises with or without class types
    let query = db.select({
      exercise: exercises,
      classType: classTypes
    }).from(exercises).leftJoin(classTypes, eq(exercises.classTypeId, classTypes.id));
    
    const filterConditions = [];
    
    // Build filter conditions
    if (filters?.search && filters.search.trim() !== '') {
      filterConditions.push(ilike(exercises.name, `%${filters.search}%`));
    }
    if (filters?.category && filters.category !== 'all') {
      filterConditions.push(eq(exercises.category, filters.category as any));
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      filterConditions.push(eq(exercises.difficultyLevel, filters.difficulty as any));
    }
    if (filters?.equipment && filters.equipment !== 'all') {
      if (filters.equipment === 'No Equipment') {
        filterConditions.push(
          sql`(${exercises.equipmentNeeded} IS NULL OR ${exercises.equipmentNeeded} = '' OR ${exercises.equipmentNeeded} = 'None')`
        );
      } else {
        filterConditions.push(ilike(exercises.equipmentNeeded, `%${filters.equipment}%`));
      }
    }
    if (filters?.classType && filters.classType !== 'all') {
      if (filters.classType === 'none') {
        filterConditions.push(sql`${exercises.classTypeId} IS NULL`);
      } else {
        filterConditions.push(eq(exercises.classTypeId, filters.classType));
      }
    }

    // Combine visibility and filter conditions properly
    const visibilityCondition = filters?.userId 
      ? sql`(${exercises.isPublic} = true OR ${exercises.createdByUserId} = ${filters.userId})`
      : eq(exercises.isPublic, true);

    const finalCondition = filterConditions.length > 0
      ? and(visibilityCondition, and(...filterConditions))
      : visibilityCondition;
    
    const results = await query.where(finalCondition).orderBy(exercises.name);
    
    // Transform the results to match expected format
    return results.map(result => ({
      ...result.exercise,
      classType: result.classType || undefined
    }));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise> {
    const [updated] = await db
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Routine operations
  async getRoutines(userId: string): Promise<(Routine & { classType?: ClassType; exerciseCount: number })[]> {
    const result = await db
      .select({
        routine: routines,
        classType: classTypes,
        exerciseCount: sql<number>`COUNT(${routineExercises.id})::int`,
      })
      .from(routines)
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .leftJoin(routineExercises, eq(routines.id, routineExercises.routineId))
      .where(eq(routines.createdByUserId, userId))
      .groupBy(routines.id, classTypes.id)
      .orderBy(desc(routines.createdAt));

    return result.map(row => ({
      ...row.routine,
      classType: row.classType || undefined,
      exerciseCount: row.exerciseCount,
    }));
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    const [routine] = await db.select().from(routines).where(eq(routines.id, id));
    return routine;
  }

  async getRoutineWithExercises(id: string): Promise<(Routine & { 
    classType?: ClassType; 
    exercises: (RoutineExercise & { exercise: Exercise })[] 
  }) | undefined> {
    const [routine] = await db
      .select({
        routine: routines,
        classType: classTypes,
      })
      .from(routines)
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .where(eq(routines.id, id));

    if (!routine) return undefined;

    const exerciseResults = await db
      .select({
        routineExercise: routineExercises,
        exercise: exercises,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, id))
      .orderBy(routineExercises.orderIndex);

    return {
      ...routine.routine,
      classType: routine.classType || undefined,
      exercises: exerciseResults.map(row => ({
        ...row.routineExercise,
        exercise: row.exercise,
      })),
    };
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const [newRoutine] = await db.insert(routines).values(routine).returning();
    return newRoutine;
  }

  async updateRoutine(id: string, routine: Partial<InsertRoutine>): Promise<Routine> {
    const [updated] = await db
      .update(routines)
      .set({ ...routine, updatedAt: new Date() })
      .where(eq(routines.id, id))
      .returning();
    return updated;
  }

  async deleteRoutine(id: string): Promise<void> {
    await db.delete(routines).where(eq(routines.id, id));
  }

  async duplicateRoutine(id: string, newName: string, userId: string): Promise<Routine> {
    const original = await this.getRoutineWithExercises(id);
    if (!original) throw new Error("Routine not found");

    const [newRoutine] = await db.insert(routines).values({
      name: newName,
      description: original.description,
      classTypeId: original.classTypeId,
      createdByUserId: userId,
      isPublic: false,
      totalDuration: original.totalDuration,
    }).returning();

    // Copy exercises
    if (original.exercises.length > 0) {
      await db.insert(routineExercises).values(
        original.exercises.map(ex => ({
          routineId: newRoutine.id,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          durationSeconds: ex.durationSeconds,
          repetitions: ex.repetitions,
          sets: ex.sets,
          restSeconds: ex.restSeconds,
          musicTitle: ex.musicTitle,
          notes: ex.notes,
        }))
      );
    }

    return newRoutine;
  }

  // Routine Exercise operations
  async getRoutineExercises(routineId: string): Promise<(RoutineExercise & { exercise: Exercise })[]> {
    const results = await db
      .select({
        routineExercise: routineExercises,
        exercise: exercises,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, routineId))
      .orderBy(routineExercises.orderIndex);

    return results.map(row => ({
      ...row.routineExercise,
      exercise: row.exercise,
    }));
  }

  async addExerciseToRoutine(routineExercise: InsertRoutineExercise): Promise<RoutineExercise> {
    const [newRoutineExercise] = await db.insert(routineExercises).values(routineExercise).returning();
    
    // Update routine total duration
    await this.updateRoutineDuration(routineExercise.routineId);
    
    return newRoutineExercise;
  }

  async updateRoutineExercise(id: string, routineExercise: Partial<InsertRoutineExercise>): Promise<RoutineExercise> {
    const [updated] = await db
      .update(routineExercises)
      .set(routineExercise)
      .where(eq(routineExercises.id, id))
      .returning();

    // Update routine total duration
    if (updated) {
      await this.updateRoutineDuration(updated.routineId);
    }

    return updated;
  }

  async removeExerciseFromRoutine(id: string): Promise<void> {
    const [removed] = await db.delete(routineExercises).where(eq(routineExercises.id, id)).returning();
    
    if (removed) {
      await this.updateRoutineDuration(removed.routineId);
    }
  }

  async reorderRoutineExercises(routineId: string, exerciseIds: string[]): Promise<void> {
    for (let i = 0; i < exerciseIds.length; i++) {
      await db
        .update(routineExercises)
        .set({ orderIndex: i })
        .where(eq(routineExercises.id, exerciseIds[i]));
    }
  }

  private async updateRoutineDuration(routineId: string): Promise<void> {
    const exercises = await db
      .select({ durationSeconds: routineExercises.durationSeconds, restSeconds: routineExercises.restSeconds })
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId));

    const totalDuration = exercises.reduce((total, ex) => {
      return total + (ex.durationSeconds || 0) + (ex.restSeconds || 0);
    }, 0);

    await db
      .update(routines)
      .set({ totalDuration, updatedAt: new Date() })
      .where(eq(routines.id, routineId));
  }

  // Calendar operations
  async getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<(CalendarEvent & { classType?: ClassType; routine?: Routine })[]> {
    const conditions = [eq(calendarEvents.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(sql`${calendarEvents.startDatetime} >= ${startDate}`);
      conditions.push(sql`${calendarEvents.endDatetime} <= ${endDate}`);
    }
    
    const results = await db
      .select({
        event: calendarEvents,
        classType: classTypes,
        routine: routines,
      })
      .from(calendarEvents)
      .leftJoin(classTypes, eq(calendarEvents.classTypeId, classTypes.id))
      .leftJoin(routines, eq(calendarEvents.routineId, routines.id))
      .where(and(...conditions))
      .orderBy(calendarEvents.startDatetime);

    return results.map(row => ({
      ...row.event,
      classType: row.classType || undefined,
      routine: row.routine || undefined,
    }));
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [updated] = await db
      .update(calendarEvents)
      .set(event)
      .where(eq(calendarEvents.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Community operations
  async getCommunityRoutines(filters?: { search?: string; classType?: string }): Promise<(Routine & { 
    classType?: ClassType; 
    createdBy: User;
    exerciseCount: number 
  })[]> {
    const conditions = [eq(routines.isPublic, true)];

    if (filters?.search) {
      conditions.push(ilike(routines.name, `%${filters.search}%`));
    }
    if (filters?.classType) {
      conditions.push(eq(routines.classTypeId, filters.classType));
    }

    const results = await db
      .select({
        routine: routines,
        classType: classTypes,
        createdBy: users,
        exerciseCount: sql<number>`COUNT(${routineExercises.id})::int`,
      })
      .from(routines)
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .innerJoin(users, eq(routines.createdByUserId, users.id))
      .leftJoin(routineExercises, eq(routines.id, routineExercises.routineId))
      .where(and(...conditions))
      .groupBy(routines.id, classTypes.id, users.id)
      .orderBy(desc(routines.createdAt));

    return results.map(row => ({
      ...row.routine,
      classType: row.classType || undefined,
      createdBy: row.createdBy,
      exerciseCount: row.exerciseCount,
    }));
  }

  async saveRoutine(userId: string, routineId: string): Promise<UserSavedRoutine> {
    const [saved] = await db.insert(userSavedRoutines).values({
      userId,
      routineId,
    }).returning();
    return saved;
  }

  async unsaveRoutine(userId: string, routineId: string): Promise<void> {
    await db.delete(userSavedRoutines).where(
      and(
        eq(userSavedRoutines.userId, userId),
        eq(userSavedRoutines.routineId, routineId)
      )
    );
  }

  async getUserSavedRoutines(userId: string): Promise<(UserSavedRoutine & { routine: Routine & { classType?: ClassType } })[]> {
    const results = await db
      .select({
        saved: userSavedRoutines,
        routine: routines,
        classType: classTypes,
      })
      .from(userSavedRoutines)
      .innerJoin(routines, eq(userSavedRoutines.routineId, routines.id))
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .where(eq(userSavedRoutines.userId, userId))
      .orderBy(desc(userSavedRoutines.savedAt));

    return results.map(row => ({
      ...row.saved,
      routine: {
        ...row.routine,
        classType: row.classType || undefined,
      },
    }));
  }

  // Dashboard stats
  async getUserStats(userId: string): Promise<{
    totalRoutines: number;
    totalExercises: number;
    weeklyClasses: number;
    avgDuration: number;
    classTypes: number;
  }> {
    const [routineStats] = await db
      .select({
        totalRoutines: sql<number>`COUNT(${routines.id})::int`,
        avgDuration: sql<number>`COALESCE(AVG(${routines.totalDuration}), 0)::int`,
      })
      .from(routines)
      .where(eq(routines.createdByUserId, userId));

    const [exerciseStats] = await db
      .select({
        totalExercises: sql<number>`COUNT(${exercises.id})::int`,
      })
      .from(exercises)
      .where(eq(exercises.createdByUserId, userId));

    const [classTypeStats] = await db
      .select({
        classTypes: sql<number>`COUNT(${classTypes.id})::int`,
      })
      .from(classTypes)
      .where(eq(classTypes.createdByUserId, userId));

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [weeklyStats] = await db
      .select({
        weeklyClasses: sql<number>`COUNT(${calendarEvents.id})::int`,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          sql`${calendarEvents.startDatetime} >= ${weekStart}`,
          sql`${calendarEvents.startDatetime} < ${weekEnd}`
        )
      );

    return {
      totalRoutines: routineStats?.totalRoutines || 0,
      totalExercises: exerciseStats?.totalExercises || 0,
      weeklyClasses: weeklyStats?.weeklyClasses || 0,
      avgDuration: Math.round((routineStats?.avgDuration || 0) / 60), // Convert to minutes
      classTypes: classTypeStats?.classTypes || 0,
    };
  }

  async getAnalyticsData(userId: string): Promise<{
    weeklyActivity: Array<{ week: string; routines: number; classes: number }>;
    popularExercises: Array<{ name: string; count: number; category: string }>;
    classTypeDistribution: Array<{ name: string; count: number; percentage: number }>;
    monthlyTrends: Array<{ month: string; totalMinutes: number; avgDuration: number }>;
  }> {
    // Weekly Activity for last 8 weeks
    const weeklyActivity = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [routineCount] = await db
        .select({
          count: sql<number>`COUNT(${routines.id})::int`,
        })
        .from(routines)
        .where(
          and(
            eq(routines.createdByUserId, userId),
            sql`${routines.createdAt} >= ${weekStart}`,
            sql`${routines.createdAt} < ${weekEnd}`
          )
        );

      const [classCount] = await db
        .select({
          count: sql<number>`COUNT(${calendarEvents.id})::int`,
        })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            sql`${calendarEvents.startDatetime} >= ${weekStart}`,
            sql`${calendarEvents.startDatetime} < ${weekEnd}`
          )
        );

      weeklyActivity.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        routines: routineCount?.count || 0,
        classes: classCount?.count || 0,
      });
    }

    // Popular Exercises (most used in routines)
    const popularExercises = await db
      .select({
        name: exercises.name,
        count: sql<number>`COUNT(${routineExercises.id})::int`,
        category: exercises.category,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .innerJoin(routines, eq(routineExercises.routineId, routines.id))
      .where(eq(routines.createdByUserId, userId))
      .groupBy(exercises.id, exercises.name, exercises.category)
      .orderBy(sql`COUNT(${routineExercises.id}) DESC`)
      .limit(10);

    // Class Type Distribution
    const classTypeData = await db
      .select({
        name: sql<string>`COALESCE(${classTypes.name}, 'No Class Type')`,
        count: sql<number>`COUNT(${routines.id})::int`,
      })
      .from(routines)
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .where(eq(routines.createdByUserId, userId))
      .groupBy(classTypes.id, classTypes.name);

    const totalClassTypeRoutines = classTypeData.reduce((sum, item) => sum + item.count, 0);
    const classTypeDistribution = classTypeData.map(item => ({
      name: item.name || 'No Class Type',
      count: item.count,
      percentage: totalClassTypeRoutines > 0 ? Math.round((item.count / totalClassTypeRoutines) * 100) : 0,
    }));

    // Monthly Trends for last 6 months
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [monthlyData] = await db
        .select({
          totalMinutes: sql<number>`COALESCE(SUM(${routines.totalDuration}), 0)::int`,
          avgDuration: sql<number>`COALESCE(AVG(${routines.totalDuration}), 0)::int`,
        })
        .from(routines)
        .where(
          and(
            eq(routines.createdByUserId, userId),
            sql`${routines.createdAt} >= ${monthStart}`,
            sql`${routines.createdAt} < ${monthEnd}`
          )
        );

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        totalMinutes: Math.round((monthlyData?.totalMinutes || 0) / 60), // Convert to minutes
        avgDuration: Math.round((monthlyData?.avgDuration || 0) / 60), // Convert to minutes
      });
    }

    return {
      weeklyActivity,
      popularExercises: popularExercises.map(ex => ({
        name: ex.name,
        count: ex.count,
        category: ex.category || 'General'
      })),
      classTypeDistribution,
      monthlyTrends,
    };
  }

  // Client Management operations
  async getClients(trainerId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(and(eq(clients.trainerId, trainerId), eq(clients.isActive, true)))
      .orderBy(clients.firstName, clients.lastName);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({
        ...client,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await db
      .update(clients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(clients.id, id));
  }

  // Client Notes operations
  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    return await db
      .select()
      .from(clientNotes)
      .where(eq(clientNotes.clientId, clientId))
      .orderBy(desc(clientNotes.createdAt));
  }

  async createClientNote(note: InsertClientNote): Promise<ClientNote> {
    const [newNote] = await db.insert(clientNotes).values(note).returning();
    return newNote;
  }

  async deleteClientNote(id: string): Promise<void> {
    await db.delete(clientNotes).where(eq(clientNotes.id, id));
  }

  // Attendance operations
  async getAttendanceForEvent(eventId: string): Promise<(Attendance & { client: Client })[]> {
    const results = await db
      .select({
        attendance: attendance,
        client: clients,
      })
      .from(attendance)
      .innerJoin(clients, eq(attendance.clientId, clients.id))
      .where(eq(attendance.eventId, eventId))
      .orderBy(clients.firstName, clients.lastName);

    return results.map(result => ({
      ...result.attendance,
      client: result.client,
    }));
  }

  async getClientAttendance(clientId: string, limit?: number): Promise<(Attendance & { event: CalendarEvent })[]> {
    let query = db
      .select({
        attendance: attendance,
        event: calendarEvents,
      })
      .from(attendance)
      .innerJoin(calendarEvents, eq(attendance.eventId, calendarEvents.id))
      .where(eq(attendance.clientId, clientId))
      .orderBy(desc(calendarEvents.startDatetime));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = await query;
    return results.map(result => ({
      ...result.attendance,
      event: result.event,
    }));
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async updateAttendance(id: string, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [updated] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return updated;
  }

  // Progress Metrics operations
  async getClientProgress(clientId: string, exerciseId?: string): Promise<ProgressMetric[]> {
    if (exerciseId) {
      return await db
        .select()
        .from(progressMetrics)
        .where(and(eq(progressMetrics.clientId, clientId), eq(progressMetrics.exerciseId, exerciseId)))
        .orderBy(desc(progressMetrics.recordedAt));
    } else {
      return await db
        .select()
        .from(progressMetrics)
        .where(eq(progressMetrics.clientId, clientId))
        .orderBy(desc(progressMetrics.recordedAt));
    }
  }

  async createProgressMetric(metric: InsertProgressMetric): Promise<ProgressMetric> {
    const [newMetric] = await db.insert(progressMetrics).values(metric).returning();
    return newMetric;
  }

  async getProgressMetricsForRoutine(clientId: string, routineId: string): Promise<ProgressMetric[]> {
    return await db
      .select()
      .from(progressMetrics)
      .where(and(eq(progressMetrics.clientId, clientId), eq(progressMetrics.routineId, routineId)))
      .orderBy(desc(progressMetrics.recordedAt));
  }

  // Event Client Enrollment operations
  async getEventClients(eventId: string): Promise<Client[]> {
    const result = await db
      .select({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
        phone: clients.phone,
        dateOfBirth: clients.dateOfBirth,
        fitnessLevel: clients.fitnessLevel,
        goals: clients.goals,
        medicalConditions: clients.medicalConditions,
        emergencyContact: clients.emergencyContact,
        trainerId: clients.trainerId,
        isActive: clients.isActive,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .innerJoin(eventClients, eq(clients.id, eventClients.clientId))
      .where(eq(eventClients.eventId, eventId));
    
    return result;
  }

  async enrollClientInEvent(eventId: string, clientId: string): Promise<void> {
    await db
      .insert(eventClients)
      .values({ eventId, clientId })
      .onConflictDoNothing();
  }

  async unenrollClientFromEvent(eventId: string, clientId: string): Promise<void> {
    await db
      .delete(eventClients)
      .where(and(eq(eventClients.eventId, eventId), eq(eventClients.clientId, clientId)));
  }

  async getClientEnrolledEvents(clientId: string): Promise<CalendarEvent[]> {
    // Get event IDs that the client is enrolled in
    const enrolledEventIds = await db
      .select({ eventId: eventClients.eventId })
      .from(eventClients)
      .where(eq(eventClients.clientId, clientId));

    if (enrolledEventIds.length === 0) {
      return [];
    }

    // Get the actual events
    const eventIds = enrolledEventIds.map(row => row.eventId);
    const events: CalendarEvent[] = [];
    
    for (const eventId of eventIds) {
      const event = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, eventId))
        .limit(1);
      
      if (event[0]) {
        events.push(event[0]);
      }
    }

    return events.sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime());
  }

  // Coach Console operations
  async getEventConsoleData(eventId: string, userId: string): Promise<any> {
    // Get event details
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)));

    if (!event) return null;

    // Get routine with exercises if attached
    let routine = null;
    if (event.routineId) {
      routine = await this.getRoutineWithExercises(event.routineId);
    }

    // Get enrolled clients
    const enrolledClients = await this.getEventClients(eventId);

    // Get attendance records for this event
    const attendanceRecords = await this.getAttendanceForEvent(eventId);

    return {
      event,
      routine,
      enrolledClients,
      attendanceRecords,
    };
  }

  async startEventSession(eventId: string, userId: string): Promise<CalendarEvent> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({
        sessionStatus: "in_progress",
        sessionStartedAt: new Date(),
      })
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
      .returning();

    return updatedEvent;
  }

  async completeEventSession(eventId: string, userId: string, sessionNotes?: string): Promise<any> {
    // Update event status
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({
        sessionStatus: "completed",
        sessionCompletedAt: new Date(),
        sessionNotes: sessionNotes || null,
      })
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
      .returning();

    // Generate session summary
    const attendanceRecords = await this.getAttendanceForEvent(eventId);
    const enrolledClients = await this.getEventClients(eventId);
    
    const summary = {
      event: updatedEvent,
      totalEnrolled: enrolledClients.length,
      totalAttended: attendanceRecords.filter(r => r.status === "present").length,
      attendanceRate: enrolledClients.length > 0 
        ? Math.round((attendanceRecords.filter(r => r.status === "present").length / enrolledClients.length) * 100) 
        : 0,
      attendanceRecords,
      sessionNotes: sessionNotes,
    };

    return summary;
  }

  async recordAttendance(eventId: string, clientId: string, status: string): Promise<void> {
    // Check if attendance record already exists
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.eventId, eventId), eq(attendance.clientId, clientId)));

    if (existing) {
      // Update existing record
      await db
        .update(attendance)
        .set({ status, checkedInAt: new Date() })
        .where(and(eq(attendance.eventId, eventId), eq(attendance.clientId, clientId)));
    } else {
      // Create new record
      await db
        .insert(attendance)
        .values({
          eventId,
          clientId,
          status,
          checkedInAt: new Date(),
        });
    }
  }

  async recordSessionMetrics(eventId: string, metrics: any[]): Promise<void> {
    // Insert multiple metrics in a batch
    if (metrics.length > 0) {
      await db.insert(progressMetrics).values(
        metrics.map(metric => ({
          ...metric,
          eventId,
          recordedAt: new Date(),
        }))
      );
    }
  }

  // Program Management operations
  async getPrograms(userId: string): Promise<(Program & { classType?: ClassType; enrollmentCount: number })[]> {
    const result = await db
      .select({
        program: programs,
        classType: classTypes,
        enrollmentCount: sql<number>`count(${programEnrollments.id})`.as('enrollmentCount'),
      })
      .from(programs)
      .leftJoin(classTypes, eq(programs.classTypeId, classTypes.id))
      .leftJoin(programEnrollments, eq(programs.id, programEnrollments.programId))
      .where(eq(programs.createdBy, userId))
      .groupBy(programs.id, classTypes.id);

    return result.map(row => ({
      ...row.program,
      classType: row.classType,
      enrollmentCount: row.enrollmentCount,
    }));
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async getProgramWithSessions(id: string): Promise<(Program & { 
    classType?: ClassType; 
    sessions: (ProgramSession & { routine?: Routine })[] 
  }) | undefined> {
    const [program] = await db
      .select()
      .from(programs)
      .leftJoin(classTypes, eq(programs.classTypeId, classTypes.id))
      .where(eq(programs.id, id));

    if (!program.programs) return undefined;

    const sessions = await db
      .select()
      .from(programSessions)
      .leftJoin(routines, eq(programSessions.routineId, routines.id))
      .where(eq(programSessions.programId, id))
      .orderBy(programSessions.weekNumber, programSessions.dayOfWeek);

    return {
      ...program.programs,
      classType: program.class_types,
      sessions: sessions.map(session => ({
        ...session.program_sessions,
        routine: session.routines,
      })),
    };
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [created] = await db.insert(programs).values(program).returning();
    return created;
  }

  async updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program> {
    const [updated] = await db
      .update(programs)
      .set({ ...program, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    return updated;
  }

  async deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  // Program Session operations
  async getProgramSessions(programId: string): Promise<(ProgramSession & { routine?: Routine })[]> {
    const sessions = await db
      .select()
      .from(programSessions)
      .leftJoin(routines, eq(programSessions.routineId, routines.id))
      .where(eq(programSessions.programId, programId))
      .orderBy(programSessions.weekNumber, programSessions.dayOfWeek);

    return sessions.map(session => ({
      ...session.program_sessions,
      routine: session.routines,
    }));
  }

  async createProgramSession(session: InsertProgramSession): Promise<ProgramSession> {
    const [created] = await db.insert(programSessions).values(session).returning();
    return created;
  }

  async updateProgramSession(id: string, session: Partial<InsertProgramSession>): Promise<ProgramSession> {
    const [updated] = await db
      .update(programSessions)
      .set(session)
      .where(eq(programSessions.id, id))
      .returning();
    return updated;
  }

  async deleteProgramSession(id: string): Promise<void> {
    await db.delete(programSessions).where(eq(programSessions.id, id));
  }

  async generateScheduleForProgram(programId: string, weeks: number): Promise<CalendarEvent[]> {
    const program = await this.getProgram(programId);
    if (!program) throw new Error("Program not found");

    const sessions = await this.getProgramSessions(programId);
    const events: CalendarEvent[] = [];
    const startDate = new Date();

    for (let week = 1; week <= weeks; week++) {
      for (const session of sessions.filter(s => s.weekNumber === week)) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + ((week - 1) * 7) + session.dayOfWeek);
        
        const event = await db.insert(calendarEvents).values({
          title: `${program.name} - ${session.sessionName || 'Session'}`,
          description: `Week ${week} - Auto-generated from program`,
          startDatetime: eventDate,
          endDatetime: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour default
          userId: program.createdBy,
          classTypeId: program.classTypeId,
          routineId: session.routineId,
          location: "Studio",
          sessionStatus: "scheduled",
        }).returning();

        // Generate event targets if routine exists
        if (session.routineId && session.baseParams) {
          const routineExercises = await this.getRoutineExercises(session.routineId);
          const targets = routineExercises.map(re => ({
            eventId: event[0].id,
            routineExerciseId: re.id,
            targets: session.baseParams,
            isGenerated: true,
          }));
          await this.createEventTargets(targets);
        }

        events.push(event[0]);
      }
    }

    return events;
  }

  // Program Enrollment operations
  async getProgramEnrollments(programId: string): Promise<(ProgramEnrollment & { client?: Client; classType?: ClassType })[]> {
    const enrollments = await db
      .select()
      .from(programEnrollments)
      .leftJoin(clients, eq(programEnrollments.clientId, clients.id))
      .leftJoin(classTypes, eq(programEnrollments.classTypeId, classTypes.id))
      .where(eq(programEnrollments.programId, programId));

    return enrollments.map(enrollment => ({
      ...enrollment.program_enrollments,
      client: enrollment.clients,
      classType: enrollment.class_types,
    }));
  }

  async enrollInProgram(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment> {
    const [created] = await db.insert(programEnrollments).values(enrollment).returning();
    return created;
  }

  async updateProgramEnrollment(id: string, enrollment: Partial<InsertProgramEnrollment>): Promise<ProgramEnrollment> {
    const [updated] = await db
      .update(programEnrollments)
      .set(enrollment)
      .where(eq(programEnrollments.id, id))
      .returning();
    return updated;
  }

  async unenrollFromProgram(id: string): Promise<void> {
    await db.delete(programEnrollments).where(eq(programEnrollments.id, id));
  }

  // Event Targets operations
  async getEventTargets(eventId: string): Promise<(EventTarget & { routineExercise?: RoutineExercise & { exercise: Exercise } })[]> {
    const targets = await db
      .select()
      .from(eventTargets)
      .leftJoin(routineExercises, eq(eventTargets.routineExerciseId, routineExercises.id))
      .leftJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(eventTargets.eventId, eventId));

    return targets.map(target => ({
      ...target.event_targets,
      routineExercise: target.routine_exercises ? {
        ...target.routine_exercises,
        exercise: target.exercises!,
      } : undefined,
    }));
  }

  async createEventTargets(targets: InsertEventTarget[]): Promise<EventTarget[]> {
    const created = await db.insert(eventTargets).values(targets).returning();
    return created;
  }

  async updateEventTarget(id: string, target: Partial<InsertEventTarget>): Promise<EventTarget> {
    const [updated] = await db
      .update(eventTargets)
      .set(target)
      .where(eq(eventTargets.id, id))
      .returning();
    return updated;
  }

  // Readiness Check operations
  async getClientReadiness(clientId: string, date?: Date): Promise<ReadinessCheck[]> {
    let query = db.select().from(readinessChecks).where(eq(readinessChecks.clientId, clientId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(and(
        eq(readinessChecks.clientId, clientId),
        sql`${readinessChecks.date} >= ${startOfDay}`,
        sql`${readinessChecks.date} <= ${endOfDay}`
      ));
    }

    return await query.orderBy(desc(readinessChecks.date));
  }

  async createReadinessCheck(check: InsertReadinessCheck): Promise<ReadinessCheck> {
    // Calculate readiness score (simple average of sleep, soreness inverted, stress inverted)
    const readinessScore = Math.round((check.sleep + (6 - check.soreness) + (6 - check.stress)) / 3);
    
    const [created] = await db.insert(readinessChecks).values({
      ...check,
      readinessScore,
    }).returning();
    return created;
  }

  async getLatestReadiness(clientId: string): Promise<ReadinessCheck | undefined> {
    const [latest] = await db
      .select()
      .from(readinessChecks)
      .where(eq(readinessChecks.clientId, clientId))
      .orderBy(desc(readinessChecks.date))
      .limit(1);
    return latest;
  }

  // Performance Record operations
  async getPerformanceRecords(eventId: string, clientId?: string): Promise<(PerformanceRecord & { exercise: Exercise })[]> {
    let query = db
      .select()
      .from(performanceRecords)
      .innerJoin(exercises, eq(performanceRecords.exerciseId, exercises.id))
      .where(eq(performanceRecords.eventId, eventId));

    if (clientId) {
      query = query.where(and(
        eq(performanceRecords.eventId, eventId),
        eq(performanceRecords.clientId, clientId)
      ));
    }

    const records = await query;
    return records.map(record => ({
      ...record.performance_records,
      exercise: record.exercises,
    }));
  }

  async createPerformanceRecord(record: InsertPerformanceRecord): Promise<PerformanceRecord> {
    const [created] = await db.insert(performanceRecords).values(record).returning();
    return created;
  }

  async applyProgression(eventId: string): Promise<any> {
    // Get event and its targets
    const event = await db.select().from(calendarEvents).where(eq(calendarEvents.id, eventId)).limit(1);
    if (!event.length) return null;

    const targets = await this.getEventTargets(eventId);
    const performanceRecords = await this.getPerformanceRecords(eventId);

    // Simple progression logic: adjust targets based on average RPE
    for (const target of targets) {
      if (!target.routineExercise) continue;

      const exerciseRecords = performanceRecords.filter(r => r.exerciseId === target.routineExercise!.exerciseId);
      if (exerciseRecords.length === 0) continue;

      const avgRpe = exerciseRecords.reduce((sum, r) => sum + (r.actual?.rpe || 5), 0) / exerciseRecords.length;
      const currentTargets = target.targets as any || {};

      // Apply progression based on RPE
      if (avgRpe < 6) {
        // Too easy, increase intensity
        if (currentTargets.reps) currentTargets.reps = Math.min(currentTargets.reps + 1, 20);
        if (currentTargets.time) currentTargets.time = Math.min(currentTargets.time + 5, 120);
      } else if (avgRpe > 8) {
        // Too hard, decrease intensity
        if (currentTargets.reps) currentTargets.reps = Math.max(currentTargets.reps - 1, 5);
        if (currentTargets.time) currentTargets.time = Math.max(currentTargets.time - 5, 15);
      }

      // Update the target for next session
      await this.updateEventTarget(target.id, { targets: currentTargets });
    }

    return { message: "Progression applied successfully" };
  }

  // Data seeding operations
  async seedDefaultData(userId: string): Promise<void> {
    try {
      console.log(`Starting default data seeding for user: ${userId}`);
      
      // Check if user already has class types to avoid duplicate seeding
      const existingClassTypes = await this.getClassTypes(userId);
      console.log(`Found ${existingClassTypes.length} existing class types for user: ${userId}`);
      
      if (existingClassTypes.length >= 10) {
        console.log(`User ${userId} already has ${existingClassTypes.length} class types, skipping seeding`);
        return; // Already seeded with complete set
      }
      
      if (existingClassTypes.length > 0) {
        console.log(`User ${userId} has ${existingClassTypes.length} class types but missing defaults, will add missing ones`);
      }

    // Define the top 10 popular class types
    const defaultClassTypes = [
      {
        name: "Yoga",
        description: "A mind-body practice combining physical postures, breathing techniques, and meditation to improve flexibility, strength, and mental well-being.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Zumba",
        description: "High-energy dance fitness class combining Latin rhythms with easy-to-follow dance moves for a fun, effective cardio workout.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "HIIT",
        description: "High-Intensity Interval Training featuring short bursts of intense exercise followed by recovery periods for maximum calorie burn.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Pilates",
        description: "Low-impact exercise focusing on core strength, flexibility, and body alignment through controlled movements and breathing.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "CrossFit",
        description: "Varied functional movements performed at high intensity to improve overall fitness, strength, and conditioning.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Barre",
        description: "Ballet-inspired workout combining isometric movements, stretching, and strengthening exercises for lean muscle development.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Spinning",
        description: "Indoor cycling class with motivating music and varying intensity levels for cardiovascular fitness and endurance.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Kickboxing",
        description: "Martial arts-inspired cardio workout combining punches, kicks, and defensive moves for strength and stress relief.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Strength Training",
        description: "Resistance-based exercises using weights and equipment to build muscle mass, bone density, and metabolic health.",
        isDefault: true,
        createdByUserId: userId,
      },
      {
        name: "Aqua Fitness",
        description: "Water-based exercise program providing low-impact cardiovascular and strength training with joint-friendly resistance.",
        isDefault: true,
        createdByUserId: userId,
      },
    ];

    // Create class types first (faster batch operation)
    console.log(`Creating ${defaultClassTypes.length} default class types for user: ${userId}`);
    const createdClassTypes = [];
    
    for (const classTypeData of defaultClassTypes) {
      try {
        console.log(`Creating class type: ${classTypeData.name} for user: ${userId}`);
        const classType = await this.createClassType(classTypeData);
        createdClassTypes.push(classType);
        console.log(`Created class type: ${classType.name} with ID: ${classType.id}`);
      } catch (error) {
        console.error(`Error creating class type ${classTypeData.name}:`, error);
      }
    }
    
    // Create exercises for all class types (can be done in background)
    console.log(`Creating exercises for ${createdClassTypes.length} class types`);
    for (const classType of createdClassTypes) {
      try {
        await this.createDefaultExercisesForClass(classType, userId);
        console.log(`Created default exercises for class type: ${classType.name}`);
      } catch (error) {
        console.error(`Error creating exercises for ${classType.name}:`, error);
      }
    }
    
    console.log(`Completed default data seeding for user: ${userId}`);
    } catch (error) {
      console.error(`Error in seedDefaultData for user ${userId}:`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }
}

export const storage = new DatabaseStorage();
