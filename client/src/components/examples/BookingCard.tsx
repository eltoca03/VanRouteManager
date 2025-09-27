import { useState } from 'react';
import BookingCard from '../BookingCard';

export default function BookingCardExample() {
  const [bookings, setBookings] = useState([
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
      date: 'Dec 15, 2024',
      timeSlot: 'afternoon' as const,
      time: '3:45 PM',
      status: 'confirmed' as const
    },
    {
      id: '3',
      studentName: 'Michael Chen',
      route: 'Frisco Route',
      stop: 'Soccer Academy',
      date: 'Dec 14, 2024',
      timeSlot: 'morning' as const,
      time: '8:00 AM',
      status: 'cancelled' as const
    }
  ]);

  const handleCancel = (id: string) => {
    setBookings(prev => prev.map(booking => 
      booking.id === id ? { ...booking, status: 'cancelled' as const } : booking
    ));
    console.log(`Cancelled booking ${id}`);
  };

  return (
    <div className="p-4 space-y-4">
      {bookings.map(booking => (
        <BookingCard
          key={booking.id}
          {...booking}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}