import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertClassTypeSchema,
  insertExerciseSchema,
  insertRoutineSchema,
  insertRoutineExerciseSchema,
  insertCalendarEventSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Class Types routes
  app.get('/api/class-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const classTypes = await storage.getClassTypes(userId);
      res.json(classTypes);
    } catch (error) {
      console.error("Error fetching class types:", error);
      res.status(500).json({ message: "Failed to fetch class types" });
    }
  });

  app.post('/api/class-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      await storage.unsaveRoutine(userId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving routine:", error);
      res.status(400).json({ message: "Failed to unsave routine" });
    }
  });

  app.get('/api/saved-routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedRoutines = await storage.getUserSavedRoutines(userId);
      res.json(savedRoutines);
    } catch (error) {
      console.error("Error fetching saved routines:", error);
      res.status(500).json({ message: "Failed to fetch saved routines" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
