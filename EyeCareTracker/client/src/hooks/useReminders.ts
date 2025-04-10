import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import useNotifications from './useNotifications';
import { useToast } from '@/hooks/use-toast';
import type { NextDose } from '@shared/schema';

export function useReminders() {
  const { showNotification, permission, requestPermission } = useNotifications();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch next doses
  const { data: nextDoses } = useQuery<NextDose[]>({
    queryKey: ['/api/next-doses'],
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    const checkReminders = () => {
      if (!nextDoses || !nextDoses.length) return;
      
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const currentDate = format(now, 'yyyy-MM-dd');
      
      for (const dose of nextDoses) {
        const doseDate = format(new Date(dose.date), 'yyyy-MM-dd');
        
        // Only check today's doses
        if (doseDate !== currentDate) continue;
        
        // Check if it's time for a reminder (5 minutes before scheduled time)
        const doseTime = dose.time;
        const reminderTime = subtractMinutesFromTime(doseTime, 5);
        
        if (currentTime === reminderTime) {
          showReminderNotification(dose);
        }
      }
    };
    
    // Check for reminders every minute
    const intervalId = setInterval(checkReminders, 60 * 1000);
    
    // Run once on mount
    checkReminders();
    
    return () => clearInterval(intervalId);
  }, [nextDoses, showNotification]);

  const showReminderNotification = async (dose: NextDose) => {
    const title = `Time for ${dose.medicationName}`;
    const body = `Due at ${formatTime(dose.time)} for ${formatEye(dose.eye)}`;
    
    const shown = await showNotification({
      title,
      body,
      tag: `med-reminder-${dose.medicationId}-${dose.time}`,
    });
    
    if (shown) {
      toast({
        title,
        description: body,
        duration: 10000,
      });
    }
  };

  const refreshReminders = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/next-doses'] });
  };

  return {
    requestNotificationPermission: requestPermission,
    notificationPermission: permission,
    refreshReminders,
  };
}

// Helper functions
function subtractMinutesFromTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() - minutes);
  return format(date, 'HH:mm');
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

function formatEye(eye: string): string {
  switch (eye) {
    case 'left': return 'left eye';
    case 'right': return 'right eye';
    case 'both': return 'both eyes';
    default: return eye;
  }
}
