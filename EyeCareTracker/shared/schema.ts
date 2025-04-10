import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medication schema
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage"),
  instructions: text("instructions"),
  eye: text("eye").default("both"),  // "left", "right", or "both"
  capColor: text("cap_color").default("#000000"),
  expiryDate: timestamp("expiry_date"),
  remainingDoses: integer("remaining_doses"),
  totalDoses: integer("total_doses"),
  bottleOpenDate: timestamp("bottle_open_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Schedule schema
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicationId: integer("medication_id").notNull(),
  time: text("time").notNull(), // In HH:MM format
  daysOfWeek: json("days_of_week").notNull(), // Array of days, e.g. ["Monday", "Wednesday", "Friday"]
  eye: text("eye").notNull(), // "left", "right", or "both"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Doses schema (records of medication taken)
export const doses = pgTable("doses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicationId: integer("medication_id").notNull(),
  scheduleId: integer("schedule_id"),
  timestamp: timestamp("timestamp").defaultNow(),
  eye: text("eye").notNull(), // "left", "right", or "both"
  skipped: boolean("skipped").default(false),
  notes: text("notes"),
});

export const insertDoseSchema = createInsertSchema(doses).omit({
  id: true,
});

export type InsertDose = z.infer<typeof insertDoseSchema>;
export type Dose = typeof doses.$inferSelect;

// Appointments schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  appointmentType: text("appointment_type").notNull(),
  dateTime: timestamp("date_time").notNull(),
  location: text("location"),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Enhanced schemas for front-end usage and validation
export const enhancedInsertMedicationSchema = insertMedicationSchema.extend({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  eye: z.enum(["left", "right", "both"]).default("both"),
  capColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").default("#000000"),
  remainingDoses: z.number().min(0, "Remaining doses cannot be negative").optional(),
  totalDoses: z.number().min(1, "Total doses must be at least 1").optional(),
  bottleOpenDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional(),
  expiryDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional(),
});

export const enhancedInsertScheduleSchema = insertScheduleSchema.extend({
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  daysOfWeek: z.array(z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])),
  eye: z.enum(["left", "right", "both"]),
});

export const enhancedInsertDoseSchema = insertDoseSchema.extend({
  eye: z.enum(["left", "right", "both"]),
});

export const enhancedInsertAppointmentSchema = insertAppointmentSchema.extend({
  doctorName: z.string().min(1, "Doctor name is required"),
  appointmentType: z.string().min(1, "Appointment type is required"),
  dateTime: z.date()
});

// View data types (for frontend display)
export type MedicationWithSchedules = Medication & {
  schedules: Schedule[];
};

export type ScheduleWithMedication = Schedule & {
  medication: Medication;
};

export type NextDose = {
  scheduleId: number;
  medicationId: number;
  medicationName: string;
  time: string;
  eye: string;
  dosage?: string;
  capColor?: string;
  date: Date;
};
