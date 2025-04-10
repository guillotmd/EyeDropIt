import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import type { NextDose } from '@shared/schema';

export default function TodaySchedule() {
  const { nextDoses, refetchAll } = useMedicationContext();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Filter for today's doses
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const todayDoses = nextDoses.filter(dose => 
    format(new Date(dose.date), 'yyyy-MM-dd') === todayString
  );

  const handleMarkComplete = async (dose: NextDose) => {
    try {
      setCompletingId(dose.scheduleId);

      await apiRequest('POST', '/api/doses', {
        medicationId: dose.medicationId,
        scheduleId: dose.scheduleId,
        eye: dose.eye,
        timestamp: new Date(),
        skipped: false
      });

      toast({
        title: "Dose recorded!",
        description: `${dose.medicationName} has been marked as complete.`,
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

  if (todayDoses.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Today's Schedule</h2>
          <Link href="/schedule">
            <Button variant="link" className="text-primary flex items-center">
              <span>View All</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No medications scheduled for today</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate completed and upcoming doses
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  const timeSort = (a: NextDose, b: NextDose) => a.time.localeCompare(b.time);
  
  const completedDoses: NextDose[] = [];
  const upcomingDoses = todayDoses
    .filter(dose => {
      // We don't have a way to know if a dose is completed from the API
      // This would come from the doses endpoint in a real implementation
      return dose.time >= currentTime;
    })
    .sort(timeSort);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Today's Schedule</h2>
        <Link href="/schedule">
          <Button variant="link" className="text-primary flex items-center">
            <span>View All</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {/* Completed doses */}
          {completedDoses.map((dose) => (
            <div key={`${dose.medicationId}-${dose.time}`} className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${!dose.capColor ? 'bg-secondary/20' : ''}`}
                style={dose.capColor ? { backgroundColor: `${dose.capColor}30` } : {}}
              >
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="font-medium">{dose.medicationName}</div>
                  <div className="text-neutral-500 dark:text-neutral-400">
                    {format(dose.time, 'h:mm a')}
                  </div>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {dose.eye === 'left' ? 'Left eye' : dose.eye === 'right' ? 'Right eye' : 'Both eyes'}
                </div>
              </div>
            </div>
          ))}
          
          {/* Upcoming doses */}
          {upcomingDoses.map((dose) => (
            <div 
              key={`${dose.medicationId}-${dose.time}`} 
              className="p-4 border-b last:border-b-0 border-neutral-200 dark:border-neutral-700 flex items-center"
              onClick={() => handleMarkComplete(dose)}
            >
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${!dose.capColor ? 'bg-primary/20' : ''}`}
                style={dose.capColor ? { backgroundColor: `${dose.capColor}30` } : {}}
              >
                {dose.capColor ? (
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: dose.capColor }}
                  />
                ) : (
                  <Clock className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="font-medium">{dose.medicationName}</div>
                  <div className="text-neutral-500 dark:text-neutral-400">
                    {format(new Date(`2000-01-01T${dose.time}`), 'h:mm a')}
                  </div>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {dose.eye === 'left' ? 'Left eye' : dose.eye === 'right' ? 'Right eye' : 'Both eyes'}
                </div>
              </div>
              
              {/* Complete button */}
              <Button 
                size="sm" 
                variant="outline"
                disabled={completingId === dose.scheduleId}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkComplete(dose);
                }}
              >
                Complete
              </Button>
            </div>
          ))}

          {completedDoses.length === 0 && upcomingDoses.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No medications scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
