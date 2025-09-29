import { useState, useEffect } from 'react';
import { Play, Pause, MapPin, Users, Clock, ChevronDown, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CapacityMeter from './CapacityMeter';
import RouteConfig from './RouteConfig';
import RouteMap from './RouteMap';

interface Student {
  id: string;
  name: string;
  stop: string;
  timeSlot: 'morning' | 'afternoon';
  isPickedUp?: boolean;
}

interface DriverDashboardProps {
  routeName: string;
  route: any; // Full route object with capacity info
  students: Student[];
  stopOrderMap?: Record<string, { morningOrder: number; afternoonOrder: number }>;
  onToggleRoute?: (isActive: boolean) => void;
  onToggleStudent?: (studentId: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function DriverDashboard({
  routeName,
  route,
  students,
  stopOrderMap = {},
  onToggleRoute,
  onToggleStudent,
  activeTab = 'manifest',
  onTabChange
}: DriverDashboardProps) {
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [manifest, setManifest] = useState(students);
  const [activeTimeSlot, setActiveTimeSlot] = useState<'morning' | 'afternoon'>('morning');
  const [showRouteConfig, setShowRouteConfig] = useState(false);
  
  // Sync manifest with students prop when it changes (after API fetch)
  useEffect(() => {
    console.log(`DriverDashboard ${routeName}: students prop changed, length=${students.length}`, students);
    setManifest(students);
  }, [students]);
  
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

  // Split students by time slot
  const morningStudents = manifest.filter(s => s.timeSlot === 'morning');
  const afternoonStudents = manifest.filter(s => s.timeSlot === 'afternoon');
  
  const pickedUpCount = manifest.filter(s => s.isPickedUp).length;
  const routeCapacity = route?.capacity || 14; // Use route capacity or default to 14

  // Render students for a specific time slot
  const renderTimeSlotContent = (timeSlot: 'morning' | 'afternoon') => {
    const timeSlotStudents = timeSlot === 'morning' ? morningStudents : afternoonStudents;
    const timeSlotLabel = timeSlot === 'morning' ? 'Morning Pickup' : 'Afternoon Dropoff';
    
    // Group students by stop
    const groupedByStop = timeSlotStudents.reduce((acc, student) => {
      if (!acc[student.stop]) {
        acc[student.stop] = [];
      }
      acc[student.stop].push(student);
      return acc;
    }, {} as Record<string, Student[]>);

    // Sort stops based on time slot (morning: A→B→C, afternoon: C→B→A)
    const sortedStops = Object.entries(groupedByStop).sort(([stopA], [stopB]) => {
      const orderA = stopOrderMap[stopA]?.[timeSlot === 'morning' ? 'morningOrder' : 'afternoonOrder'] || 999;
      const orderB = stopOrderMap[stopB]?.[timeSlot === 'morning' ? 'morningOrder' : 'afternoonOrder'] || 999;
      return orderA - orderB;
    });

    if (sortedStops.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No students scheduled for {timeSlotLabel.toLowerCase()}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{timeSlotLabel}</h3>
          <Badge variant="secondary">
            {timeSlotStudents.length} student{timeSlotStudents.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {sortedStops.map(([stop, students], index) => {
          const pickedUpAtStop = students.filter(s => s.isPickedUp).length;
          const isNextStop = pickedUpAtStop === 0 && index === 0;
          
          return (
            <Collapsible key={`${stop}-${timeSlot}`} defaultOpen={isNextStop}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover-elevate">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                          isNextStop 
                            ? 'bg-primary text-primary-foreground' 
                            : pickedUpAtStop === students.length 
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <CardTitle className="text-base">{stop}</CardTitle>
                          {isNextStop && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Next Stop
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {pickedUpAtStop}/{students.length}
                        </Badge>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {students.map(student => (
                        <div 
                          key={student.id}
                          className="flex items-center justify-between p-4 rounded border hover-elevate cursor-pointer min-h-16"
                          onClick={() => handleToggleStudent(student.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              student.isPickedUp 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-muted-foreground'
                            }`}>
                              {student.isPickedUp && '✓'}
                            </div>
                            <span className={`font-medium ${
                              student.isPickedUp ? 'line-through text-muted-foreground' : ''
                            }`}>
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
                            className="min-h-11 min-w-20"
                          >
                            {student.isPickedUp ? 'Undo' : 'Pick Up'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    if (showRouteConfig) {
      return (
        <RouteConfig 
          routeName={routeName}
          routeId={route.id}
          onClose={() => setShowRouteConfig(false)}
        />
      );
    }
    
    switch (activeTab) {
      case 'map':
        return (
          <RouteMap 
            routeName={routeName}
            timeSlot={activeTimeSlot}
            students={manifest}
          />
        );
      case 'manifest':
      default:
        return (
          <Tabs value={activeTimeSlot} onValueChange={(value) => setActiveTimeSlot(value as 'morning' | 'afternoon')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="morning" data-testid="tab-morning">
                Morning Pickup ({morningStudents.length})
              </TabsTrigger>
              <TabsTrigger value="afternoon" data-testid="tab-afternoon">
                Afternoon Dropoff ({afternoonStudents.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="morning" className="mt-4">
              {renderTimeSlotContent('morning')}
            </TabsContent>
            <TabsContent value="afternoon" className="mt-4">
              {renderTimeSlotContent('afternoon')}
            </TabsContent>
          </Tabs>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Sticky Route Control Card */}
      <Card className="sticky top-4 z-10 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" />
              {routeName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRouteConfig(true)}
                data-testid={`button-edit-route-${route.id}`}
                className="min-h-9"
              >
                <Settings className="w-4 h-4 mr-1" />
                Edit Route
              </Button>
              <Switch
                checked={isRouteActive}
                onCheckedChange={handleToggleRoute}
                data-testid="switch-route-active"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <CapacityMeter used={manifest.length} total={routeCapacity} size="sm" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{pickedUpCount}/{manifest.length} picked up</span>
              {isRouteActive && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}