import { useState } from 'react';
import { Play, Pause, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import CapacityMeter from './CapacityMeter';

interface Student {
  id: string;
  name: string;
  stop: string;
  isPickedUp?: boolean;
}

interface DriverDashboardProps {
  routeName: string;
  timeSlot: 'morning' | 'afternoon';
  students: Student[];
  onToggleRoute?: (isActive: boolean) => void;
  onToggleStudent?: (studentId: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function DriverDashboard({
  routeName,
  timeSlot,
  students,
  onToggleRoute,
  onToggleStudent,
  activeTab = 'manifest',
  onTabChange
}: DriverDashboardProps) {
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [manifest, setManifest] = useState(students);
  
  const handleToggleRoute = () => {
    const newState = !isRouteActive;
    setIsRouteActive(newState);
    if (onToggleRoute) {
      onToggleRoute(newState);
    }
    console.log(`Route ${newState ? 'activated' : 'deactivated'}`);
  };
  
  const handleToggleStudent = (studentId: string) => {
    setManifest(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, isPickedUp: !student.isPickedUp }
        : student
    ));
    if (onToggleStudent) {
      onToggleStudent(studentId);
    }
    console.log(`Student ${studentId} toggled`);
  };
  
  const pickedUpCount = manifest.filter(s => s.isPickedUp).length;
  const groupedByStop = manifest.reduce((acc, student) => {
    if (!acc[student.stop]) {
      acc[student.stop] = [];
    }
    acc[student.stop].push(student);
    return acc;
  }, {} as Record<string, Student[]>);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {routeName} - {timeSlot}
            </CardTitle>
            <div className="flex items-center gap-4">
              <CapacityMeter used={pickedUpCount} total={manifest.length} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Route Active</span>
                <Switch
                  checked={isRouteActive}
                  onCheckedChange={handleToggleRoute}
                  data-testid="switch-route-active"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {manifest.length} students
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {pickedUpCount}/{manifest.length} picked up
            </div>
            {isRouteActive && (
              <Badge variant="outline" className="text-success border-success">
                <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                Live Tracking
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {Object.entries(groupedByStop).map(([stop, students], index) => (
          <Card key={stop}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-mono">
                  {index + 1}
                </span>
                <CardTitle className="text-base">{stop}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {students.filter(s => s.isPickedUp).length}/{students.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map(student => (
                  <div 
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded border hover-elevate cursor-pointer"
                    onClick={() => handleToggleStudent(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        student.isPickedUp 
                          ? 'bg-success border-success text-white' 
                          : 'border-muted-foreground'
                      }`}>
                        {student.isPickedUp && '✓'}
                      </div>
                      <span className={student.isPickedUp ? 'line-through text-muted-foreground' : ''}>
                        {student.name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={student.isPickedUp ? 'secondary' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStudent(student.id);
                      }}
                      data-testid={`button-toggle-student-${student.id}`}
                    >
                      {student.isPickedUp ? 'Undo' : 'Pick Up'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}