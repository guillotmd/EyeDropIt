import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { calculateRemainingPercent, getRefillStatus } from '@/lib/utils';
import { useMedicationContext } from '@/contexts/MedicationContext';

export default function MedicationInventory() {
  const { medications } = useMedicationContext();

  const hasMedications = medications.length > 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">My Medications</h2>
        <Link href="/medications">
          <Button variant="link" className="text-primary flex items-center">
            <span>Manage</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="p-4">
          {!hasMedications ? (
            <div className="text-center py-4">
              <p className="mb-4 text-muted-foreground">No medications added yet</p>
              <Link href="/add-medication">
                <Button>Add Medication</Button>
              </Link>
            </div>
          ) : (
            medications.map((med) => {
              const remainingPercent = med.remainingDoses && med.totalDoses 
                ? calculateRemainingPercent(med.remainingDoses, med.totalDoses)
                : 100;
              
              const refillStatus = getRefillStatus(remainingPercent);
              
              return (
                <div key={med.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      {med.capColor && (
                        <div 
                          className="w-6 h-6 rounded-full mr-2 flex-shrink-0 border"
                          style={{ backgroundColor: med.capColor }}
                          aria-label={`Cap color: ${med.capColor}`}
                          title={`Cap color: ${med.capColor}`}
                        />
                      )}
                      <div className="font-medium text-lg">{med.name} {med.dosage}</div>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">{remainingPercent}%</span>
                      <div className="w-16 h-2 rounded-full overflow-hidden">
                        <Progress value={remainingPercent} className={
                          remainingPercent > 50 ? "bg-secondary" : 
                          remainingPercent > 20 ? "bg-warning" : "bg-destructive"
                        } />
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm flex items-center
                    ${refillStatus.color === "secondary" ? "text-neutral-500 dark:text-neutral-400" : 
                      refillStatus.color === "warning" ? "text-warning" : "text-destructive"}
                  `}>
                    {refillStatus.color === "secondary" ? (
                      <AlertCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    )}
                    <span>{refillStatus.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
