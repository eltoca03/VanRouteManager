import { useState } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import BookingCard from './BookingCard';
import BookingForm from './BookingForm';
import RouteCard from './RouteCard';

interface Booking {
  id: string;
  studentName: string;
  route: string;
  stop: string;
  date: string;
  timeSlot: 'morning' | 'afternoon';
  time: string;
  status: 'confirmed' | 'cancelled';
}

interface Student {
  id: string;
  name: string;
  parentId: string;
}

interface ParentDashboardProps {
  bookings: Booking[];
  students: Student[];
  onCancelBooking?: (id: string) => void;
  onNewBooking?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isLoading?: boolean;
}

export default function ParentDashboard({
  bookings,
  students,
  onCancelBooking,
  onNewBooking,
  activeTab = 'bookings',
  onTabChange,
  isLoading = false
}: ParentDashboardProps) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { toast } = useToast();
  
  // Fetch routes from backend
  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['/api/routes'],
    enabled: activeTab === 'book' || showBookingForm
  });
  
  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest('/api/bookings', {
        method: 'POST',
        body: bookingData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: 'Booking created',
        description: 'Your transportation has been successfully booked.',
      });
      setShowBookingForm(false);
      if (onTabChange) onTabChange('bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Booking failed',
        description: error.message || 'Failed to create booking',
        variant: 'destructive',
      });
    }
  });
  
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const recentBookings = bookings.slice(-5);
  
  const groupedBookings = upcomingBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);
  
  const routes = routesData?.routes || [];
  
  // Handle tab-based booking form for mobile
  if (showBookingForm || activeTab === 'book') {
    const handleBookingSubmit = (bookingData: any) => {
      createBookingMutation.mutate(bookingData);
    };
    
    // Transform routes for booking form
    const formRoutes = routes.map((route: any) => ({
      id: route.id,
      name: route.name,
      area: route.area || 'area',
      stops: route.stops?.map((stop: any) => ({
        id: stop.id,
        name: stop.name,
        availableSeats: Math.max(0, route.capacity - (stop.bookedSeats || 0)),
        time: stop.morningTime || '8:00 AM'
      })) || []
    }));
    
    if (routesLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading booking form...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Book Transportation</h1>
          <Button
            variant="ghost"
            onClick={() => {
              setShowBookingForm(false);
              if (onTabChange) onTabChange('bookings');
            }}
            className="md:hidden min-h-11"
          >
            Cancel
          </Button>
        </div>
        <BookingForm
          students={students}
          routes={formRoutes}
          selectedDate={new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
          onSubmit={handleBookingSubmit}
          onCancel={() => {
            setShowBookingForm(false);
            if (onTabChange) onTabChange('bookings');
          }}
          isSubmitting={createBookingMutation.isPending}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Transportation</h1>
          <p className="text-sm text-muted-foreground">Manage your child's bookings</p>
        </div>
        <Button
          onClick={() => {
            setShowBookingForm(true);
            if (onNewBooking) onNewBooking();
          }}
          data-testid="button-new-booking"
          className="flex items-center gap-2 md:hidden min-h-11"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          Book
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings" className="text-sm">My Bookings</TabsTrigger>
          <TabsTrigger value="routes" className="text-sm">View Routes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No upcoming bookings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't have any transportation bookings scheduled.
                  </p>
                  <Button 
                    onClick={() => {
                      setShowBookingForm(true);
                      if (onTabChange) onTabChange('book');
                    }}
                    className="min-h-11"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Transportation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:flex md:justify-end">
                <Button 
                  onClick={() => {
                    setShowBookingForm(true);
                    if (onNewBooking) onNewBooking();
                  }}
                  className="min-h-11"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book Transportation
                </Button>
              </div>
              
              {Object.entries(groupedBookings).map(([date, dayBookings]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">{date}</h3>
                  </div>
                  <div className="grid gap-2">
                    {dayBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        {...booking}
                        onCancel={onCancelBooking}
                        canCancel={!isLoading}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {recentBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentBookings.map((booking) => (
                  <BookingCard
                    key={`recent-${booking.id}`}
                    {...booking}
                    canCancel={false}
                    className="bg-muted/30"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          {routes.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No routes available</h3>
                  <p className="text-sm text-muted-foreground">
                    No transportation routes are currently configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {routes.map((route: any) => (
                <RouteCard
                  key={route.id}
                  id={route.id}
                  name={route.name}
                  area={route.area}
                  capacity={route.capacity}
                  stops={route.stops || []}
                  timeSlot={route.timeSlot || 'morning'}
                  isDriverActive={route.isDriverActive || false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}