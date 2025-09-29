import { useState } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ParentDashboardProps {
  bookings: Booking[];
  onCancelBooking?: (id: string) => void;
  onNewBooking?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function ParentDashboard({
  bookings,
  onCancelBooking,
  onNewBooking,
  activeTab = 'bookings',
  onTabChange
}: ParentDashboardProps) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const recentBookings = bookings.slice(-5);
  
  const groupedBookings = upcomingBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);
  
  const mockRoutes = [
    {
      id: 'frisco',
      name: 'Frisco Route',
      area: 'frisco',
      capacity: 14,
      stops: [
        {
          id: 'stop1',
          name: 'Main Street Plaza',
          morningTime: '7:30 AM',
          afternoonTime: '3:30 PM',
          bookedSeats: 6
        },
        {
          id: 'stop2',
          name: 'Community Center',
          morningTime: '7:45 AM',
          afternoonTime: '3:45 PM',
          bookedSeats: 4
        },
        {
          id: 'stop3',
          name: 'Soccer Academy',
          morningTime: '8:00 AM',
          afternoonTime: '4:00 PM',
          bookedSeats: 3
        }
      ],
      timeSlot: 'morning' as const,
      isDriverActive: true
    },
    {
      id: 'dallas',
      name: 'Dallas Route',
      area: 'dallas',
      capacity: 14,
      stops: [
        {
          id: 'stop4',
          name: 'Downtown Center',
          morningTime: '7:30 AM',
          afternoonTime: '3:30 PM',
          bookedSeats: 8
        },
        {
          id: 'stop5',
          name: 'Park Plaza',
          morningTime: '7:45 AM',
          afternoonTime: '3:45 PM',
          bookedSeats: 5
        }
      ],
      timeSlot: 'afternoon' as const,
      isDriverActive: false
    }
  ];
  
  // Handle tab-based booking form for mobile
  if (showBookingForm || activeTab === 'book') {
    const mockStudents = [
      { id: '1', name: 'Alex Johnson' },
      { id: '2', name: 'Emma Davis' }
    ];
    
    const mockFormRoutes = [
      {
        id: 'frisco',
        name: 'Frisco Route',
        area: 'frisco',
        stops: [
          {
            id: 'stop1',
            name: 'Main Street Plaza',
            availableSeats: 8,
            time: '7:30 AM'
          },
          {
            id: 'stop2',
            name: 'Community Center',
            availableSeats: 2,
            time: '7:45 AM'
          }
        ]
      }
    ];
    
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
          students={mockStudents}
          routes={mockFormRoutes}
          selectedDate="December 15, 2024"
          onSubmit={(booking) => {
            console.log('New booking:', booking);
            setShowBookingForm(false);
            if (onTabChange) onTabChange('bookings');
          }}
          onCancel={() => {
            setShowBookingForm(false);
            if (onTabChange) onTabChange('bookings');
          }}
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
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Transportation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedBookings).map(([date, dayBookings]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">{date}</h3>
                  </div>
                  <div className="space-y-2">
                    {dayBookings.map(booking => (
                      <BookingCard
                        key={booking.id}
                        {...booking}
                        onCancel={onCancelBooking}
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
              <CardContent>
                <div className="space-y-2">
                  {recentBookings.slice(-3).map(booking => (
                    <BookingCard
                      key={`recent-${booking.id}`}
                      {...booking}
                      canCancel={false}
                      className="opacity-75"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          <div className="space-y-4">
            {mockRoutes.map(route => (
              <RouteCard
                key={route.id}
                {...route}
                onSelect={() => console.log(`Selected route: ${route.name}`)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Sticky Mobile Booking CTA */}
      {activeTab !== 'book' && (
        <div 
          className="fixed left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden" 
          style={{ bottom: `calc(4rem + env(safe-area-inset-bottom))` }}
        >
          <Button
            onClick={() => {
              setShowBookingForm(true);
              if (onTabChange) onTabChange('book');
              if (onNewBooking) onNewBooking();
            }}
            data-testid="button-mobile-booking-cta"
            className="w-full min-h-12 text-base font-medium"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Book Transportation
          </Button>
        </div>
      )}
    </div>
  );
}