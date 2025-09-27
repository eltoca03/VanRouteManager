import BookingForm from '../BookingForm';

export default function BookingFormExample() {
  const mockStudents = [
    { id: '1', name: 'Alex Johnson' },
    { id: '2', name: 'Emma Davis' },
    { id: '3', name: 'Michael Chen' }
  ];

  const mockRoutes = [
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
        },
        {
          id: 'stop3',
          name: 'Soccer Academy',
          availableSeats: 0,
          time: '8:00 AM'
        }
      ]
    },
    {
      id: 'dallas',
      name: 'Dallas Route',
      area: 'dallas',
      stops: [
        {
          id: 'stop4',
          name: 'Downtown Center',
          availableSeats: 5,
          time: '7:30 AM'
        },
        {
          id: 'stop5',
          name: 'Park Plaza',
          availableSeats: 12,
          time: '7:45 AM'
        }
      ]
    }
  ];

  return (
    <div className="p-4">
      <BookingForm
        students={mockStudents}
        routes={mockRoutes}
        selectedDate="December 15, 2024"
        onSubmit={(booking) => console.log('Booking submitted:', booking)}
        onCancel={() => console.log('Booking cancelled')}
      />
    </div>
  );
}