import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFormattedDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'EEEE, MMMM d');
}

export function getFormattedTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'h:mm a');
}

export function getFormattedDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'MMMM d, yyyy • h:mm a');
}

export function getRelativeTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

export function calculateRemainingPercent(remaining: number, total: number): number {
  if (!total) return 0;
  return Math.round((remaining / total) *
 100);
}

export function getRefillStatus(percent: number): {
  message: string;
  color: "secondary" | "warning" | "error";
} {
  if (percent > 50) {
    return { message: `Refill in ${Math.ceil((percent - 20) / 5)} days`, color: "secondary" };
  } else if (percent > 20) {
    return { message: "Refill soon", color: "warning" };
  } else {
    return { message: "Refill now!", color: "error" };
  }
}

export function convertTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function formatTimeForInput(time: string): string {
  // Make sure the time is in HH:MM format for the time input
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

export function isTimeWithinRange(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time <= endTime;
}

export function getNextOccurrence(daysOfWeek: string[], time: string): Date {
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayIndex = today.getDay();
  const todayDayName = dayNames[todayDayIndex];
  
  const [hours, minutes] = time.split(':').map(Number);
  const todayAtTime = new Date();
  todayAtTime.setHours(hours, minutes, 0, 0);
  
  // If today is in daysOfWeek and the time hasn't passed yet
  if (daysOfWeek.includes(todayDayName) && todayAtTime > today) {
    return todayAtTime;
  }
  
  // Find the next day in daysOfWeek
  let daysToAdd = 1;
  while (daysToAdd <= 7) {
    const nextDay = (todayDayIndex + daysToAdd) % 7;
    const nextDayName = dayNames[nextDay];
    
    if (daysOfWeek.includes(nextDayName)) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + daysToAdd);
      nextDate.setHours(hours, minutes, 0, 0);
      return nextDate;
    }
    
    daysToAdd++;
  }
  
  // Fallback (should never reach here if daysOfWeek has valid entries)
  return today;
}

export function getContrastTextColor(backgroundColor: string): string {
  // Simple function to determine if text should be white or black based on background
  // This is a simplified version - for production use a proper contrast checker
  const hexColor = backgroundColor.replace('#', '');
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'text-black' : 'text-white';
}
