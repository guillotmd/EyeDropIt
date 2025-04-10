import { useLocation, Link } from 'wouter';
import { 
  Home as HomeIcon, 
  Calendar as CalendarIcon, 
  PlusCircle as PlusIcon, 
  Pill as PillIcon, 
  User as UserIcon 
} from 'lucide-react';

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 pt-2 pb-6 px-4 max-w-md mx-auto z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>
            <HomeIcon className="size-7" />
            <span className="text-sm mt-1">Home</span>
          </a>
        </Link>
        
        <Link href="/schedule">
          <a className={`flex flex-col items-center ${isActive('/schedule') ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>
            <CalendarIcon className="size-7" />
            <span className="text-sm mt-1">Schedule</span>
          </a>
        </Link>
        
        <Link href="/add-dose">
          <a className="flex flex-col items-center text-neutral-500 dark:text-neutral-400">
            <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center text-white -mt-8">
              <PlusIcon className="size-8" />
            </div>
            <span className="text-sm mt-1">Record</span>
          </a>
        </Link>
        
        <Link href="/medications">
          <a className={`flex flex-col items-center ${isActive('/medications') ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>
            <PillIcon className="size-7" />
            <span className="text-sm mt-1">Medicines</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex flex-col items-center ${isActive('/profile') ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>
            <UserIcon className="size-7" />
            <span className="text-sm mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
