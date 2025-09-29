import { Calendar, Map, Plus, Users, Bus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentRole: 'parent' | 'driver';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ currentRole, activeTab, onTabChange }: BottomNavProps) {
  const parentTabs = [
    { id: 'bookings', label: 'Bookings', icon: Home },
    { id: 'routes', label: 'Routes', icon: Map },
    { id: 'book', label: 'Book', icon: Plus }
  ];

  const driverTabs = [
    { id: 'manifest', label: 'Manifest', icon: Users },
    { id: 'route', label: 'Route', icon: Bus },
    { id: 'map', label: 'Map', icon: Map }
  ];

  const tabs = currentRole === 'parent' ? parentTabs : driverTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                data-testid={`nav-${tab.id}`}
                className={cn(
                  "flex flex-col items-center gap-1 min-h-12 min-w-12 px-2 py-1",
                  isActive && "text-primary"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}