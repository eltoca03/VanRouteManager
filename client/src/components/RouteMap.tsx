import { MapPin, Navigation, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface Student {
  id: string;
  name: string;
  stop: string;
  isPickedUp?: boolean;
}

interface RouteMapProps {
  routeName: string;
  timeSlot: 'morning' | 'afternoon';
  students: Student[];
}

interface Stop {
  id: string;
  name: string;
  address: string;
  time: string;
  students: Student[];
  coordinates?: { lat: number; lng: number };
}

export default function RouteMap({ routeName, timeSlot, students }: RouteMapProps) {
  // Fetch routes data to get stops information
  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['/api/routes']
  });

  const routes = (routesData as any)?.routes || [];
  
  // Find the current route by name
  const currentRoute = routes.find((route: any) => 
    routeName.includes(route.name)
  );
  
  // Transform backend stops data for map display
  const stops: Stop[] = (currentRoute?.stops || []).map((stop: any) => ({
    id: stop.id,
    name: stop.name,
    address: stop.address || 'Address not available',
    time: timeSlot === 'morning' ? stop.morningTime : stop.afternoonTime,
    students: students.filter(s => s.stop === stop.name),
    coordinates: { lat: 33.1507, lng: -96.8236 } // Default coordinates - would be dynamic in production
  }));

  if (routesLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading route map...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStudents = students.length;
  const pickedUpStudents = students.filter(s => s.isPickedUp).length;

  const handleGetDirections = (address: string) => {
    // Open in Google Maps for directions
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Route Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Route Map & Navigation
            <Badge variant="secondary">{timeSlot}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Route:</span>
              <p className="font-medium">{routeName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Students:</span>
              <p className="font-medium">{pickedUpStudents}/{totalStudents} picked up</p>
            </div>
            <div>
              <span className="text-muted-foreground">Stops:</span>
              <p className="font-medium">{stops.length} locations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interactive Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Interactive Map</p>
              <p className="text-sm">Map integration will show live route visualization</p>
              <p className="text-xs mt-2">GPS tracking and turn-by-turn navigation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stops List with Navigation */}
      <div className="space-y-3">
        {stops.map((stop, index) => {
          const pickedUpAtStop = stop.students.filter(s => s.isPickedUp).length;
          const isCompleted = pickedUpAtStop === stop.students.length && stop.students.length > 0;
          const isNext = pickedUpAtStop === 0 && stop.students.length > 0 && index === 0;
          
          return (
            <Card key={stop.id} className={`relative ${isNext ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isNext 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{stop.name}</h4>
                          {isNext && (
                            <Badge variant="outline" className="text-xs">
                              Next Stop
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{stop.address}</p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGetDirections(stop.address)}
                        data-testid={`button-directions-${stop.id}`}
                        className="min-w-24"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Navigate
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{stop.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{pickedUpAtStop}/{stop.students.length} students</span>
                      </div>
                    </div>
                    
                    {/* Students at this stop */}
                    {stop.students.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex flex-wrap gap-1">
                          {stop.students.map(student => (
                            <Badge
                              key={student.id}
                              variant={student.isPickedUp ? "default" : "secondary"}
                              className={`text-xs ${
                                student.isPickedUp 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : ''
                              }`}
                            >
                              {student.name}
                              {student.isPickedUp && ' ✓'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Route Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Estimated route time: ~30 minutes</p>
            <p>Total distance: ~12 miles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}