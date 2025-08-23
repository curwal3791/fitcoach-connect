import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./emailAuth";
import { z } from "zod";
import {
  insertClassTypeSchema,
  insertExerciseSchema,
  insertRoutineSchema,
  insertRoutineExerciseSchema,
  insertCalendarEventSchema,
  insertClientSchema,
  insertClientNoteSchema,
  insertAttendanceSchema,
  insertProgressMetricSchema,
  insertProgramSchema,
  insertProgramSessionSchema,
  insertProgramEnrollmentSchema,
  insertEventTargetSchema,
  insertReadinessCheckSchema,
  insertPerformanceRecordSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // req.user is already the full user object from our auth middleware
      const user = req.user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Analytics data
  app.get('/api/dashboard/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analytics = await storage.getAnalyticsData(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Class Types routes
  app.get('/api/class-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const classTypes = await storage.getClassTypes(userId);
      res.json(classTypes);
    } catch (error) {
      console.error("Error fetching class types:", error);
      res.status(500).json({ message: "Failed to fetch class types" });
    }
  });

  app.post('/api/class-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertClassTypeSchema.parse({
        ...req.body,
        createdByUserId: userId,
      });
      const classType = await storage.createClassType(data);
      
      // Create default exercises for this class type
      await storage.createDefaultExercisesForClass(classType, userId);
      
      res.status(201).json(classType);
    } catch (error) {
      console.error("Error creating class type:", error);
      res.status(400).json({ message: "Failed to create class type" });
    }
  });

  app.patch('/api/class-types/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertClassTypeSchema.partial().parse(req.body);
      const classType = await storage.updateClassType(id, data);
      res.json(classType);
    } catch (error) {
      console.error("Error updating class type:", error);
      res.status(400).json({ message: "Failed to update class type" });
    }
  });

  app.delete('/api/class-types/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClassType(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting class type:", error);
      res.status(400).json({ message: "Failed to delete class type" });
    }
  });

  // Exercises routes
  app.get('/api/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { search, category, difficulty, equipment, classType } = req.query;
      const exercises = await storage.getExercises({
        search: search as string,
        category: category as string,
        difficulty: difficulty as string,
        equipment: equipment as string,
        classType: classType as string,
        userId,
      });
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.get('/api/exercises/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const exercise = await storage.getExercise(id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ message: "Failed to fetch exercise" });
    }
  });

  app.post('/api/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertExerciseSchema.parse({
        ...req.body,
        createdByUserId: userId,
      });
      const exercise = await storage.createExercise(data);
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(400).json({ message: "Failed to create exercise" });
    }
  });

  app.put('/api/exercises/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(id, data);
      res.json(exercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      res.status(400).json({ message: "Failed to update exercise" });
    }
  });

  app.delete('/api/exercises/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExercise(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(400).json({ message: "Failed to delete exercise" });
    }
  });

  // Routines routes
  app.get('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const routines = await storage.getRoutines(userId);
      res.json(routines);
    } catch (error) {
      console.error("Error fetching routines:", error);
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.get('/api/routines/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const routine = await storage.getRoutineWithExercises(id);
      if (!routine) {
        return res.status(404).json({ message: "Routine not found" });
      }
      res.json(routine);
    } catch (error) {
      console.error("Error fetching routine:", error);
      res.status(500).json({ message: "Failed to fetch routine" });
    }
  });

  app.post('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertRoutineSchema.parse({
        ...req.body,
        createdByUserId: userId,
      });
      const routine = await storage.createRoutine(data);
      res.status(201).json(routine);
    } catch (error) {
      console.error("Error creating routine:", error);
      res.status(400).json({ message: "Failed to create routine" });
    }
  });

  app.put('/api/routines/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertRoutineSchema.partial().parse(req.body);
      const routine = await storage.updateRoutine(id, data);
      res.json(routine);
    } catch (error) {
      console.error("Error updating routine:", error);
      res.status(400).json({ message: "Failed to update routine" });
    }
  });

  app.delete('/api/routines/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRoutine(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting routine:", error);
      res.status(400).json({ message: "Failed to delete routine" });
    }
  });

  app.post('/api/routines/:id/duplicate', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const routine = await storage.duplicateRoutine(id, name, userId);
      res.status(201).json(routine);
    } catch (error) {
      console.error("Error duplicating routine:", error);
      res.status(400).json({ message: "Failed to duplicate routine" });
    }
  });

  // Routine Exercises routes
  app.get('/api/routines/:routineId/exercises', isAuthenticated, async (req, res) => {
    try {
      const { routineId } = req.params;
      const exercises = await storage.getRoutineExercises(routineId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching routine exercises:", error);
      res.status(500).json({ message: "Failed to fetch routine exercises" });
    }
  });

  app.post('/api/routines/:routineId/exercises', isAuthenticated, async (req, res) => {
    try {
      const { routineId } = req.params;
      const data = insertRoutineExerciseSchema.parse({
        ...req.body,
        routineId,
      });
      const routineExercise = await storage.addExerciseToRoutine(data);
      res.status(201).json(routineExercise);
    } catch (error) {
      console.error("Error adding exercise to routine:", error);
      res.status(400).json({ message: "Failed to add exercise to routine" });
    }
  });

  app.put('/api/routines/:routineId/exercises/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertRoutineExerciseSchema.partial().parse(req.body);
      const routineExercise = await storage.updateRoutineExercise(id, data);
      res.json(routineExercise);
    } catch (error) {
      console.error("Error updating routine exercise:", error);
      res.status(400).json({ message: "Failed to update routine exercise" });
    }
  });

  app.delete('/api/routines/:routineId/exercises/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeExerciseFromRoutine(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing exercise from routine:", error);
      res.status(400).json({ message: "Failed to remove exercise from routine" });
    }
  });

  app.put('/api/routines/:routineId/exercises/reorder', isAuthenticated, async (req, res) => {
    try {
      const { routineId } = req.params;
      const { exerciseIds } = req.body;
      
      if (!Array.isArray(exerciseIds)) {
        return res.status(400).json({ message: "exerciseIds must be an array" });
      }

      await storage.reorderRoutineExercises(routineId, exerciseIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error reordering routine exercises:", error);
      res.status(400).json({ message: "Failed to reorder routine exercises" });
    }
  });

  // Calendar routes
  app.get('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : undefined;
      const endDate = end ? new Date(end as string) : undefined;
      
      const events = await storage.getCalendarEvents(userId, startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Convert string dates to Date objects before validation
      const requestData = {
        ...req.body,
        userId,
        startDatetime: new Date(req.body.startDatetime),
        endDatetime: new Date(req.body.endDatetime),
      };
      
      const data = insertCalendarEventSchema.parse(requestData);
      const event = await storage.createCalendarEvent(data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(400).json({ message: "Failed to create calendar event" });
    }
  });

  app.put('/api/calendar/events/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert string dates to Date objects if they exist
      const requestData = { ...req.body };
      if (req.body.startDatetime) {
        requestData.startDatetime = new Date(req.body.startDatetime);
      }
      if (req.body.endDatetime) {
        requestData.endDatetime = new Date(req.body.endDatetime);
      }
      
      const data = insertCalendarEventSchema.partial().parse(requestData);
      const event = await storage.updateCalendarEvent(id, data);
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(400).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete('/api/calendar/events/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCalendarEvent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(400).json({ message: "Failed to delete calendar event" });
    }
  });

  // Community routes
  app.get('/api/community/routines', isAuthenticated, async (req, res) => {
    try {
      const { search, classType } = req.query;
      const routines = await storage.getCommunityRoutines({
        search: search as string,
        classType: classType as string,
      });
      res.json(routines);
    } catch (error) {
      console.error("Error fetching community routines:", error);
      res.status(500).json({ message: "Failed to fetch community routines" });
    }
  });

  app.post('/api/routines/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const saved = await storage.saveRoutine(userId, id);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving routine:", error);
      res.status(400).json({ message: "Failed to save routine" });
    }
  });

  app.delete('/api/routines/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await storage.unsaveRoutine(userId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving routine:", error);
      res.status(400).json({ message: "Failed to unsave routine" });
    }
  });

  app.get('/api/saved-routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const savedRoutines = await storage.getUserSavedRoutines(userId);
      res.json(savedRoutines);
    } catch (error) {
      console.error("Error fetching saved routines:", error);
      res.status(500).json({ message: "Failed to fetch saved routines" });
    }
  });

  // Client Management routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const trainerId = req.user.id;
      const clients = await storage.getClients(trainerId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const trainerId = req.user.id;
      const clientData = insertClientSchema.parse({
        ...req.body,
        trainerId,
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, updateData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Client Notes routes
  app.get('/api/clients/:clientId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const notes = await storage.getClientNotes(req.params.clientId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching client notes:", error);
      res.status(500).json({ message: "Failed to fetch client notes" });
    }
  });

  app.post('/api/clients/:clientId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const trainerId = req.user.id;
      const noteData = insertClientNoteSchema.parse({
        ...req.body,
        clientId: req.params.clientId,
        trainerId,
      });
      const note = await storage.createClientNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating client note:", error);
      res.status(400).json({ message: "Failed to create client note", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Attendance routes
  app.get('/api/events/:eventId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const attendance = await storage.getAttendanceForEvent(req.params.eventId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching event attendance:", error);
      res.status(500).json({ message: "Failed to fetch event attendance" });
    }
  });

  app.get('/api/clients/:clientId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const attendance = await storage.getClientAttendance(req.params.clientId, limit);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching client attendance:", error);
      res.status(500).json({ message: "Failed to fetch client attendance" });
    }
  });

  app.post('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(400).json({ message: "Failed to create attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/attendance/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, updateData);
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(400).json({ message: "Failed to update attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Progress Metrics routes
  app.get('/api/clients/:clientId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const exerciseId = req.query.exerciseId as string;
      const progress = await storage.getClientProgress(req.params.clientId, exerciseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching client progress:", error);
      res.status(500).json({ message: "Failed to fetch client progress" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const metricData = insertProgressMetricSchema.parse(req.body);
      const metric = await storage.createProgressMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating progress metric:", error);
      res.status(400).json({ message: "Failed to create progress metric", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Calendar Event Clients routes (enrollment)
  app.get("/api/calendar/events/:eventId/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getEventClients(req.params.eventId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching event clients:", error);
      res.status(500).json({ message: "Failed to fetch event clients" });
    }
  });

  app.post("/api/calendar/events/:eventId/clients", isAuthenticated, async (req, res) => {
    try {
      const { clientId } = req.body;
      await storage.enrollClientInEvent(req.params.eventId, clientId);
      res.status(201).json({ message: "Client enrolled successfully" });
    } catch (error) {
      console.error("Error enrolling client:", error);
      res.status(400).json({ message: "Failed to enroll client", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/calendar/events/:eventId/clients/:clientId", isAuthenticated, async (req, res) => {
    try {
      await storage.unenrollClientFromEvent(req.params.eventId, req.params.clientId);
      res.json({ message: "Client unenrolled successfully" });
    } catch (error) {
      console.error("Error unenrolling client:", error);
      res.status(400).json({ message: "Failed to unenroll client", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/calendar/events/client/:clientId", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getClientEnrolledEvents(req.params.clientId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching client enrolled events:", error);
      res.status(500).json({ message: "Failed to fetch client enrolled events" });
    }
  });

  // Coach Console Routes - Event-aware session management
  app.get("/api/events/:eventId/console", isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      
      // Get event details with routine and enrolled clients
      const eventData = await storage.getEventConsoleData(eventId, userId);
      
      if (!eventData) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(eventData);
    } catch (error) {
      console.error("Error fetching event console data:", error);
      res.status(500).json({ message: "Failed to fetch event data" });
    }
  });

  app.post("/api/events/:eventId/start", isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      
      const updatedEvent = await storage.startEventSession(eventId, userId);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error starting event session:", error);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  app.post("/api/events/:eventId/complete", isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { sessionNotes } = req.body;
      const userId = req.user.id;
      
      const sessionSummary = await storage.completeEventSession(eventId, userId, sessionNotes);
      res.json(sessionSummary);
    } catch (error) {
      console.error("Error completing event session:", error);
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  app.post("/api/events/:eventId/checkin", isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { clientId, status } = req.body;
      
      await storage.recordAttendance(eventId, clientId, status || "present");
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording attendance:", error);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  app.post("/api/events/:eventId/metrics", isAuthenticated, async (req, res) => {
    try {
      const { eventId } = req.params;
      const metricsData = req.body; // Array of metrics to record
      
      await storage.recordSessionMetrics(eventId, metricsData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording metrics:", error);
      res.status(500).json({ message: "Failed to record metrics" });
    }
  });

  // Program Management Routes - Adaptive Program Builder
  app.get('/api/programs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const programs = await storage.getPrograms(userId);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get('/api/programs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const program = await storage.getProgramWithSessions(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ message: "Failed to fetch program" });
    }
  });

  app.post('/api/programs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const programData = insertProgramSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ message: "Failed to create program", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/programs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(req.params.id, updateData);
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(400).json({ message: "Failed to update program", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/programs/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  // Program Session Routes
  app.get('/api/programs/:programId/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const sessions = await storage.getProgramSessions(req.params.programId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching program sessions:", error);
      res.status(500).json({ message: "Failed to fetch program sessions" });
    }
  });

  app.post('/api/programs/:programId/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const sessionData = insertProgramSessionSchema.parse({
        ...req.body,
        programId: req.params.programId,
      });
      const session = await storage.createProgramSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating program session:", error);
      res.status(400).json({ message: "Failed to create program session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/program-sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertProgramSessionSchema.partial().parse(req.body);
      const session = await storage.updateProgramSession(req.params.id, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating program session:", error);
      res.status(400).json({ message: "Failed to update program session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/program-sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProgramSession(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program session:", error);
      res.status(500).json({ message: "Failed to delete program session" });
    }
  });

  // Generate calendar events from program
  app.post('/api/programs/:programId/generate-schedule', isAuthenticated, async (req: any, res) => {
    try {
      const { weeks } = req.body;
      const events = await storage.generateScheduleForProgram(req.params.programId, weeks || 4);
      res.json(events);
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(400).json({ message: "Failed to generate schedule", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Program Enrollment Routes
  app.get('/api/programs/:programId/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const enrollments = await storage.getProgramEnrollments(req.params.programId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching program enrollments:", error);
      res.status(500).json({ message: "Failed to fetch program enrollments" });
    }
  });

  app.post('/api/programs/:programId/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const enrollmentData = insertProgramEnrollmentSchema.parse({
        ...req.body,
        programId: req.params.programId,
        startDate: new Date(req.body.startDate),
      });
      const enrollment = await storage.enrollInProgram(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in program:", error);
      res.status(400).json({ message: "Failed to enroll in program", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/program-enrollments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertProgramEnrollmentSchema.partial().parse(req.body);
      const enrollment = await storage.updateProgramEnrollment(req.params.id, updateData);
      res.json(enrollment);
    } catch (error) {
      console.error("Error updating program enrollment:", error);
      res.status(400).json({ message: "Failed to update program enrollment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/program-enrollments/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.unenrollFromProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unenrolling from program:", error);
      res.status(500).json({ message: "Failed to unenroll from program" });
    }
  });

  // Event Targets Routes (for auto-generated targets)
  app.get('/api/events/:eventId/targets', isAuthenticated, async (req: any, res) => {
    try {
      const targets = await storage.getEventTargets(req.params.eventId);
      res.json(targets);
    } catch (error) {
      console.error("Error fetching event targets:", error);
      res.status(500).json({ message: "Failed to fetch event targets" });
    }
  });

  app.post('/api/events/:eventId/targets', isAuthenticated, async (req: any, res) => {
    try {
      const targetsData = req.body.map((target: any) => ({
        ...insertEventTargetSchema.parse(target),
        eventId: req.params.eventId,
      }));
      const targets = await storage.createEventTargets(targetsData);
      res.status(201).json(targets);
    } catch (error) {
      console.error("Error creating event targets:", error);
      res.status(400).json({ message: "Failed to create event targets", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch('/api/event-targets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = insertEventTargetSchema.partial().parse(req.body);
      const target = await storage.updateEventTarget(req.params.id, updateData);
      res.json(target);
    } catch (error) {
      console.error("Error updating event target:", error);
      res.status(400).json({ message: "Failed to update event target", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Readiness Check Routes
  app.get('/api/clients/:clientId/readiness', isAuthenticated, async (req: any, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const readiness = await storage.getClientReadiness(req.params.clientId, date);
      res.json(readiness);
    } catch (error) {
      console.error("Error fetching client readiness:", error);
      res.status(500).json({ message: "Failed to fetch client readiness" });
    }
  });

  app.post('/api/clients/:clientId/readiness', isAuthenticated, async (req: any, res) => {
    try {
      const readinessData = insertReadinessCheckSchema.parse({
        ...req.body,
        clientId: req.params.clientId,
        date: new Date(req.body.date),
      });
      const readiness = await storage.createReadinessCheck(readinessData);
      res.status(201).json(readiness);
    } catch (error) {
      console.error("Error creating readiness check:", error);
      res.status(400).json({ message: "Failed to create readiness check", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get('/api/clients/:clientId/readiness/latest', isAuthenticated, async (req: any, res) => {
    try {
      const readiness = await storage.getLatestReadiness(req.params.clientId);
      res.json(readiness);
    } catch (error) {
      console.error("Error fetching latest readiness:", error);
      res.status(500).json({ message: "Failed to fetch latest readiness" });
    }
  });

  // Performance Record Routes
  app.get('/api/events/:eventId/performance', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.query.clientId as string;
      const performance = await storage.getPerformanceRecords(req.params.eventId, clientId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance records:", error);
      res.status(500).json({ message: "Failed to fetch performance records" });
    }
  });

  app.post('/api/events/:eventId/performance', isAuthenticated, async (req: any, res) => {
    try {
      const performanceData = insertPerformanceRecordSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const performance = await storage.createPerformanceRecord(performanceData);
      res.status(201).json(performance);
    } catch (error) {
      console.error("Error creating performance record:", error);
      res.status(400).json({ message: "Failed to create performance record", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Apply Progression to Event
  app.post('/api/events/:eventId/apply-progression', isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.applyProgression(req.params.eventId);
      res.json(result);
    } catch (error) {
      console.error("Error applying progression:", error);
      res.status(500).json({ message: "Failed to apply progression", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
