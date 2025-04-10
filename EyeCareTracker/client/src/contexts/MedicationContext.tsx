import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, QueryClient } from '@tanstack/react-query';
import type { 
  Medication, 
  Schedule, 
  Dose, 
  Appointment, 
  MedicationWithSchedules, 
  NextDose 
} from '@shared/schema';
import { queryClient as globalQueryClient } from '@/lib/queryClient';

type MedicationContextType = {
  isLoading: boolean;
  medications: Medication[];
  schedules: Schedule[];
  nextDoses: NextDose[];
  appointments: Appointment[];
  adherenceStats: {date: string; completed: number; scheduled: number}[];
  refetchAll: () => Promise<void>;
  queryClient: QueryClient;
};

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider = ({ children }: { children: ReactNode }) => {
  // Fetch all the required data
  const { data: medications = [], isLoading: isMedicationsLoading } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
  });
  
  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });
  
  const { data: nextDoses = [], isLoading: isNextDosesLoading } = useQuery<NextDose[]>({
    queryKey: ['/api/next-doses'],
  });
  
  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });
  
  const { data: adherenceStats = [], isLoading: isAdherenceStatsLoading } = useQuery<{date: string; completed: number; scheduled: number}[]>({
    queryKey: ['/api/adherence-stats'],
  });

  const isLoading = 
    isMedicationsLoading || 
    isSchedulesLoading || 
    isNextDosesLoading || 
    isAppointmentsLoading ||
    isAdherenceStatsLoading;

  const refetchAll = async () => {
    await Promise.all([
      globalQueryClient.invalidateQueries({ queryKey: ['/api/medications'] }),
      globalQueryClient.invalidateQueries({ queryKey: ['/api/schedules'] }),
      globalQueryClient.invalidateQueries({ queryKey: ['/api/next-doses'] }),
      globalQueryClient.invalidateQueries({ queryKey: ['/api/appointments'] }),
      globalQueryClient.invalidateQueries({ queryKey: ['/api/adherence-stats'] })
    ]);
  };

  // Check if we need to initialize mock data for demonstration
  useEffect(() => {
    const initializeData = async () => {
      if (!isLoading && medications.length === 0) {
        // The app is meant to start empty
        console.log('No medications found, app is ready for user input');
      }
    };

    if (!isLoading) {
      initializeData();
    }
  }, [isLoading, medications.length]);

  return (
    <MedicationContext.Provider
      value={{
        isLoading,
        medications,
        schedules,
        nextDoses,
        appointments,
        adherenceStats,
        refetchAll,
        queryClient: globalQueryClient
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedicationContext = () => {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error('useMedicationContext must be used within a MedicationProvider');
  }
  return context;
};
