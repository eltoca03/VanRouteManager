import RouteCard from '../RouteCard';

export default function RouteCardExample() {
  const mockStops = [
    {
      id: "1",
      name: "Main Street Plaza",
      morningTime: "7:30 AM",
      afternoonTime: "3:30 PM",
      bookedSeats: 4
    },
    {
      id: "2", 
      name: "Community Center",
      morningTime: "7:45 AM",
      afternoonTime: "3:45 PM",
      bookedSeats: 3
    },
    {
      id: "3",
      name: "Soccer Academy",
      morningTime: "8:00 AM",
      afternoonTime: "4:00 PM",
      bookedSeats: 2
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <RouteCard
        id="frisco-1"
        name="Frisco Route"
        area="frisco"
        capacity={14}
        stops={mockStops}
        timeSlot="morning"
        isDriverActive={true}
        onSelect={() => console.log('Frisco route selected')}
      />
      <RouteCard
        id="dallas-1"
        name="Dallas Route"
        area="dallas"
        capacity={14}
        stops={mockStops.map(stop => ({ ...stop, bookedSeats: stop.bookedSeats + 3 }))}
        timeSlot="afternoon"
        isDriverActive={false}
        onSelect={() => console.log('Dallas route selected')}
      />
    </div>
  );
}