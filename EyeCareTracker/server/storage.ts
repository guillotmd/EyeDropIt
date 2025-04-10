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
import { format } from "date-fns";
import { DatabaseStorage } from "./storage-db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Medication methods
  getMedications(userId: number): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<Medication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<boolean>;
  
  // Schedule methods
  getSchedules(userId: number): Promise<Schedule[]>;
  getSchedulesByMedication(medicationId: number): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Dose methods
  getDoses(userId: number): Promise<Dose[]>;
  getDosesByMedication(medicationId: number): Promise<Dose[]>;
  getDosesByDate(userId: number, date: Date): Promise<Dose[]>;
  createDose(dose: InsertDose): Promise<Dose>;
  deleteDose(id: number): Promise<boolean>;
  
  // Appointment methods
  getAppointments(userId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Complex queries
  getMedicationsWithSchedules(userId: number): Promise<MedicationWithSchedules[]>;
  getSchedulesWithMedications(userId: number): Promise<ScheduleWithMedication[]>;
  getNextDoses(userId: number, count?: number): Promise<NextDose[]>;
  getDosesForDateRange(userId: number, startDate: Date, endDate: Date): Promise<Dose[]>;
  getAdherenceStats(userId: number, days: number): Promise<{date: string; completed: number; scheduled: number}[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medications: Map<number, Medication>;
  private schedules: Map<number, Schedule>;
  private doses: Map<number, Dose>;
  private appointments: Map<number, Appointment>;
  
  private userId: number = 1;
  private medicationId: number = 1;
  private scheduleId: number = 1;
  private doseId: number = 1;
  private appointmentId: number = 1;

  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.schedules = new Map();
    this.doses = new Map();
    this.appointments = new Map();
    
    // Initialize with a test user
    this.createUser({
      username: "testuser",
      password: "password"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Medication methods
  async getMedications(userId: number): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(
      (medication) => medication.userId === userId
    );
  }
  
  async getMedication(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }
  
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = this.medicationId++;
    const newMedication: Medication = { 
      ...medication, 
      id, 
      createdAt: new Date() 
    };
    this.medications.set(id, newMedication);
    return newMedication;
  }
  
  async updateMedication(id: number, medication: Partial<Medication>): Promise<Medication | undefined> {
    const existingMedication = this.medications.get(id);
    if (!existingMedication) return undefined;
    
    const updatedMedication = { ...existingMedication, ...medication };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }
  
  async deleteMedication(id: number): Promise<boolean> {
    // Delete associated schedules and doses first
    const schedules = await this.getSchedulesByMedication(id);
    for (const schedule of schedules) {
      await this.deleteSchedule(schedule.id);
    }
    
    // Delete the medication
    return this.medications.delete(id);
  }
  
  // Schedule methods
  async getSchedules(userId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.userId === userId
    );
  }
  
  async getSchedulesByMedication(medicationId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.medicationId === medicationId
    );
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleId++;
    const newSchedule: Schedule = { 
      ...schedule, 
      id, 
      createdAt: new Date() 
    };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }
  
  async updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;
    
    const updatedSchedule = { ...existingSchedule, ...schedule };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }
  
  // Dose methods
  async getDoses(userId: number): Promise<Dose[]> {
    return Array.from(this.doses.values()).filter(
      (dose) => dose.userId === userId
    );
  }
  
  async getDosesByMedication(medicationId: number): Promise<Dose[]> {
    return Array.from(this.doses.values()).filter(
      (dose) => dose.medicationId === medicationId
    );
  }
  
  async getDosesByDate(userId: number, date: Date): Promise<Dose[]> {
    const dateString = format(date, 'yyyy-MM-dd');
    
    return Array.from(this.doses.values()).filter(dose => {
      if (dose.userId !== userId) return false;
      
      const doseDate = format(dose.timestamp, 'yyyy-MM-dd');
      return doseDate === dateString;
    });
  }
  
  async createDose(dose: InsertDose): Promise<Dose> {
    const id = this.doseId++;
    const newDose: Dose = { 
      ...dose, 
      id,
      timestamp: dose.timestamp || new Date()
    };
    this.doses.set(id, newDose);
    
    // Decrement remaining doses if medication has that property
    if (dose.medicationId) {
      const medication = await this.getMedication(dose.medicationId);
      if (medication && typeof medication.remainingDoses === 'number') {
        const remainingDoses = Math.max(0, medication.remainingDoses - 1);
        await this.updateMedication(medication.id, { remainingDoses });
      }
    }
    
    return newDose;
  }
  
  async deleteDose(id: number): Promise<boolean> {
    const dose = this.doses.get(id);
    if (!dose) return false;
    
    // Increment remaining doses if medication has that property
    if (dose.medicationId && !dose.skipped) {
      const medication = await this.getMedication(dose.medicationId);
      if (medication && typeof medication.remainingDoses === 'number') {
        const remainingDoses = medication.remainingDoses + 1;
        await this.updateMedication(medication.id, { remainingDoses });
      }
    }
    
    return this.doses.delete(id);
  }
  
  // Appointment methods
  async getAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.userId === userId)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentId++;
    const newAppointment: Appointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = { ...existingAppointment, ...appointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Complex queries
  async getMedicationsWithSchedules(userId: number): Promise<MedicationWithSchedules[]> {
    const medications = await this.getMedications(userId);
    const result: MedicationWithSchedules[] = [];
    
    for (const medication of medications) {
      const schedules = await this.getSchedulesByMedication(medication.id);
      result.push({
        ...medication,
        schedules
      });
    }
    
    return result;
  }
  
  async getSchedulesWithMedications(userId: number): Promise<ScheduleWithMedication[]> {
    const schedules = await this.getSchedules(userId);
    const result: ScheduleWithMedication[] = [];
    
    for (const schedule of schedules) {
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
    const schedules = await this.getSchedules(userId);
    const activeSchedules = schedules.filter(s => s.active);
    const today = new Date();
    const dayOfWeek = format(today, 'EEEE');
    const timeNow = format(today, 'HH:mm');
    
    const result: NextDose[] = [];
    
    for (const schedule of activeSchedules) {
      const daysOfWeek = schedule.daysOfWeek as string[];
      
      // Create entries for today and upcoming days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + dayOffset);
        const targetDayOfWeek = format(targetDate, 'EEEE');
        
        if (daysOfWeek.includes(targetDayOfWeek)) {
          const medication = await this.getMedication(schedule.medicationId);
          if (!medication) continue;
          
          // For today, only include doses that are still upcoming
          if (dayOffset === 0 && schedule.time <= timeNow) {
            continue;
          }
          
          result.push({
            scheduleId: schedule.id,
            medicationId: medication.id,
            medicationName: medication.name,
            time: schedule.time,
            eye: schedule.eye,
            dosage: medication.dosage,
            date: targetDate
          });
        }
      }
    }
    
    // Sort by date and time
    result.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      return a.time.localeCompare(b.time);
    });
    
    return result.slice(0, count);
  }
  
  async getDosesForDateRange(userId: number, startDate: Date, endDate: Date): Promise<Dose[]> {
    const allUserDoses = await this.getDoses(userId);
    
    return allUserDoses.filter(dose => {
      const doseTime = dose.timestamp.getTime();
      return doseTime >= startDate.getTime() && doseTime <= endDate.getTime();
    });
  }
  
  async getAdherenceStats(userId: number, days: number = 7): Promise<{date: string; completed: number; scheduled: number}[]> {
    const result: {date: string; completed: number; scheduled: number}[] = [];
    const today = new Date();
    const schedules = await this.getSchedules(userId);
    const activeSchedules = schedules.filter(s => s.active);
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - days + i + 1);
      const dayOfWeek = format(date, 'EEEE');
      const dateString = format(date, 'yyyy-MM-dd');
      
      let scheduled = 0;
      activeSchedules.forEach(schedule => {
        const daysOfWeek = schedule.daysOfWeek as string[];
        if (daysOfWeek.includes(dayOfWeek)) {
          scheduled++;
        }
      });
      
      const dayDoses = await this.getDosesByDate(userId, date);
      const completed = dayDoses.filter(dose => !dose.skipped).length;
      
      result.push({
        date: dateString,
        completed,
        scheduled
      });
    }
    
    return result;
  }
}

export const storage = new DatabaseStorage();
