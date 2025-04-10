import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedInsertDoseSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function AddDose() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { medications, schedules, refetchAll } = useMedicationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<number | null>(null);

  // Default user ID is 1 until authentication is implemented
  const DEFAULT_USER_ID = 1;

  const form = useForm({
    resolver: zodResolver(enhancedInsertDoseSchema),
    defaultValues: {
      userId: DEFAULT_USER_ID,
      medicationId: 0,
      eye: 'both',
      timestamp: new Date(),
      notes: '',
      skipped: false
    }
  });

  // Filter schedules based on selected medication
  const filteredSchedules = schedules.filter(s => 
    s.medicationId === selectedMedicationId
  );

  const onSubmit = async (data: any) => {
    if (!data.medicationId || data.medicationId === 0) {
      toast({
        title: "Please select a medication",
        description: "You need to select a medication to record a dose",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert medicationId to number if it's a string
      if (typeof data.medicationId === 'string') {
        data.medicationId = parseInt(data.medicationId);
      }
      
      const response = await apiRequest('POST', '/api/doses', data);
      const dose = await response.json();
      
      toast({
        title: "Dose recorded",
        description: "Your medication dose has been recorded successfully"
      });
      
      await refetchAll();
      navigate('/'); // Navigate back to home after recording dose
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

  // Handle medication selection change
  const handleMedicationChange = (medicationId: string) => {
    const id = parseInt(medicationId);
    setSelectedMedicationId(id);
    form.setValue('medicationId', id);
    
    // If there's only one schedule for this medication, auto-select it
    const medSchedules = schedules.filter(s => s.medicationId === id);
    if (medSchedules.length === 1) {
      form.setValue('scheduleId', medSchedules[0].id);
    }
  };

  // Handle schedule selection
  const handleScheduleSelect = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      form.setValue('scheduleId', schedule.id);
      form.setValue('eye', schedule.eye);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24">
      <Header title="Record Dose" />
      
      <main className="p-4">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0 flex items-center" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-1 h-5 w-5" />
          Back to Home
        </Button>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Record Medication Dose</CardTitle>
                <CardDescription>
                  Track doses you've taken to maintain your schedule
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="medicationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Medication*</FormLabel>
                      <Select 
                        onValueChange={handleMedicationChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder="Select a medication" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {medications.length === 0 ? (
                            <div className="text-center py-3 text-sm text-muted-foreground">
                              No medications available. Add one first.
                            </div>
                          ) : (
                            medications.map((med) => (
                              <SelectItem 
                                key={med.id} 
                                value={med.id.toString()}
                                className="text-base"
                              >
                                {med.name} {med.dosage}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedMedicationId && filteredSchedules.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base">Select Schedule (Optional)</Label>
                    <div className="grid gap-2">
                      {filteredSchedules.map((schedule) => (
                        <Button
                          key={schedule.id}
                          type="button"
                          variant="outline"
                          className={`w-full justify-start text-left h-auto py-3 ${
                            form.watch('scheduleId') === schedule.id 
                              ? 'border-primary bg-primary/10' 
                              : ''
                          }`}
                          onClick={() => handleScheduleSelect(schedule.id)}
                        >
                          <div className="mr-3">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {format(new Date(`2000-01-01T${schedule.time}`), 'h:mm a')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {schedule.eye === 'left' ? 'Left eye' : 
                               schedule.eye === 'right' ? 'Right eye' : 'Both eyes'}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="eye"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">Which Eye*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-2"
                        >
                          <FormItem className="flex items-center space-x-1 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="left" id="eye-left" />
                            </FormControl>
                            <Label htmlFor="eye-left" className="cursor-pointer flex-1 text-center py-2 border rounded-md">
                              Left
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="right" id="eye-right" />
                            </FormControl>
                            <Label htmlFor="eye-right" className="cursor-pointer flex-1 text-center py-2 border rounded-md">
                              Right
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="both" id="eye-both" />
                            </FormControl>
                            <Label htmlFor="eye-both" className="cursor-pointer flex-1 text-center py-2 border rounded-md">
                              Both
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skipped"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === 'skipped')}
                          defaultValue={field.value ? 'skipped' : 'taken'}
                          className="flex space-x-2"
                        >
                          <FormItem className="flex items-center space-x-1 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="taken" id="status-taken" />
                            </FormControl>
                            <Label htmlFor="status-taken" className="cursor-pointer flex-1 text-center py-2 border rounded-md flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Taken
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="skipped" id="status-skipped" />
                            </FormControl>
                            <Label htmlFor="status-skipped" className="cursor-pointer flex-1 text-center py-2 border rounded-md">
                              Skipped
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about this dose" 
                          className="resize-none min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !selectedMedicationId}
                className={`${!selectedMedicationId ? 'opacity-50' : ''} bg-primary hover:bg-primary/90`}
              >
                {isSubmitting ? "Recording..." : "Record Dose"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
      
      <Navigation />
    </div>
  );
}
