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
}

export default function ParentDashboard({
  bookings,
  onCancelBooking,
  onNewBooking
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
  
  if (showBookingForm) {
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
      <BookingForm
        students={mockStudents}
        routes={mockFormRoutes}
        selectedDate="December 15, 2024"
        onSubmit={(booking) => {
          console.log('New booking:', booking);
          setShowBookingForm(false);
        }}
        onCancel={() => setShowBookingForm(false)}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transportation Dashboard</h1>
          <p className="text-muted-foreground">Manage your child's transportation bookings</p>
        </div>
        <Button
          onClick={() => {
            setShowBookingForm(true);
            if (onNewBooking) onNewBooking();
          }}
          data-testid="button-new-booking"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>
      
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="routes">View Routes</TabsTrigger>
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
                  <Button onClick={() => setShowBookingForm(true)}>
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
                    <h3 className="font-medium">{date}</h3>
                  </div>
                  <div className="grid gap-2">
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
          <div className="grid gap-4">
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
    </div>
  );
}