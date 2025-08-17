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

  // Exercise operations
  async getExercises(filters?: {
    search?: string;
    category?: string;
    difficulty?: string;
    equipment?: string;
    userId?: string;
  }): Promise<Exercise[]> {
    let query = db.select().from(exercises);
    const conditions = [];

    if (filters?.search) {
      conditions.push(ilike(exercises.name, `%${filters.search}%`));
    }
    if (filters?.category) {
      conditions.push(eq(exercises.category, filters.category as any));
    }
    if (filters?.difficulty) {
      conditions.push(eq(exercises.difficultyLevel, filters.difficulty as any));
    }
    if (filters?.equipment) {
      conditions.push(ilike(exercises.equipmentNeeded, `%${filters.equipment}%`));
    }

    // Show public exercises and user's private exercises
    if (filters?.userId) {
      conditions.push(
        sql`${exercises.isPublic} = true OR ${exercises.createdByUserId} = ${filters.userId}`
      );
    } else {
      conditions.push(eq(exercises.isPublic, true));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(exercises.name);
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

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(calendarEvents.userId, userId),
          sql`${calendarEvents.startDatetime} >= ${startDate}`,
          sql`${calendarEvents.endDatetime} <= ${endDate}`
        )
      );
    }

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
      .leftJoin(routineExercises, eq(routines.id, routineExercises.routineId))
      .where(eq(routines.isPublic, true));

    const conditions = [eq(routines.isPublic, true)];

    if (filters?.search) {
      conditions.push(ilike(routines.name, `%${filters.search}%`));
    }
    if (filters?.classType) {
      conditions.push(eq(routines.classTypeId, filters.classType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

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
