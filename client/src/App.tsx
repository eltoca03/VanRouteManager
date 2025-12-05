import { useState, useEffect } from 'react';
import { Bus, Users, Calendar, LogOut } from 'lucide-react';
import sisuLogo from '@assets/Sisu_Logos-01_1759436830537.png';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import ParentDashboard from "@/components/ParentDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import ParentApproval from "@/components/ParentApproval";
import BottomNav from "@/components/BottomNav";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type UserRole = 'parent' | 'driver';

function AuthenticatedApp() {
  const { user, logout, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const { toast } = useToast();
  
  // Set default activeTab based on user role
  const getDefaultTab = () => {
    if (!user) return 'bookings';
    return user.role === 'driver' ? 'manifest' : 'bookings';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Update activeTab when user changes (on login)
  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'driver' ? 'manifest' : 'bookings');
    }
  }, [user?.role]);
  
  // Real API calls for parent data
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: user?.role === 'parent'
  });
  
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
    enabled: user?.role === 'parent'
  });

  // Real API calls for driver data  
  const { data: allBookingsData, isLoading: allBookingsLoading } = useQuery({
    queryKey: ['/api/driver/bookings'],
    enabled: user?.role === 'driver'
  });

  // Fetch routes for driver (same as parent)
  const { data: driverRoutesData, isLoading: driverRoutesLoading } = useQuery({
    queryKey: ['/api/routes'],
    enabled: user?.role === 'driver'
  });
  
  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: { status: 'cancelled' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been successfully cancelled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation failed',
        description: error.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  });
  
  if (isLoading || (user?.role === 'parent' && bookingsLoading) || (user?.role === 'driver' && (allBookingsLoading || driverRoutesLoading))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bus className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    if (showSignup) {
      return <SignupForm onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <LoginForm onSwitchToSignup={() => setShowSignup(true)} />;
  }
  
  const currentRole = user.role;
  
  // Transform backend data to match UI expectations
  const bookings = (bookingsData as any)?.bookings || [];
  const students = (studentsData as any)?.students || [];
  
  // Transform real bookings into driver student format
  const allBookings = (allBookingsData as any)?.bookings || [];
  const driverStudents = allBookings
    .filter((booking: any) => booking.status === 'confirmed')
    .map((booking: any) => ({
      id: booking.studentId,
      name: booking.studentName,
      stop: booking.stopName,
      timeSlot: booking.timeSlot,
      isPickedUp: false  // Default pickup status - could be stored in future
    }));

  // Get routes for driver (same as parent)
  const driverRoutes = (driverRoutesData as any)?.routes || [];
  
  const handleCancelBooking = (id: string) => {
    cancelBookingMutation.mutate(id);
  };
  
  const handleNewBooking = () => {
    setActiveTab('book');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={sisuLogo} alt="SISU Soccer Academy" className="h-8 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Transportation System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* User Info and Logout */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-2">
                {user.name} ({currentRole === 'parent' ? 'Parent' : 'Driver'})
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
                className="min-h-11 px-2"
              >
                <LogOut className="w-4 h-4" />
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
            bookings={bookings}
            students={students}
            onCancelBooking={handleCancelBooking}
            onNewBooking={handleNewBooking}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isLoading={bookingsLoading || cancelBookingMutation.isPending}
          />
        )}
        
        {currentRole === 'driver' && activeTab === 'approvals' && (
          <ParentApproval />
        )}
        
        {currentRole === 'driver' && (activeTab === 'manifest' || activeTab === 'map') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Driver Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage route and track student pickups</p>
              </div>
            </div>
            
            {/* Driver Route Cards - Unified routes showing both morning and afternoon */}
            <div className="grid gap-4">
              {driverRoutes.map((route: any) => {
                // Filter students for this specific route based on route stops
                const routeStops = route.stops || [];
                const stopNames = routeStops.map((stop: any) => stop.name);
                const routeStudents = driverStudents.filter((student: any) => 
                  stopNames.includes(student.stop)
                );
                
                // Create a map of stop names to their ordering info for proper sorting
                const stopOrderMap = routeStops.reduce((acc: any, stop: any) => {
                  acc[stop.name] = {
                    morningOrder: stop.morningOrder,
                    afternoonOrder: stop.afternoonOrder
                  };
                  return acc;
                }, {});
                
                console.log(`App.tsx: ${route.name} - ${routeStudents.length} total students:`, routeStudents);
                
                return (
                  <div key={route.id} className="space-y-4">
                    <DriverDashboard
                      routeName={route.name}
                      route={route}
                      students={routeStudents}
                      stopOrderMap={stopOrderMap}
                      onToggleRoute={(isActive) => console.log('Route toggled:', isActive)}
                      onToggleStudent={(studentId) => console.log('Student toggled:', studentId)}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Features Overview - Hidden on Mobile */}
        <div className="mt-8 pt-8 border-t hidden lg:block">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">System Features</h2>
            <p className="text-muted-foreground">
              Complete transportation management for SISU Soccer Academy
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;