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
  classTypeId: varchar("class_type_id").references(() => classTypes.id),
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
  exercises: many(exercises),
  routines: many(routines),
  calendarEvents: many(calendarEvents),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [exercises.createdByUserId],
    references: [users.id],
  }),
  classType: one(classTypes, {
    fields: [exercises.classTypeId],
    references: [classTypes.id],
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

// Client Management Tables
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull().references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  goals: varchar("goals"),
  medicalConditions: varchar("medical_conditions"),
  injuries: varchar("injuries"),
  fitnessLevel: varchar("fitness_level"), // Beginner, Intermediate, Advanced
  preferredClassTypes: varchar("preferred_class_types").array(),
  notes: varchar("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientNotes = pgTable("client_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  trainerId: varchar("trainer_id").notNull().references(() => users.id),
  note: varchar("note").notNull(),
  noteType: varchar("note_type").notNull(), // general, progress, injury, goal
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  status: varchar("status").notNull(), // checked_in, no_show, cancelled
  checkedInAt: timestamp("checked_in_at"),
  notes: varchar("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attendance_client").on(table.clientId),
  index("idx_attendance_event").on(table.eventId),
]);

export const progressMetrics = pgTable("progress_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").references(() => exercises.id),
  routineId: varchar("routine_id").references(() => routines.id),
  metricType: varchar("metric_type").notNull(), // weight, reps, time, distance, rpe, body_weight
  value: varchar("value").notNull(), // Stored as string to handle different units
  unit: varchar("unit"), // kg, lbs, seconds, minutes, meters, km, etc.
  rpe: integer("rpe"), // Rate of Perceived Exertion (1-10)
  notes: varchar("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_progress_client_date").on(table.clientId, table.recordedAt),
  index("idx_progress_exercise").on(table.exerciseId),
]);

export const eventClients = pgTable("event_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
}, (table) => [
  index("idx_event_clients_event").on(table.eventId),
  index("idx_event_clients_client").on(table.clientId),
  // Unique constraint to prevent duplicate enrollments
  index("idx_event_client_unique").on(table.eventId, table.clientId),
]);

// Client Management Relations
export const clientsRelations = relations(clients, ({ one, many }) => ({
  trainer: one(users, {
    fields: [clients.trainerId],
    references: [users.id],
  }),
  notes: many(clientNotes),
  attendance: many(attendance),
  progressMetrics: many(progressMetrics),
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, {
    fields: [clientNotes.clientId],
    references: [clients.id],
  }),
  trainer: one(users, {
    fields: [clientNotes.trainerId],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  client: one(clients, {
    fields: [attendance.clientId],
    references: [clients.id],
  }),
  event: one(calendarEvents, {
    fields: [attendance.eventId],
    references: [calendarEvents.id],
  }),
}));

export const progressMetricsRelations = relations(progressMetrics, ({ one }) => ({
  client: one(clients, {
    fields: [progressMetrics.clientId],
    references: [clients.id],
  }),
  exercise: one(exercises, {
    fields: [progressMetrics.exerciseId],
    references: [exercises.id],
  }),
  routine: one(routines, {
    fields: [progressMetrics.routineId],
    references: [routines.id],
  }),
}));

export const eventClientsRelations = relations(eventClients, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventClients.eventId],
    references: [calendarEvents.id],
  }),
  client: one(clients, {
    fields: [eventClients.clientId],
    references: [clients.id],
  }),
}));

// Client Management Insert Schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertProgressMetricSchema = createInsertSchema(progressMetrics).omit({
  id: true,
  createdAt: true,
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

export type Client = typeof clients.$inferSelect;
export type ClientNote = typeof clientNotes.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type ProgressMetric = typeof progressMetrics.$inferSelect;

export type InsertClassType = z.infer<typeof insertClassTypeSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type InsertRoutineExercise = z.infer<typeof insertRoutineExerciseSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertUserSavedRoutine = z.infer<typeof insertUserSavedRoutineSchema>;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertProgressMetric = z.infer<typeof insertProgressMetricSchema>;
