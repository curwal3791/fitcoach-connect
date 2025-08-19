import {
  users,
  classTypes,
  exercises,
  routines,
  routineExercises,
  calendarEvents,
  userSavedRoutines,
  type User,
  type UpsertUser,
  type ClassType,
  type Exercise,
  type Routine,
  type RoutineExercise,
  type CalendarEvent,
  type UserSavedRoutine,
  type InsertClassType,
  type InsertExercise,
  type InsertRoutine,
  type InsertRoutineExercise,
  type InsertCalendarEvent,
  type InsertUserSavedRoutine,
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
    userId?: string;
  }): Promise<Exercise[]>;
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
    userId?: string;
  }): Promise<Exercise[]> {
    console.log('=== getExercises called with filters:', JSON.stringify(filters, null, 2));
    let query = db.select().from(exercises);
    const conditions = [];

    if (filters?.search && filters.search.trim() !== '') {
      conditions.push(ilike(exercises.name, `%${filters.search}%`));
      console.log('Added search filter:', filters.search);
    }
    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(exercises.category, filters.category as any));
      console.log('Added category filter:', filters.category);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      conditions.push(eq(exercises.difficultyLevel, filters.difficulty as any));
      console.log('Added difficulty filter:', filters.difficulty);
    }
    if (filters?.equipment && filters.equipment !== 'all') {
      if (filters.equipment === 'No Equipment') {
        conditions.push(
          sql`(${exercises.equipmentNeeded} IS NULL OR ${exercises.equipmentNeeded} = '' OR ${exercises.equipmentNeeded} = 'None')`
        );
      } else {
        conditions.push(ilike(exercises.equipmentNeeded, `%${filters.equipment}%`));
      }
      console.log('Added equipment filter:', filters.equipment);
    }

    // Show public exercises and user's private exercises
    if (filters?.userId) {
      conditions.push(
        sql`${exercises.isPublic} = true OR ${exercises.createdByUserId} = ${filters.userId}`
      );
    } else {
      conditions.push(eq(exercises.isPublic, true));
    }

    console.log('Total conditions applied:', conditions.length);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(exercises.name);
    console.log('Query result count:', result.length, 'with filters:', filters);
    return result;
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
          musicArtist: ex.musicArtist,
          musicBpm: ex.musicBpm,
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
    let query = db
      .select({
        event: calendarEvents,
        classType: classTypes,
        routine: routines,
      })
      .from(calendarEvents)
      .leftJoin(classTypes, eq(calendarEvents.classTypeId, classTypes.id))
      .leftJoin(routines, eq(calendarEvents.routineId, routines.id))
      .where(eq(calendarEvents.userId, userId));

    const conditions = [eq(calendarEvents.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(sql`${calendarEvents.startDatetime} >= ${startDate}`);
      conditions.push(sql`${calendarEvents.endDatetime} <= ${endDate}`);
    }
    
    query = query.where(and(...conditions));

    const results = await query.orderBy(calendarEvents.startDatetime);

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
    let query = db
      .select({
        routine: routines,
        classType: classTypes,
        createdBy: users,
        exerciseCount: sql<number>`COUNT(${routineExercises.id})::int`,
      })
      .from(routines)
      .leftJoin(classTypes, eq(routines.classTypeId, classTypes.id))
      .innerJoin(users, eq(routines.createdByUserId, users.id))
      .leftJoin(routineExercises, eq(routines.id, routineExercises.routineId));

    const conditions = [eq(routines.isPublic, true)];

    if (filters?.search) {
      conditions.push(ilike(routines.name, `%${filters.search}%`));
    }
    if (filters?.classType) {
      conditions.push(eq(routines.classTypeId, filters.classType));
    }

    query = query.where(and(...conditions));

    const results = await query
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
}

export const storage = new DatabaseStorage();
