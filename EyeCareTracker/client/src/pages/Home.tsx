import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CurrentTimeCard from '@/components/CurrentTimeCard';
import NextMedicationCard from '@/components/NextMedicationCard';
import TodaySchedule from '@/components/TodaySchedule';
import MedicationInventory from '@/components/MedicationInventory';
import UpcomingAppointment from '@/components/UpcomingAppointment';
import AdherenceStats from '@/components/AdherenceStats';
import { useReminders } from '@/hooks/useReminders';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicationContext } from '@/contexts/MedicationContext';

export default function Home() {
  const { isLoading } = useMedicationContext();
  useReminders(); // Initialize reminders system

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24"> {/* pb-24 for navigation space */}
      <Header />
      
      <main className="p-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <CurrentTimeCard />
            <NextMedicationCard />
            <TodaySchedule />
            <MedicationInventory />
            <UpcomingAppointment />
            <AdherenceStats />
          </>
        )}
      </main>
      
      <Navigation />
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <Skeleton className="w-full h-24 mb-6" />
      <Skeleton className="w-full h-40 mb-6" />
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="w-full h-48" />
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="w-full h-48" />
      </div>
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="w-full h-48" />
      </div>
    </>
  );
}
