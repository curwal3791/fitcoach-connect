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
  eventClients,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
        createdByUserId: userId,
        isPublic: true,
      });
    }
  }

  private getDefaultExercisesForClassType(className: string): Omit<InsertExercise, 'createdByUserId' | 'isPublic'>[] {
    const name = className.toLowerCase();
    
    if (name.includes('hiit') || name.includes('cardio')) {
      return [
        {
          name: "Jumping Jacks",
          description: "Full-body cardio exercise that increases heart rate and burns calories",
          difficultyLevel: "Beginner",
          equipmentNeeded: "None",
          primaryMuscles: "Full body",
          secondaryMuscles: "Core",
          category: "cardio",
          caloriesPerMinute: 8,
          modifications: "Step touch for low impact",
          safetyNotes: "Land softly on balls of feet"
        },
        {
          name: "Burpees",
          description: "High-intensity full-body exercise combining squat, plank, and jump",
          difficultyLevel: "Advanced",
          equipmentNeeded: "None",
          primaryMuscles: "Full body",
          secondaryMuscles: "Core, shoulders",
          category: "cardio",
          caloriesPerMinute: 12,
          modifications: "Remove jump or push-up",
          safetyNotes: "Maintain proper form throughout"
        },
        {
          name: "High Knees",
          description: "Running in place while lifting knees to waist level",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "None",
          primaryMuscles: "Legs, core",
          secondaryMuscles: "Glutes",
          category: "cardio",
          caloriesPerMinute: 10,
          modifications: "March in place for lower intensity",
          safetyNotes: "Keep core engaged"
        },
        {
          name: "Mountain Climbers",
          description: "Plank position with alternating knee drives",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "None",
          primaryMuscles: "Core, shoulders",
          secondaryMuscles: "Legs",
          category: "cardio",
          caloriesPerMinute: 9,
          modifications: "Slow tempo or hands on elevated surface",
          safetyNotes: "Keep hips level and core tight"
        }
      ];
    }
    
    if (name.includes('strength') || name.includes('weight')) {
      return [
        {
          name: "Push-ups",
          description: "Upper body strength exercise targeting chest, shoulders, and triceps",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "None",
          primaryMuscles: "Chest, shoulders, triceps",
          secondaryMuscles: "Core",
          category: "strength",
          caloriesPerMinute: 6,
          modifications: "Knee push-ups or incline push-ups",
          safetyNotes: "Keep straight line from head to heels"
        },
        {
          name: "Squats",
          description: "Lower body strength exercise targeting glutes and quadriceps",
          difficultyLevel: "Beginner",
          equipmentNeeded: "None",
          primaryMuscles: "Glutes, quadriceps",
          secondaryMuscles: "Core, calves",
          category: "strength",
          caloriesPerMinute: 5,
          modifications: "Chair-assisted squats",
          safetyNotes: "Keep knees behind toes"
        },
        {
          name: "Lunges",
          description: "Single-leg strength exercise for lower body and balance",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "None",
          primaryMuscles: "Glutes, quadriceps",
          secondaryMuscles: "Hamstrings, calves",
          category: "strength",
          caloriesPerMinute: 6,
          modifications: "Stationary lunges or assisted lunges",
          safetyNotes: "Keep front knee over ankle"
        },
        {
          name: "Plank",
          description: "Core strengthening exercise in push-up position hold",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "None",
          primaryMuscles: "Core",
          secondaryMuscles: "Shoulders, glutes",
          category: "strength",
          caloriesPerMinute: 4,
          modifications: "Knee plank or wall plank",
          safetyNotes: "Keep straight line from head to heels"
        }
      ];
    }
    
    if (name.includes('yoga') || name.includes('pilates')) {
      return [
        {
          name: "Child's Pose",
          description: "Restorative yoga pose for relaxation and gentle stretching",
          difficultyLevel: "Beginner",
          equipmentNeeded: "Yoga mat",
          primaryMuscles: "Back, hips",
          secondaryMuscles: "Shoulders",
          category: "flexibility",
          caloriesPerMinute: 2,
          modifications: "Wide-knee child's pose",
          safetyNotes: "Listen to your body, don't force"
        },
        {
          name: "Downward Dog",
          description: "Foundational yoga pose that stretches and strengthens",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "Yoga mat",
          primaryMuscles: "Shoulders, hamstrings",
          secondaryMuscles: "Core, calves",
          category: "flexibility",
          caloriesPerMinute: 3,
          modifications: "Hands on blocks or bend knees",
          safetyNotes: "Distribute weight evenly"
        },
        {
          name: "Cat-Cow Stretch",
          description: "Spinal mobility exercise alternating between arch and round",
          difficultyLevel: "Beginner",
          equipmentNeeded: "Yoga mat",
          primaryMuscles: "Spine, core",
          secondaryMuscles: "Shoulders",
          category: "flexibility",
          caloriesPerMinute: 2,
          modifications: "Seated version available",
          safetyNotes: "Move slowly and mindfully"
        },
        {
          name: "Warrior I",
          description: "Standing yoga pose that builds strength and stability",
          difficultyLevel: "Intermediate",
          equipmentNeeded: "Yoga mat",
          primaryMuscles: "Legs, core",
          secondaryMuscles: "Shoulders, back",
          category: "balance",
          caloriesPerMinute: 3,
          modifications: "Use wall for support",
          safetyNotes: "Keep front knee over ankle"
        }
      ];
    }
    
    // Default exercises for any other class type
    return [
      {
        name: "Basic Warm-up",
        description: "Light movement to prepare the body for exercise",
        difficultyLevel: "Beginner",
        equipmentNeeded: "None",
        primaryMuscles: "Full body",
        secondaryMuscles: "Core",
        category: "cardio",
        caloriesPerMinute: 3,
        modifications: "Adjust intensity as needed",
        safetyNotes: "Start slowly and gradually increase intensity"
      },
      {
        name: "Cool-down Stretch",
        description: "Gentle stretching to help muscles recover",
        difficultyLevel: "Beginner",
        equipmentNeeded: "None",
        primaryMuscles: "Full body",
        secondaryMuscles: "Core",
        category: "flexibility",
        caloriesPerMinute: 2,
        modifications: "Hold stretches as comfortable",
        safetyNotes: "Never bounce while stretching"
      }
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
}

export const storage = new DatabaseStorage();
