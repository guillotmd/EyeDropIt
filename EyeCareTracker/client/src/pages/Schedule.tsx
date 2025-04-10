import { useState } from 'react';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfDay } from 'date-fns';
import { Calendar, CheckCircle, Clock, Eye, PlusCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function Schedule() {
  const { schedules, medications, refetchAll, isLoading } = useMedicationContext();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Generate next 7 days for the day selector
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i);
    return {
      date,
      dayName: format(date, 'E'),
      dayNumber: format(date, 'd'),
      isToday: i === 0
    };
  });

  // Get schedules for the selected day
  const selectedDayName = format(selectedDay, 'EEEE');
  const filteredSchedules = schedules.filter(schedule => {
    const daysOfWeek = schedule.daysOfWeek as string[];
    return daysOfWeek.includes(selectedDayName);
  });

  // Sort schedules by time
  const sortedSchedules = [...filteredSchedules].sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  const handleCompleteDose = async (scheduleId: number, medicationId: number) => {
    try {
      setCompletingId(scheduleId);
      
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      await apiRequest('POST', '/api/doses', {
        medicationId,
        scheduleId,
        eye: schedule.eye,
        timestamp: new Date(),
        skipped: false
      });

      toast({
        title: "Dose recorded!",
        description: "Your medication has been marked as complete.",
      });

      // Refresh data
      await refetchAll();
    } catch (error) {
      console.error('Error recording dose:', error);
      toast({
        title: "Error",
        description: "Failed to record dose. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24">
      <Header title="Schedule" />
      
      <main className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <>
            {/* Day selector */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
              {nextDays.map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDay(day.date)}
                  className={`flex flex-col items-center p-2 rounded-lg min-w-16 
                    ${selectedDay.getDate() === day.date.getDate() 
                      ? 'bg-primary text-white' 
                      : 'bg-card hover:bg-muted'}`}
                >
                  <span className="text-xs">{day.dayName}</span>
                  <span className="text-lg font-bold">{day.dayNumber}</span>
                  {day.isToday && <span className="text-xs">Today</span>}
                </button>
              ))}
            </div>

            <Tabs defaultValue="list" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {sortedSchedules.length === 0 ? (
                      <div className="p-6 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="mb-4 text-muted-foreground">No medications scheduled for {format(selectedDay, 'EEEE')}</p>
                        <Link href="/add-medication">
                          <Button className="mx-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Medication
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      sortedSchedules.map((schedule) => {
                        const medication = medications.find(m => m.id === schedule.medicationId);
                        if (!medication) return null;
                        
                        return (
                          <div 
                            key={schedule.id}
                            className="p-4 border-b last:border-b-0 border-neutral-200 dark:border-neutral-700 flex items-center"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                              <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div className="font-medium">{medication.name} {medication.dosage}</div>
                                <div className="text-neutral-500 dark:text-neutral-400">
                                  {format(new Date(`2000-01-01T${schedule.time}`), 'h:mm a')}
                                </div>
                              </div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {schedule.eye === 'left' ? 'Left eye' : schedule.eye === 'right' ? 'Right eye' : 'Both eyes'}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={completingId === schedule.id}
                              onClick={() => handleCompleteDose(schedule.id, medication.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="calendar" className="mt-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Calendar view coming soon!</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-center">
              <Link href="/add-medication">
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Medication
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
      
      <Navigation />
    </div>
  );
}
