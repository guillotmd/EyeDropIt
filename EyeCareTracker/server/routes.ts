import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMedicationSchema,
  enhancedInsertMedicationSchema,
  insertScheduleSchema, 
  insertDoseSchema, 
  insertAppointmentSchema 
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Default user ID until we implement authentication
  const DEFAULT_USER_ID = 1;
  
  // Middleware to check if user exists
  const checkUser = async (req: Request, res: Response, next: Function) => {
    const user = await storage.getUser(DEFAULT_USER_ID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    next();
  };
  
  // Get test user
  apiRouter.get("/user", async (req: Request, res: Response) => {
    const user = await storage.getUser(DEFAULT_USER_ID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Remove password before sending response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Medication routes
  apiRouter.get("/medications", checkUser, async (req: Request, res: Response) => {
    const medications = await storage.getMedications(DEFAULT_USER_ID);
    res.json(medications);
  });
  
  apiRouter.get("/medications/:id", checkUser, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid medication ID" });
    }
    
    const medication = await storage.getMedication(id);
    if (!medication || medication.userId !== DEFAULT_USER_ID) {
      return res.status(404).json({ message: "Medication not found" });
    }
    
    res.json(medication);
  });
  
  apiRouter.post("/medications", checkUser, async (req: Request, res: Response) => {
    try {
      console.log("Received medication data:", req.body);
      
      // First validate with enhanced schema which handles date conversions
      let validatedData;
      try {
        validatedData = enhancedInsertMedicationSchema.parse(req.body);
      } catch (validationError: any) { // Catch all errors
        console.error("Validation error:", validationError); // Log the error
        return res.status(400).json({ message: "Invalid medication data", errors: validationError.errors || validationError.message }); // Return a 400 with the error message
      }




      // Then use the validated data for database operations
      const medication = insertMedicationSchema.parse({
        ...validatedData,
        userId: DEFAULT_USER_ID
      });
      
      const created = await storage.createMedication(medication);
      res.status(201).json(created);
    } catch (error: any) { // Catch all errors
      console.error("Error creating medication:", error);
    return res.status(500).json({ message: "Failed to create medication", error: error.message }); // Return a 500 with the error message
    }
  });
  
  apiRouter.put("/medications/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const existing = await storage.getMedication(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      console.log("Received medication update data:", req.body);
      
      // First validate with enhanced schema which handles date conversions
      let validatedData;
      try {
        validatedData = enhancedInsertMedicationSchema.parse(req.body);
      } catch (validationError :any) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid medication data", errors: validationError.errors });
        } 
        throw validationError;
      }
      
      const updated = await storage.updateMedication(id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ message: "Failed to update medication" });
    }
  });
  
  apiRouter.delete("/medications/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const existing = await storage.getMedication(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      await storage.deleteMedication(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medication" });
    }
  });
  
  // Schedule routes
  apiRouter.get("/schedules", checkUser, async (req: Request, res: Response) => {
    const schedules = await storage.getSchedules(DEFAULT_USER_ID);
    res.json(schedules);
  });
  
  apiRouter.get("/schedules/:id", checkUser, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }
    
    const schedule = await storage.getSchedule(id);
    if (!schedule || schedule.userId !== DEFAULT_USER_ID) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    
    res.json(schedule);
  });
  
  apiRouter.post("/schedules", checkUser, async (req: Request, res: Response) => {
    try {
      const schedule = insertScheduleSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const created = await storage.createSchedule(schedule);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });
  
  apiRouter.put("/schedules/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const existing = await storage.getSchedule(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      const updated = await storage.updateSchedule(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });
  
  apiRouter.delete("/schedules/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const existing = await storage.getSchedule(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      await storage.deleteSchedule(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });
  
  // Dose routes
  apiRouter.get("/doses", checkUser, async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && endDate) {
      try {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        const doses = await storage.getDosesForDateRange(DEFAULT_USER_ID, start, end);
        return res.json(doses);
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const doses = await storage.getDoses(DEFAULT_USER_ID);
    res.json(doses);
  });
  
  apiRouter.post("/doses", checkUser, async (req: Request, res: Response) => {
    try {
      const dose = insertDoseSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const created = await storage.createDose(dose);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dose data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record dose" });
    }
  });
  
  apiRouter.delete("/doses/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dose ID" });
      }
      
      await storage.deleteDose(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete dose" });
    }
  });
  
  // Appointment routes
  apiRouter.get("/appointments", checkUser, async (req: Request, res: Response) => {
    const appointments = await storage.getAppointments(DEFAULT_USER_ID);
    res.json(appointments);
  });
  
  apiRouter.get("/appointments/:id", checkUser, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    
    const appointment = await storage.getAppointment(id);
    if (!appointment || appointment.userId !== DEFAULT_USER_ID) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json(appointment);
  });
  
  apiRouter.post("/appointments", checkUser, async (req: Request, res: Response) => {
    try {
      const appointment = insertAppointmentSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const created = await storage.createAppointment(appointment);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });
  
  apiRouter.put("/appointments/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const existing = await storage.getAppointment(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      const updated = await storage.updateAppointment(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });
  
  apiRouter.delete("/appointments/:id", checkUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const existing = await storage.getAppointment(id);
      if (!existing || existing.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });
  
  // Complex queries
  apiRouter.get("/medications-with-schedules", checkUser, async (req: Request, res: Response) => {
    const medicationsWithSchedules = await storage.getMedicationsWithSchedules(DEFAULT_USER_ID);
    res.json(medicationsWithSchedules);
  });
  
  apiRouter.get("/schedules-with-medications", checkUser, async (req: Request, res: Response) => {
    const schedulesWithMedications = await storage.getSchedulesWithMedications(DEFAULT_USER_ID);
    res.json(schedulesWithMedications);
  });
  
  apiRouter.get("/next-doses", checkUser, async (req: Request, res: Response) => {
    const count = req.query.count ? parseInt(req.query.count as string) : undefined;
    const nextDoses = await storage.getNextDoses(DEFAULT_USER_ID, count);
    res.json(nextDoses);
  });
  
  apiRouter.get("/adherence-stats", checkUser, async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const adherenceStats = await storage.getAdherenceStats(DEFAULT_USER_ID, days);
    res.json(adherenceStats);
  });
  
  // Add the API router
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
