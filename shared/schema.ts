import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const difficultyLevelEnum = pgEnum("difficulty_level", ["Beginner", "Intermediate", "Advanced"]);
export const exerciseCategoryEnum = pgEnum("exercise_category", ["strength", "cardio", "flexibility", "balance"]);

// Class Types
export const classTypes = pgTable("class_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercises
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
  equipmentNeeded: text("equipment_needed"),
  primaryMuscles: text("primary_muscles"),
  secondaryMuscles: text("secondary_muscles"),
  category: exerciseCategoryEnum("category").notNull(),
  caloriesPerMinute: integer("calories_per_minute"),
  modifications: text("modifications"),
  safetyNotes: text("safety_notes"),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Routines
export const routines = pgTable("routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  classTypeId: varchar("class_type_id").references(() => classTypes.id),
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(false),
  totalDuration: integer("total_duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Routine Exercises (junction table)
export const routineExercises = pgTable("routine_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routineId: varchar("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  durationSeconds: integer("duration_seconds"),
  repetitions: integer("repetitions"),
  sets: integer("sets"),
  restSeconds: integer("rest_seconds"),
  musicTitle: varchar("music_title"),
  musicNotes: text("music_notes"),
  notes: text("notes"),
});

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  classTypeId: varchar("class_type_id").references(() => classTypes.id),
  routineId: varchar("routine_id").references(() => routines.id),
  title: varchar("title", { length: 200 }).notNull(),
  startDatetime: timestamp("start_datetime").notNull(),
  endDatetime: timestamp("end_datetime").notNull(),
  location: varchar("location"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Saved Routines
export const userSavedRoutines = pgTable("user_saved_routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  routineId: varchar("routine_id").notNull().references(() => routines.id),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  classTypes: many(classTypes),
  exercises: many(exercises),
  routines: many(routines),
  calendarEvents: many(calendarEvents),
  savedRoutines: many(userSavedRoutines),
}));

export const classTypesRelations = relations(classTypes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [classTypes.createdByUserId],
    references: [users.id],
  }),
  routines: many(routines),
  calendarEvents: many(calendarEvents),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [exercises.createdByUserId],
    references: [users.id],
  }),
  routineExercises: many(routineExercises),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [routines.createdByUserId],
    references: [users.id],
  }),
  classType: one(classTypes, {
    fields: [routines.classTypeId],
    references: [classTypes.id],
  }),
  routineExercises: many(routineExercises),
  calendarEvents: many(calendarEvents),
  savedByUsers: many(userSavedRoutines),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(routines, {
    fields: [routineExercises.routineId],
    references: [routines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  classType: one(classTypes, {
    fields: [calendarEvents.classTypeId],
    references: [classTypes.id],
  }),
  routine: one(routines, {
    fields: [calendarEvents.routineId],
    references: [routines.id],
  }),
}));

export const userSavedRoutinesRelations = relations(userSavedRoutines, ({ one }) => ({
  user: one(users, {
    fields: [userSavedRoutines.userId],
    references: [users.id],
  }),
  routine: one(routines, {
    fields: [userSavedRoutines.routineId],
    references: [routines.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassTypeSchema = createInsertSchema(classTypes).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertRoutineSchema = createInsertSchema(routines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoutineExerciseSchema = createInsertSchema(routineExercises).omit({
  id: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserSavedRoutineSchema = createInsertSchema(userSavedRoutines).omit({
  id: true,
  savedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClassType = typeof classTypes.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type UserSavedRoutine = typeof userSavedRoutines.$inferSelect;

export type InsertClassType = z.infer<typeof insertClassTypeSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type InsertRoutineExercise = z.infer<typeof insertRoutineExerciseSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertUserSavedRoutine = z.infer<typeof insertUserSavedRoutineSchema>;
