import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getFormattedDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';

export default function UpcomingAppointment() {
  const { appointments } = useMedicationContext();
  const { toast } = useToast();
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  
  // Sort appointments by date and get the next one
  const upcomingAppointment = appointments
    .filter(app => new Date(app.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];
  
  const addToCalendar = () => {
    if (!upcomingAppointment) return;
    
    setIsAddingToCalendar(true);
    
    try {
      // Try to add to calendar if the API is available
      if ('share' in navigator) {
        const shareData = {
          title: `Eye Appointment with ${upcomingAppointment.doctorName}`,
          text: `${upcomingAppointment.appointmentType} at ${upcomingAppointment.location || 'undefined location'}`,
          url: window.location.href
        };
        
        navigator.share(shareData)
          .then(() => {
            toast({
              title: 'Success',
              description: 'Appointment info shared successfully!',
            });
          })
          .catch(err => {
            console.error('Error sharing appointment:', err);
            fallbackAddToCalendar();
          });
      } else {
        fallbackAddToCalendar();
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      fallbackAddToCalendar();
    } finally {
      setIsAddingToCalendar(false);
    }
  };
  
  const fallbackAddToCalendar = () => {
    if (!upcomingAppointment) return;
    
    const startTime = new Date(upcomingAppointment.dateTime);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // Assume 1 hour appointment
    
    const eventTitle = encodeURIComponent(`Eye Appointment with ${upcomingAppointment.doctorName}`);
    const details = encodeURIComponent(upcomingAppointment.appointmentType);
    const location = encodeURIComponent(upcomingAppointment.location || '');
    const start = formatForCalendar(startTime);
    const end = formatForCalendar(endTime);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${details}&location=${location}&dates=${start}/${end}`;
    
    window.open(googleCalendarUrl, '_blank');
    
    toast({
      title: 'Calendar',
      description: 'Opening Google Calendar in a new tab',
    });
  };
  
  // Format time for Google Calendar
  function formatForCalendar(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  }
  
  if (!upcomingAppointment) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">Upcoming Appointment</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-muted-foreground">No upcoming appointments</p>
            <Link href="/add-appointment">
              <Button>Add Appointment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-medium mb-4">Upcoming Appointment</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className="w-14 h-14 bg-primary/20 dark:bg-primary/30 rounded-lg flex items-center justify-center mr-4">
              <Calendar className="text-primary text-2xl h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-lg mb-1">{upcomingAppointment.doctorName}</div>
              <div className="text-neutral-600 dark:text-neutral-300 mb-2">{upcomingAppointment.appointmentType}</div>
              <div className="flex items-center text-neutral-500 dark:text-neutral-400 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                <span>{getFormattedDateTime(upcomingAppointment.dateTime)}</span>
              </div>
              {upcomingAppointment.location && (
                <div className="flex items-center text-neutral-500 dark:text-neutral-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{upcomingAppointment.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Link href={`/appointment/${upcomingAppointment.id}`}>
              <Button className="flex-1 bg-primary">
                Details
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="flex-1 border-primary text-primary"
              onClick={addToCalendar}
              disabled={isAddingToCalendar}
            >
              Add to Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
