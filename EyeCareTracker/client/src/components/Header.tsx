import { useDarkMode } from '@/hooks/useDarkMode';
import { Button } from '@/components/ui/button';
import { MoonIcon, SunIcon, Settings } from 'lucide-react';
import { Link } from 'wouter';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "EyeDrop Buddy" }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <header className="bg-primary dark:bg-neutral-800 text-white p-4 flex items-center justify-between sticky top-0 z-10">
      <Link href="/">
        <a className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-3xl mr-2 size-8"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <h1 className="text-2xl font-bold">{title}</h1>
        </a>
      </Link>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="text-white hover:text-white/80 hover:bg-white/10"
        >
          {isDarkMode ? (
            <SunIcon className="size-6" />
          ) : (
            <MoonIcon className="size-6" />
          )}
        </Button>
        <Link href="/profile">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Settings"
            className="text-white hover:text-white/80 hover:bg-white/10"
          >
            <Settings className="size-6" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
