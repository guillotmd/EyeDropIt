import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, Link, useRoute } from "wouter";
import { z } from "zod";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Header from "@/components/Header";
import { useMedicationContext } from "@/contexts/MedicationContext";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Medication } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function EditMedication() {
  const [match, params] = useRoute<{ id: string }>("/edit-medication/:id");
  const id = params?.id;
  
  const medicationId = id ? parseInt(id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { medications, refetchAll } = useMedicationContext();
  
  const [selectedTab, setSelectedTab] = useState<string>("details");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Find the medication to edit
  const medication = medications.find((med) => med.id === medicationId);
  
  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, "Medication name is required"),
    dosage: z.string().optional(),
    instructions: z.string().optional(),
    eye: z.enum(["left", "right", "both"]),
    capColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    remainingDoses: z.number().optional(),
    totalDoses: z.number().optional(),
    expiryDate: z.date().optional(),
    bottleOpenDate: z.date().optional(),
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dosage: "",
      instructions: "",
      eye: "both",
      capColor: "#000000",
      remainingDoses: 0,
      totalDoses: 0,
      expiryDate: undefined,
      bottleOpenDate: new Date(),
    }
  });
  
  // Load medication data when component mounts or medication changes
  useEffect(() => {
    if (medication) {
      form.reset({
        name: medication.name,
        dosage: medication.dosage || "",
        instructions: medication.instructions || "",
        eye: (medication.eye as "left" | "right" | "both") || "both",
        capColor: medication.capColor || "#000000",
        remainingDoses: medication.remainingDoses || undefined,
        totalDoses: medication.totalDoses || undefined,
        expiryDate: medication.expiryDate ? new Date(medication.expiryDate) : undefined,
        bottleOpenDate: medication.bottleOpenDate ? new Date(medication.bottleOpenDate) : new Date(),
      });
      setIsLoading(false);
    }
  }, [medication, form]);
  
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
      
      console.log('Updating medication data:', data);
      
      const response = await apiRequest('PUT', `/api/medications/${medicationId}`, data);
      
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
        
        throw new Error(errorData.message || 'Failed to update medication');
      }
      
      const updatedMedication = await response.json();
      
      toast({
        title: "Medication updated",
        description: `${updatedMedication.name} has been updated successfully.`
      });
      
      await refetchAll();
      navigate('/medications'); // Navigate back to medications list
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update medication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If medication not found
  if (!medication && !isLoading) {
    return (
      <div className="min-h-screen max-w-md mx-auto">
        <Header title="Edit Medication" />
        <main className="p-4">
          <Card className="my-4">
            <CardContent className="pt-6">
              <p>Medication not found.</p>
              <Button className="mt-4" onClick={() => navigate('/medications')}>
                Back to Medications
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen max-w-md mx-auto">
      <Header title="Edit Medication" />
      
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
                    <CardDescription>Update information about your eye medication</CardDescription>
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
                              value={field.value}
                              className="flex flex-col space-y-1 mt-2"
                            >
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="left" id="left-edit" />
                                <Label htmlFor="left-edit">Left eye</Label>
                              </div>
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="right" id="right-edit" />
                                <Label htmlFor="right-edit">Right eye</Label>
                              </div>
                              <div className="flex items-center space-x-3 space-y-0">
                                <RadioGroupItem value="both" id="both-edit" />
                                <Label htmlFor="both-edit">Both eyes</Label>
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
                    <CardDescription>Update your medication supply</CardDescription>
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
                                value={field.value || ''}
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
                                value={field.value || ''}
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
                    onClick={() => setSelectedTab('inventory')}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedTab('details')}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
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