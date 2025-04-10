import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, ArrowLeft, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedInsertAppointmentSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function AddAppointment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refetchAll } = useMedicationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default user ID is 1 until authentication is implemented
  const DEFAULT_USER_ID = 1;

  // Create a combined date and time for the form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');

  const form = useForm({
    resolver: zodResolver(enhancedInsertAppointmentSchema),
    defaultValues: {
      userId: DEFAULT_USER_ID,
      doctorName: '',
      appointmentType: '',
      dateTime: new Date(),
      location: '',
      notes: '',
      reminderSent: false
    }
  });

  // Update the datetime field when date or time changes
  const updateDateTime = (date?: Date, time?: string) => {
    if (!date) return;
    
    const newDateTime = new Date(date);
    
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      newDateTime.setHours(hours, minutes, 0, 0);
    }
    
    form.setValue('dateTime', newDateTime);
  };

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date);
    updateDateTime(date, selectedTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
    updateDateTime(selectedDate, e.target.value);
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest('POST', '/api/appointments', data);
      const appointment = await response.json();
      
      toast({
        title: "Appointment added",
        description: `Your appointment with ${appointment.doctorName} has been scheduled.`
      });
      
      await refetchAll();
      navigate('/'); // Navigate back to home after adding appointment
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: "Error",
        description: "Failed to add appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24">
      <Header title="Add Appointment" />
      
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
                <CardTitle>Add Eye Care Appointment</CardTitle>
                <CardDescription>
                  Keep track of your upcoming doctor visits
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="doctorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Doctor Name*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Dr. Smith" 
                          className="text-lg h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="appointmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Appointment Type*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Regular check-up, Surgery follow-up, etc." 
                          className="text-lg h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base">Date*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-12 text-base",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                {selectedDate ? (
                                  format(selectedDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormLabel className="text-base">Time*</FormLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="time"
                        value={selectedTime}
                        onChange={handleTimeChange}
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Location</FormLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input 
                            placeholder="City Eye Center, Suite 304" 
                            className="pl-10 text-base h-12" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Where your appointment will take place
                      </FormDescription>
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
                          placeholder="Any special instructions or things to remember" 
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
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Adding..." : "Add Appointment"}
                {!isSubmitting && <Plus className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Form>
      </main>
      
      <Navigation />
    </div>
  );
}
