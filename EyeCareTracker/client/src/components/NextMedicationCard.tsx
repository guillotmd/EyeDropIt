import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { getFormattedDate, getFormattedTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import type { NextDose } from '@shared/schema';

export default function NextMedicationCard() {
  const { nextDoses, refetchAll } = useMedicationContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!nextDoses || nextDoses.length === 0) {
    return (
      <Card className="mb-6 bg-primary text-white dark:bg-primary/90">
        <CardContent className="p-6">
          <div className="text-xl font-medium mb-3">No Upcoming Medications</div>
          <p>Add medications to your schedule to see them here.</p>
        </CardContent>
      </Card>
    );
  }

  const nextDose: NextDose = nextDoses[0];
  const formattedDate = getFormattedDate(nextDose.date);
  const formattedTime = getFormattedTime(nextDose.time);
  const displayDate = formattedDate === getFormattedDate(new Date()) ? "Today" : formattedDate;

  const handleMarkComplete = async () => {
    try {
      setIsSubmitting(true);

      await apiRequest('POST', '/api/doses', {
        medicationId: nextDose.medicationId,
        scheduleId: nextDose.scheduleId,
        eye: nextDose.eye,
        timestamp: new Date(),
        skipped: false
      });

      toast({
        title: "Dose recorded!",
        description: `${nextDose.medicationName} has been marked as complete.`,
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
      setIsSubmitting(false);
    }
  };

  function formatEye(eye: string) {
    switch(eye) {
      case 'left': return 'Left eye';
      case 'right': return 'Right eye';
      case 'both': return 'Both eyes';
      default: return eye;
    }
  }

  return (
    <Card className="mb-6 bg-primary text-white dark:bg-primary/90">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-medium">Next Medication</h2>
          <Bell className="h-5 w-5" />
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-2">
            {nextDose.capColor && (
              <div 
                className="w-6 h-6 rounded-full flex-shrink-0" 
                style={{ backgroundColor: nextDose.capColor }}
                aria-label={`Cap color: ${nextDose.capColor}`}
                title={`Cap color: ${nextDose.capColor}`}
              />
            )}
            <div className="text-2xl font-bold">{nextDose.medicationName} {nextDose.dosage}</div>
          </div>
          <div className="text-lg mt-1">{displayDate}, {formattedTime}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Eye className="mr-1 h-5 w-5" />
            <span>{formatEye(nextDose.eye)}</span>
          </div>
          <Button 
            onClick={handleMarkComplete} 
            disabled={isSubmitting}
            className="bg-white text-primary hover:bg-white/90 hover:text-primary font-medium py-3 px-6 rounded-lg text-lg"
          >
            Mark Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
