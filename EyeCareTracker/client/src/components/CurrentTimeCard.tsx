import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getFormattedDate, getFormattedTime } from '@/lib/utils';

export default function CurrentTimeCard() {
  const [currentDate, setCurrentDate] = useState(getFormattedDate(new Date()));
  const [currentTime, setCurrentTime] = useState(getFormattedTime(new Date()));
  
  useEffect(() => {
    // Update time every minute
    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentDate(getFormattedDate(now));
      setCurrentTime(getFormattedTime(now));
    }, 60000);
    
    // Run once immediately
    const now = new Date();
    setCurrentDate(getFormattedDate(now));
    setCurrentTime(getFormattedTime(now));
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h2 className="text-xl font-medium mb-2">Today</h2>
        <div className="flex justify-between items-center">
          <div className="text-lg">{currentDate}</div>
          <div className="text-2xl font-bold">{currentTime}</div>
        </div>
      </CardContent>
    </Card>
  );
}
