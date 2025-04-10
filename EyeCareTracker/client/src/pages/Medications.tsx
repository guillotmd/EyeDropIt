import { useState } from 'react';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  PlusCircle, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Edit,
  Eye,
  Check
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMedicationContext } from '@/contexts/MedicationContext';
import { calculateRemainingPercent, getRefillStatus, getFormattedTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function Medications() {
  const { medications, schedules, isLoading, refetchAll } = useMedicationContext();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(null);
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);

  const confirmDelete = (id: number) => {
    setMedicationToDelete(id);
    setIsDeletingOpen(true);
  };

  const handleDelete = async () => {
    if (!medicationToDelete) return;
    
    try {
      setDeletingId(medicationToDelete);
      await apiRequest('DELETE', `/api/medications/${medicationToDelete}`, undefined);
      
      toast({
        title: "Medication deleted",
        description: "The medication and its schedules have been removed",
      });
      
      await refetchAll();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "Error",
        description: "Failed to delete medication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
      setMedicationToDelete(null);
      setIsDeletingOpen(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24">
      <Header title="My Medications" />
      
      <main className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No medications yet</h2>
            <p className="text-muted-foreground mb-6">Add your eye medications to get started</p>
            <Link href="/add-medication">
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Medication
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link href="/add-medication">
                <Button className="w-full" size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Medication
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {medications.map((med) => {
                const remainingPercent = med.remainingDoses && med.totalDoses 
                  ? calculateRemainingPercent(med.remainingDoses, med.totalDoses)
                  : 100;
                
                const refillStatus = getRefillStatus(remainingPercent);
                
                // Get schedules for this medication
                const medSchedules = schedules.filter(s => s.medicationId === med.id);
                const sortedSchedules = [...medSchedules].sort((a, b) => 
                  a.time.localeCompare(b.time)
                );
                
                return (
                  <Accordion 
                    type="single" 
                    collapsible 
                    className="bg-card rounded-lg shadow-sm"
                    key={med.id}
                  >
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-start w-full">
                          <div className="flex-1 text-left">
                            <div className="font-medium text-lg">{med.name} {med.dosage}</div>
                            <div className="text-sm text-muted-foreground">
                              {medSchedules.length} schedule{medSchedules.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center mb-1">
                              <span className="text-sm mr-2">{remainingPercent}%</span>
                              <div className="w-16 h-2 rounded-full overflow-hidden">
                                <Progress value={remainingPercent} indicatorColor={
                                  remainingPercent > 50 ? "bg-secondary" : 
                                  remainingPercent > 20 ? "bg-warning" : "bg-destructive"
                                } />
                              </div>
                            </div>
                            <div className={`text-xs flex items-center
                              ${refillStatus.color === "secondary" ? "text-neutral-500 dark:text-neutral-400" : 
                                refillStatus.color === "warning" ? "text-warning" : "text-destructive"}
                            `}>
                              {refillStatus.color === "secondary" ? (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              <span>{refillStatus.message}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="px-4 pb-4">
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">Schedule</div>
                          {sortedSchedules.length > 0 ? (
                            <div className="space-y-2">
                              {sortedSchedules.map((schedule) => (
                                <div key={schedule.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-primary" />
                                    <span>{getFormattedTime(schedule.time)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="flex items-center">
                                      <Eye className="h-3 w-3 mr-1" />
                                      {schedule.eye}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {(schedule.daysOfWeek as string[]).map(d => d.slice(0, 1)).join(', ')}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No schedules set</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link href={`/edit-medication/${med.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => confirmDelete(med.id)}
                            disabled={deletingId === med.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          </>
        )}
      </main>
      
      <Navigation />
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeletingOpen} onOpenChange={setIsDeletingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medication</DialogTitle>
            <DialogDescription>
              This will permanently delete this medication and all its schedules. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletingOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
              {deletingId !== null ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
