import DriverDashboard from '../DriverDashboard';

export default function DriverDashboardExample() {
  const mockStudents = [
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

  return (
    <div className="p-4">
      <DriverDashboard
        routeName="Frisco Route"
        timeSlot="morning"
        students={mockStudents}
        onToggleRoute={(isActive) => console.log('Route toggled:', isActive)}
        onToggleStudent={(studentId) => console.log('Student toggled:', studentId)}
      />
    </div>
  );
}