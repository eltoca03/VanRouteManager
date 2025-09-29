import { useState } from 'react';
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CapacityMeter from './CapacityMeter';

interface Student {
  id: string;
  name: string;
}

interface Stop {
  id: string;
  name: string;
  availableSeats: number;
  time: string;
}

interface Route {
  id: string;
  name: string;
  area: string;
  stops: Stop[];
}

interface BookingFormProps {
  students: Student[];
  routes: Route[];
  selectedDate: string;
  onSubmit?: (booking: {
    studentId: string;
    routeId: string;
    stopId: string;
    date: string;
    timeSlot: string;
  }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function BookingForm({
  students,
  routes,
  selectedDate,
  onSubmit,
  onCancel,
  isSubmitting = false
}: BookingFormProps) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStop, setSelectedStop] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon'>('morning');
  
  const selectedRouteData = routes.find(r => r.id === selectedRoute);
  const selectedStopData = selectedRouteData?.stops.find(s => s.id === selectedStop);
  
  const handleSubmit = () => {
    if (selectedStudent && selectedRoute && selectedStop && onSubmit) {
      onSubmit({
        studentId: selectedStudent,
        routeId: selectedRoute,
        stopId: selectedStop,
        date: selectedDate,
        timeSlot: selectedTimeSlot
      });
      // Reset form
      setSelectedStudent('');
      setSelectedRoute('');
      setSelectedStop('');
      setSelectedTimeSlot('morning');
    }
  };
  
  const isFormValid = selectedStudent && selectedRoute && selectedStop;
  const hasAvailableSeats = selectedStopData?.availableSeats || 0 > 0;
  const canSubmit = isFormValid && hasAvailableSeats && !isSubmitting;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Book Transportation
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {selectedDate}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger data-testid="select-student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Slot</label>
            <Select value={selectedTimeSlot} onValueChange={(value: 'morning' | 'afternoon') => setSelectedTimeSlot(value)}>
              <SelectTrigger data-testid="select-timeslot">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Route</label>
          <Select value={selectedRoute} onValueChange={(value) => {
            setSelectedRoute(value);
            setSelectedStop(''); // Reset stop when route changes
          }}>
            <SelectTrigger data-testid="select-route">
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              {routes.map(route => (
                <SelectItem key={route.id} value={route.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {route.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedRouteData && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Stop</label>
            <div className="space-y-2">
              {selectedRouteData.stops.map(stop => {
                const time = selectedTimeSlot === 'morning' ? stop.time : stop.time; // In real app, this would be different times
                return (
                  <div
                    key={stop.id}
                    className={`p-3 rounded border cursor-pointer hover-elevate ${
                      selectedStop === stop.id ? 'border-primary bg-primary/5' : ''
                    } ${
                      stop.availableSeats === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => stop.availableSeats > 0 && setSelectedStop(stop.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stop.name}</span>
                        {selectedStop === stop.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {time}
                        </div>
                        <CapacityMeter 
                          used={14 - stop.availableSeats} 
                          total={14} 
                          size="sm" 
                          showLabel={false}
                        />
                        <span className="text-xs text-muted-foreground">
                          {stop.availableSeats} seats
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {selectedStopData && !hasAvailableSeats && (
          <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              This stop is fully booked for {selectedTimeSlot}. Please select a different stop or time.
            </p>
          </div>
        )}
        
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="button-submit-booking"
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Booking...
              </>
            ) : (
              'Book Transportation'
            )}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-booking"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}