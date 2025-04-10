import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedInsertMedicationSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function AddMedication() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refetchAll } = useMedicationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('details');

  // Default user ID is 1 until authentication is implemented
  const DEFAULT_USER_ID = 1;

  const form = useForm({
    resolver: zodResolver(enhancedInsertMedicationSchema),
    defaultValues: {
      userId: DEFAULT_USER_ID,
      name: '',
      dosage: '',
      instructions: '',
      eye: 'both',
      capColor: '#000000',
      remainingDoses: 60,
      totalDoses: 60,
      expiryDate: undefined,
      bottleOpenDate: new Date(),
    }
  });

  // Handle tab navigation
  const goToNextTab = (e: React.MouseEvent) => {
    // Prevent form submission
    e.preventDefault();
    
    if (selectedTab === 'details') {
      // Validate the details tab before moving to inventory
      const detailsValid = form.trigger(['name', 'eye', 'capColor']);
      detailsValid.then(isValid => {
        if (isValid) {
          setSelectedTab('inventory');
        }
      });
    }
  };

  const goToPreviousTab = (e: React.MouseEvent) => {
    // Prevent form submission
    e.preventDefault();
    setSelectedTab('details');
  };
  
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Convert numeric strings to numbers
      if (data.remainingDoses) {
        data.remainingDoses = Number(data.remainingDoses);
      }
      if (data.totalDoses) {
        data.totalDoses = Number(data.totalDoses);
      }
      
      console.log('Submitting medication data:', data);
      
      const response = await apiRequest('POST', '/api/medications', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server validation error:', errorData);
        
        // Display specific validation errors if available
        if (errorData.errors && errorData.errors.length > 0) {
          const errorMessages = errorData.errors.map((err: any) => 
            `${err.path.join('.')}: ${err.message}`
          ).join('\n');
          
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        
        throw new Error(errorData.message || 'Failed to add medication');
      }
      
      const medication = await response.json();
      
      toast({
        title: "Medication added",
        description: `${medication.name} has been added to your medications.`
      });
      
      await refetchAll();
      navigate('/medications'); // Navigate back to medications list after adding
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto">
      <Header title="Add Medication" />
      
      <main className="p-4">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0 flex items-center" 
          onClick={() => navigate('/medications')}
        >
          <ArrowLeft className="mr-1 h-5 w-5" />
          Back to Medications
        </Button>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Medication Details</CardTitle>
                    <CardDescription>Enter information about your eye medication</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Medication Name*</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter medication name" 
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
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Dosage</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. 0.5%, 5mg/ml" 
                              className="text-lg h-12" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Concentration or strength of the medication
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any special instructions" 
                              className="resize-none min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="eye"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-base">Which Eye</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1 mt-2"
                            >
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="left" id="left" />
                                <Label htmlFor="left">Left eye</Label>
                              </div>
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="right" id="right" />
                                <Label htmlFor="right">Right eye</Label>
                              </div>
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="both" id="both" />
                                <Label htmlFor="both">Both eyes</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            Select which eye this medication is for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Cap Color</FormLabel>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input 
                                type="color"
                                className="w-full h-12"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Select the color of your medication bottle cap for easy identification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="inventory" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Information</CardTitle>
                    <CardDescription>Track your medication supply</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalDoses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Total Doses</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                className="text-lg h-12" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="remainingDoses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Remaining</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                className="text-lg h-12" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bottleOpenDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base">Date Opened</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal h-12 text-lg",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
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
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Track when you opened the bottle (many eye drops expire 28-30 days after opening)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base">Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal h-12 text-lg",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
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
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date()
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            The date printed on the medication package
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between">
              {selectedTab === 'details' ? (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/medications')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={goToNextTab}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousTab}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? "Adding..." : "Add Medication"}
                    {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
