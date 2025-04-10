import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
}

export default function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast({
          title: 'Permission Error',
          description: 'Could not request notification permission',
          variant: 'destructive'
        });
        return 'denied' as NotificationPermission;
      }
    } else {
      toast({
        title: 'Not Supported',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive'
      });
      return 'denied' as NotificationPermission;
    }
  };

  const showNotification = async (options: NotificationOptions): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notification Failed',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive'
      });
      return false;
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        toast({
          title: 'Permission Required',
          description: 'Please enable notifications to receive medication reminders',
          variant: 'destructive'
        });
        return false;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        silent: options.silent
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      toast({
        title: 'Notification Failed',
        description: 'Could not show notification',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
}
