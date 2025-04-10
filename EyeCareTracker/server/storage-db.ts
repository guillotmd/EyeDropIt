import { 
  users, type User, type InsertUser,
  medications, type Medication, type InsertMedication,
  schedules, type Schedule, type InsertSchedule,
  doses, type Dose, type InsertDose,
  appointments, type Appointment, type InsertAppointment,
  type MedicationWithSchedules,
  type ScheduleWithMedication,
  type NextDose
} from "@shared/schema";
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, isNull } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Medication methods
  async getMedications(userId: number): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(medications.name);
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [medication] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id));
    return medication;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db
      .insert(medications)
      .values(medication)
      .returning();
    return newMedication;
  }

  async updateMedication(id: number, medicationUpdate: Partial<Medication>): Promise<Medication | undefined> {
    const [updatedMedication] = await db
      .update(medications)
      .set(medicationUpdate)
      .where(eq(medications.id, id))
      .returning();
    return updatedMedication;
  }

  async deleteMedication(id: number): Promise<boolean> {
    // Delete associated schedules first
    await db
      .delete(schedules)
      .where(eq(schedules.medicationId, id));
    
    // Delete associated doses
    await db
      .delete(doses)
      .where(eq(doses.medicationId, id));
    
    // Delete the medication
    const [deletedMedication] = await db
      .delete(medications)
      .where(eq(medications.id, id))
      .returning();
    
    return !!deletedMedication;
  }

  // Schedule methods
  async getSchedules(userId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.userId, userId))
      .orderBy(schedules.medicationId, schedules.time);
  }

  async getSchedulesByMedication(medicationId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.medicationId, medicationId))
      .orderBy(schedules.time);
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id));
    return schedule;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db
      .insert(schedules)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async updateSchedule(id: number, scheduleUpdate: Partial<Schedule>): Promise<Schedule | undefined> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set(scheduleUpdate)
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    // Delete the schedule
    const [deletedSchedule] = await db
      .delete(schedules)
      .where(eq(schedules.id, id))
      .returning();
    
    return !!deletedSchedule;
  }

  // Dose methods
  async getDoses(userId: number): Promise<Dose[]> {
    return await db
      .select()
      .from(doses)
      .where(eq(doses.userId, userId))
      .orderBy(desc(doses.timestamp));
  }

  async getDosesByMedication(medicationId: number): Promise<Dose[]> {
    return await db
      .select()
      .from(doses)
      .where(eq(doses.medicationId, medicationId))
      .orderBy(desc(doses.timestamp));
  }

  async getDosesByDate(userId: number, date: Date): Promise<Dose[]> {
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    return await db
      .select()
      .from(doses)
      .where(
        and(
          eq(doses.userId, userId),
          gte(doses.timestamp, start),
          lte(doses.timestamp, end)
        )
      )
      .orderBy(doses.timestamp);
  }

  async createDose(dose: InsertDose): Promise<Dose> {
    const [newDose] = await db
      .insert(doses)
      .values(dose)
      .returning();
    return newDose;
  }

  async deleteDose(id: number): Promise<boolean> {
    const [deletedDose] = await db
      .delete(doses)
      .where(eq(doses.id, id))
      .returning();
    
    return !!deletedDose;
  }

  // Appointment methods
  async getAppointments(userId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(asc(appointments.dateTime));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return result[0];
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointmentUpdate)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const [deletedAppointment] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    
    return !!deletedAppointment;
  }

  // Complex queries
  async getMedicationsWithSchedules(userId: number): Promise<MedicationWithSchedules[]> {
    const meds = await this.getMedications(userId);
    
    const result: MedicationWithSchedules[] = [];
    
    for (const med of meds) {
      const schedules = await this.getSchedulesByMedication(med.id);
      result.push({
        ...med,
        schedules
      });
    }
    
    return result;
  }

  async getSchedulesWithMedications(userId: number): Promise<ScheduleWithMedication[]> {
    const userSchedules = await this.getSchedules(userId);
    
    const result: ScheduleWithMedication[] = [];
    
    for (const schedule of userSchedules) {
      const medication = await this.getMedication(schedule.medicationId);
      if (medication) {
        result.push({
          ...schedule,
          medication
        });
      }
    }
    
    return result;
  }

  async getNextDoses(userId: number, count: number = 5): Promise<NextDose[]> {
    // Get all schedules for the user
    const schedulesWithMeds = await this.getSchedulesWithMedications(userId);
    
    if (schedulesWithMeds.length === 0) {
      return [];
    }
    
    const now = new Date();
    const today = format(now, 'EEEE'); // e.g., "Monday"
    const currentTime = format(now, 'HH:mm');
    
    // Create a list of potential doses for the next 7 days
    const potentialDoses: NextDose[] = [];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = addDays(now, dayOffset);
      const targetDay = format(targetDate, 'EEEE');
      
      for (const schedule of schedulesWithMeds) {
        // Skip inactive schedules
        if (!schedule.active) continue;
        
        // Check if this schedule applies to this day of the week
        const daysOfWeek = schedule.daysOfWeek as string[];
        if (!daysOfWeek.includes(targetDay)) {
          continue;
        }
        
        // For today, only include doses that are still upcoming
        if (dayOffset === 0 && schedule.time < currentTime) {
          continue;
        }
        
        // Create a next dose entry
        potentialDoses.push({
          scheduleId: schedule.id,
          medicationId: schedule.medicationId,
          medicationName: schedule.medication.name,
          time: schedule.time,
          eye: schedule.eye,
          dosage: schedule.medication.dosage || undefined,
          capColor: schedule.medication.capColor || undefined,
          date: targetDate
        });
      }
    }
    
    // Sort by date and time
    potentialDoses.sort((a, b) => {
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
    
    // Return the specified number of doses
    return potentialDoses.slice(0, count);
  }

  async getDosesForDateRange(userId: number, startDate: Date, endDate: Date): Promise<Dose[]> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    
    return await db
      .select()
      .from(doses)
      .where(
        and(
          eq(doses.userId, userId),
          gte(doses.timestamp, start),
          lte(doses.timestamp, end)
        )
      )
      .orderBy(doses.timestamp);
  }

  async getAdherenceStats(userId: number, days: number = 7): Promise<{date: string; completed: number; scheduled: number}[]> {
    const now = new Date();
    const results: {date: string; completed: number; scheduled: number}[] = [];
    
    // Get all active schedules for this user
    const userSchedules = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.userId, userId),
          eq(schedules.active, true)
        )
      );
    
    // Calculate stats for each day in the requested range
    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
      const targetDate = addDays(now, -dayOffset);
      const targetDay = format(targetDate, 'EEEE'); // e.g., "Monday"
      const formattedDate = format(targetDate, 'yyyy-MM-dd');
      
      // Count how many doses were scheduled for this day
      let scheduledCount = 0;
      for (const schedule of userSchedules) {
        const daysOfWeek = schedule.daysOfWeek as string[];
        if (daysOfWeek.includes(targetDay)) {
          scheduledCount++;
        }
      }
      
      // Count how many doses were completed (non-skipped) for this day
      const dayDoses = await this.getDosesByDate(userId, targetDate);
      const completedCount = dayDoses.filter(dose => !dose.skipped).length;
      
      results.push({
        date: formattedDate,
        completed: completedCount,
        scheduled: scheduledCount
      });
    }
    
    return results;
  }
}