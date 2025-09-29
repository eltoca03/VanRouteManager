import { useState } from 'react';
import { Bus, Users, Calendar } from 'lucide-react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import ParentDashboard from "@/components/ParentDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import BottomNav from "@/components/BottomNav";

type UserRole = 'parent' | 'driver';

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('parent');
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Mock data for demonstration //todo: remove mock functionality
  const mockBookings = [
    {
      id: '1',
      studentName: 'Alex Johnson',
      route: 'Frisco Route',
      stop: 'Main Street Plaza',
      date: 'Dec 15, 2024',
      timeSlot: 'morning' as const,
      time: '7:30 AM',
      status: 'confirmed' as const
    },
    {
      id: '2',
      studentName: 'Emma Davis',
      route: 'Dallas Route',
      stop: 'Community Center',
      date: 'Dec 16, 2024',
      timeSlot: 'afternoon' as const,
      time: '3:45 PM',
      status: 'confirmed' as const
    },
    {
      id: '3',
      studentName: 'Alex Johnson',
      route: 'Frisco Route',
      stop: 'Soccer Academy',
      date: 'Dec 14, 2024',
      timeSlot: 'morning' as const,
      time: '8:00 AM',
      status: 'cancelled' as const
    }
  ];
  
  const mockDriverStudents = [
    {
      id: '1',
      name: 'Alex Johnson',
      stop: 'Main Street Plaza',
      isPickedUp: false
    },
    {
      id: '2',
      name: 'Emma Davis',
      stop: 'Main Street Plaza',
      isPickedUp: true
    },
    {
      id: '3',
      name: 'Michael Chen',
      stop: 'Community Center',
      isPickedUp: false
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      stop: 'Community Center',
      isPickedUp: false
    },
    {
      id: '5',
      name: 'David Rodriguez',
      stop: 'Soccer Academy',
      isPickedUp: true
    }
  ];
  
  const handleCancelBooking = (id: string) => {
    console.log(`Cancelled booking ${id}`);
    // In a real app, this would update the booking status
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <div className="min-h-screen bg-background">
            {/* Header - Mobile Optimized */}
            <header className="border-b bg-card">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-6 h-6 text-primary" />
                  <div>
                    <h1 className="font-bold text-base">Soccer Academy</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">Transportation System</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Compact Role Switcher for Demo */}
                  <div className="flex rounded border">
                    <Button
                      variant={currentRole === 'parent' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setCurrentRole('parent');
                        setActiveTab('bookings');
                      }}
                      data-testid="button-role-parent"
                      className="rounded-r-none text-xs px-2"
                    >
                      Parent
                    </Button>
                    <Button
                      variant={currentRole === 'driver' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setCurrentRole('driver');
                        setActiveTab('manifest');
                      }}
                      data-testid="button-role-driver"
                      className="rounded-l-none text-xs px-2"
                    >
                      Driver
                    </Button>
                  </div>
                  
                  <ThemeToggle />
                </div>
              </div>
            </header>
            
            {/* Main Content - Mobile Optimized with Bottom Nav Spacing */}
            <main className="container mx-auto px-4 py-4 pb-20">
              {currentRole === 'parent' && (
                <ParentDashboard
                  bookings={mockBookings}
                  onCancelBooking={handleCancelBooking}
                  onNewBooking={() => console.log('New booking requested')}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              )}
              
              {currentRole === 'driver' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <h1 className="text-xl font-bold">Driver Dashboard</h1>
                      <p className="text-sm text-muted-foreground">Manage route and track student pickups</p>
                    </div>
                  </div>
                  
                  <DriverDashboard
                    routeName="Frisco Route"
                    timeSlot="morning"
                    students={mockDriverStudents}
                    onToggleRoute={(isActive) => console.log('Route toggled:', isActive)}
                    onToggleStudent={(studentId) => console.log('Student toggled:', studentId)}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>
              )}
              
              {/* Features Overview - Hidden on Mobile */}
              <div className="mt-8 pt-8 border-t hidden lg:block">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">System Features</h2>
                  <p className="text-muted-foreground">
                    Complete transportation management for the soccer academy
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Parent Booking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li>• Book up to 1 month ahead</li>
                        <li>• Real-time seat availability</li>
                        <li>• Same-day cancellations</li>
                        <li>• Multiple children support</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bus className="w-4 h-4" />
                        Driver Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li>• Route activation controls</li>
                        <li>• Student pickup tracking</li>
                        <li>• Stop-by-stop manifests</li>
                        <li>• Real-time GPS sharing</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Admin Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li>• Route & stop management</li>
                        <li>• Capacity monitoring</li>
                        <li>• Parent notifications</li>
                        <li>• Booking analytics</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center mt-6">
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Frisco Route</Badge>
                    <Badge variant="outline">Dallas Route</Badge>
                    <Badge variant="outline">14 Seat Capacity</Badge>
                    <Badge variant="outline">Real-time Tracking</Badge>
                  </div>
                </div>
              </div>
            </main>
            
            {/* Bottom Navigation */}
            <BottomNav
              currentRole={currentRole}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
