import { useState } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/useDarkMode';
import useNotifications from '@/hooks/useNotifications';
import { 
  Bell, 
  Eye, 
  Moon,
  Sun, 
  Globe, 
  FileText, 
  HelpCircle, 
  Mail, 
  Trash2,
  LucideIcon,
  ChevronRight
} from 'lucide-react';

interface SettingItemProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: 'toggle' | 'button' | 'link';
  toggled?: boolean;
  onToggle?: () => void;
  buttonText?: string;
  onClick?: () => void;
  href?: string;
}

const SettingItem = ({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  toggled, 
  onToggle, 
  buttonText, 
  onClick, 
  href 
}: SettingItemProps) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action === 'toggle' && onToggle && (
        <Switch checked={toggled} onCheckedChange={onToggle} />
      )}
      {action === 'button' && onClick && (
        <Button variant="outline" size="sm" onClick={onClick}>
          {buttonText || 'Action'}
        </Button>
      )}
      {action === 'link' && href && (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
};

export default function Profile() {
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    document.documentElement.classList.toggle('high-contrast', !isHighContrast);
    toast({
      title: !isHighContrast ? "High contrast enabled" : "High contrast disabled",
      description: !isHighContrast 
        ? "Display is now using higher contrast for better visibility" 
        : "Display has returned to normal contrast",
    });
  };

  const toggleLargeText = () => {
    setIsLargeText(!isLargeText);
    document.documentElement.classList.toggle('large-text', !isLargeText);
    toast({
      title: !isLargeText ? "Large text enabled" : "Large text disabled",
      description: !isLargeText
        ? "Text size has been increased for better readability"
        : "Text size has been reset to normal",
    });
  };

  const handleRequestNotifications = async () => {
    await requestPermission();
    toast({
      title: "Notification settings updated",
      description: permission === 'granted' 
        ? "You will now receive reminders for your medications" 
        : "Please enable notifications in your browser settings to receive reminders",
    });
  };

  const areNotificationsEnabled = permission === 'granted';

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24">
      <Header title="Profile & Settings" />
      
      <main className="p-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Customize the app to meet your visual needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <SettingItem
                title="High Contrast Mode"
                description="Enhance visual contrast for better visibility"
                icon={Eye}
                action="toggle"
                toggled={isHighContrast}
                onToggle={toggleHighContrast}
              />
              <SettingItem
                title="Large Text"
                description="Increase text size throughout the app"
                icon={FileText}
                action="toggle"
                toggled={isLargeText}
                onToggle={toggleLargeText}
              />
              <SettingItem
                title="Dark Mode"
                description="Switch between light and dark themes"
                icon={isDarkMode ? Moon : Sun}
                action="toggle"
                toggled={isDarkMode}
                onToggle={toggleDarkMode}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Control your medication reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isSupported ? (
                <SettingItem
                  title="Enable Reminders"
                  description={areNotificationsEnabled 
                    ? "You'll receive reminders for your medications" 
                    : "Allow notifications to receive medication reminders"}
                  icon={Bell}
                  action="toggle"
                  toggled={areNotificationsEnabled}
                  onToggle={handleRequestNotifications}
                />
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  Notifications are not supported in this browser.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Get help with the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <SettingItem
                title="Help Center"
                description="Frequently asked questions and guides"
                icon={HelpCircle}
                action="link"
                href="/help"
              />
              <SettingItem
                title="Contact Support"
                description="Email our support team"
                icon={Mail}
                action="link"
                href="/contact"
              />
              <SettingItem
                title="Terms & Privacy"
                description="Legal information about using EyeDrop Buddy"
                icon={Globe}
                action="link"
                href="/terms"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingItem
                title="Clear All Data"
                description="This will permanently delete all your medications and schedules"
                icon={Trash2}
                action="button"
                buttonText="Clear Data"
                onClick={() => {
                  toast({
                    title: "This feature is not available",
                    description: "Clearing all data is disabled in this version",
                    variant: "destructive"
                  });
                }}
              />
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              EyeDrop Buddy v1.0.0
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Navigation />
    </div>
  );
}
