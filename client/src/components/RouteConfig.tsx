import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, MapPin, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Stop {
  id: string;
  routeId: string;
  name: string;
  address: string;
  morningOrder: number;
  afternoonOrder: number;
  morningPickupTime: string | null;
  afternoonDropoffTime: string | null;
  fridayMorningPickupTime: string | null;
  fridayAfternoonDropoffTime: string | null;
  earlyReleaseMorningPickupTime: string | null;
  earlyReleaseAfternoonDropoffTime: string | null;
}

interface Route {
  id: string;
  name: string;
  area: string;
  capacity: number;
}

interface RouteConfigProps {
  routeName: string;
}

export default function RouteConfig({ routeName }: RouteConfigProps) {
  const { toast } = useToast();
  
  // Get driver's assigned routes to find the current route ID
  const { data: assignments, error: assignmentsError } = useQuery({
    queryKey: ['/api/driver/assignments'],
    enabled: true
  });
  
  const currentRouteId = (assignments as any)?.assignments?.[0]?.routeId;
  
  // Get route details
  const { data: routeData, error: routeError } = useQuery({
    queryKey: ['/api/routes', currentRouteId],
    enabled: !!currentRouteId
  });
  
  // Get stops for the current route
  const { data: stopsData, isLoading, error: stopsError } = useQuery({
    queryKey: ['/api/driver/routes', currentRouteId, 'stops'],
    enabled: !!currentRouteId
  });
  
  const route = (routeData as any)?.route;
  const stops = (stopsData as any)?.stops || [];
  
  // Debug logging for authentication issues
  if (assignmentsError) {
    console.error('Assignments error:', assignmentsError);
  }
  if (routeError) {
    console.error('Route error:', routeError);
  }
  if (stopsError) {
    console.error('Stops error:', stopsError);
  }

  const [editingStop, setEditingStop] = useState<string | null>(null);
  const [newStop, setNewStop] = useState({
    name: '',
    address: '',
    // Regular times
    morningPickupTime: '',
    afternoonDropoffTime: '',
    // Friday times
    fridayMorningPickupTime: '',
    fridayAfternoonDropoffTime: '',
    // Early release times
    earlyReleaseMorningPickupTime: '',
    earlyReleaseAfternoonDropoffTime: ''
  });
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [routeCapacity, setRouteCapacity] = useState(route?.capacity || 14);

  // Update routeCapacity when route data loads
  useEffect(() => {
    if (route?.capacity) {
      setRouteCapacity(route.capacity);
    }
  }, [route?.capacity]);

  const handleEditStop = (stopId: string) => {
    const stop = stops.find((s: Stop) => s.id === stopId);
    if (stop) {
      setNewStop({
        name: stop.name,
        address: stop.address,
        // Regular times
        morningPickupTime: stop.morningPickupTime || '',
        afternoonDropoffTime: stop.afternoonDropoffTime || '',
        // Friday times
        fridayMorningPickupTime: stop.fridayMorningPickupTime || '',
        fridayAfternoonDropoffTime: stop.fridayAfternoonDropoffTime || '',
        // Early release times
        earlyReleaseMorningPickupTime: stop.earlyReleaseMorningPickupTime || '',
        earlyReleaseAfternoonDropoffTime: stop.earlyReleaseAfternoonDropoffTime || ''
      });
      setEditingStop(stopId);
      setIsAddingStop(false);
    }
  };

  // Mutations for stop management
  const createStopMutation = useMutation({
    mutationFn: async (stopData: any) => {
      return apiRequest(`/api/driver/routes/${currentRouteId}/stops`, {
        method: 'POST',
        body: stopData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/routes', currentRouteId, 'stops'] });
      toast({ title: 'Stop created successfully' });
      setNewStop({ 
        name: '', 
        address: '', 
        morningPickupTime: '', 
        afternoonDropoffTime: '',
        fridayMorningPickupTime: '',
        fridayAfternoonDropoffTime: '',
        earlyReleaseMorningPickupTime: '',
        earlyReleaseAfternoonDropoffTime: ''
      });
      setIsAddingStop(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create stop', description: error.message, variant: 'destructive' });
    }
  });
  
  const updateStopMutation = useMutation({
    mutationFn: async ({ stopId, stopData }: { stopId: string; stopData: any }) => {
      return apiRequest(`/api/driver/stops/${stopId}`, {
        method: 'PUT',
        body: stopData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/routes', currentRouteId, 'stops'] });
      toast({ title: 'Stop updated successfully' });
      setNewStop({ 
        name: '', 
        address: '', 
        morningPickupTime: '', 
        afternoonDropoffTime: '',
        fridayMorningPickupTime: '',
        fridayAfternoonDropoffTime: '',
        earlyReleaseMorningPickupTime: '',
        earlyReleaseAfternoonDropoffTime: ''
      });
      setEditingStop(null);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update stop', description: error.message, variant: 'destructive' });
    }
  });

  const deleteStopMutation = useMutation({
    mutationFn: async (stopId: string) => {
      return apiRequest(`/api/driver/stops/${stopId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/routes', currentRouteId, 'stops'] });
      toast({ title: 'Stop deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete stop', description: error.message, variant: 'destructive' });
    }
  });

  const updateRouteMutation = useMutation({
    mutationFn: async (routeData: { capacity: number }) => {
      return apiRequest(`/api/routes/${currentRouteId}`, {
        method: 'PUT',
        body: routeData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes', currentRouteId] });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({ title: 'Route updated successfully' });
      setIsEditingRoute(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update route', description: error.message, variant: 'destructive' });
    }
  });

  const handleSaveStop = (stopId: string) => {
    if (newStop.name && newStop.address && editingStop) {
      updateStopMutation.mutate({
        stopId: editingStop,
        stopData: {
          name: newStop.name,
          address: newStop.address,
          // Regular times
          morningPickupTime: newStop.morningPickupTime || null,
          afternoonDropoffTime: newStop.afternoonDropoffTime || null,
          // Friday times
          fridayMorningPickupTime: newStop.fridayMorningPickupTime || null,
          fridayAfternoonDropoffTime: newStop.fridayAfternoonDropoffTime || null,
          // Early release times
          earlyReleaseMorningPickupTime: newStop.earlyReleaseMorningPickupTime || null,
          earlyReleaseAfternoonDropoffTime: newStop.earlyReleaseAfternoonDropoffTime || null
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStop(null);
    setNewStop({ 
      name: '', 
      address: '', 
      morningPickupTime: '', 
      afternoonDropoffTime: '',
      fridayMorningPickupTime: '',
      fridayAfternoonDropoffTime: '',
      earlyReleaseMorningPickupTime: '',
      earlyReleaseAfternoonDropoffTime: ''
    });
  };

  const handleDeleteStop = (stopId: string) => {
    deleteStopMutation.mutate(stopId);
  };

  const handleAddStop = () => {
    if (newStop.name && newStop.address && currentRouteId) {
      // Calculate next orders: morning in ascending order (1,2,3...), afternoon in descending order (3,2,1...)
      const nextMorningOrder = Math.max(...stops.map((s: Stop) => s.morningOrder), 0) + 1;
      const nextAfternoonOrder = nextMorningOrder; // For simplicity, reverse the order later
      
      createStopMutation.mutate({
        name: newStop.name,
        address: newStop.address,
        morningOrder: nextMorningOrder,
        afternoonOrder: nextAfternoonOrder,
        // Regular times
        morningPickupTime: newStop.morningPickupTime || null,
        afternoonDropoffTime: newStop.afternoonDropoffTime || null,
        // Friday times
        fridayMorningPickupTime: newStop.fridayMorningPickupTime || null,
        fridayAfternoonDropoffTime: newStop.fridayAfternoonDropoffTime || null,
        // Early release times
        earlyReleaseMorningPickupTime: newStop.earlyReleaseMorningPickupTime || null,
        earlyReleaseAfternoonDropoffTime: newStop.earlyReleaseAfternoonDropoffTime || null
      });
    }
  };

  const handleSaveRoute = () => {
    if (routeCapacity >= 1 && routeCapacity <= 50) { // Reasonable limits
      updateRouteMutation.mutate({ capacity: routeCapacity });
    }
  };

  const handleCancelRouteEdit = () => {
    setRouteCapacity(route?.capacity || 14);
    setIsEditingRoute(false);
  };

  return (
    <div className="space-y-4">
      {/* Route Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Route Configuration
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingRoute(true)}
              disabled={isEditingRoute}
              data-testid="button-edit-route"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Route
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading route information...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Route Name</Label>
                <p className="font-medium">{route?.name || routeName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Van Capacity</Label>
                {isEditingRoute ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={routeCapacity}
                      onChange={(e) => setRouteCapacity(parseInt(e.target.value) || 14)}
                      min="1"
                      max="50"
                      className="w-20"
                      data-testid="input-route-capacity"
                    />
                    <span className="text-sm text-muted-foreground">seats</span>
                    <Button
                      size="sm"
                      onClick={handleSaveRoute}
                      disabled={updateRouteMutation.isPending}
                      data-testid="button-save-route"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelRouteEdit}
                      disabled={updateRouteMutation.isPending}
                      data-testid="button-cancel-route-edit"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="font-medium">{routeCapacity} seats</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Total Stops</Label>
                <p className="font-medium">{stops.length}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stops Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Route Stops</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddingStop(true)}
              disabled={isAddingStop}
              data-testid="button-add-stop"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Stop
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Stop Form */}
          {isAddingStop && (
            <Card className="border-2 border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="new-stop-name">Stop Name</Label>
                      <Input
                        id="new-stop-name"
                        placeholder="e.g., Main Street Plaza"
                        value={newStop.name}
                        onChange={(e) => setNewStop(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="input-new-stop-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-stop-address">Address</Label>
                      <Input
                        id="new-stop-address"
                        placeholder="e.g., 123 Main St, Frisco, TX"
                        value={newStop.address}
                        onChange={(e) => setNewStop(prev => ({ ...prev, address: e.target.value }))}
                        data-testid="input-new-stop-address"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="new-morning-time">Morning Pickup</Label>
                      <Input
                        id="new-morning-time"
                        type="time"
                        value={newStop.morningPickupTime}
                        onChange={(e) => setNewStop(prev => ({ ...prev, morningPickupTime: e.target.value }))}
                        data-testid="input-new-morning-time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-afternoon-time">Afternoon Dropoff</Label>
                      <Input
                        id="new-afternoon-time"
                        type="time"
                        value={newStop.afternoonDropoffTime}
                        onChange={(e) => setNewStop(prev => ({ ...prev, afternoonDropoffTime: e.target.value }))}
                        data-testid="input-new-afternoon-time"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleAddStop}
                      disabled={!newStop.name || !newStop.address}
                      data-testid="button-save-new-stop"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Stop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingStop(false);
                        setNewStop({ 
                          name: '', 
                          address: '', 
                          morningPickupTime: '', 
                          afternoonDropoffTime: '',
                          fridayMorningPickupTime: '',
                          fridayAfternoonDropoffTime: '',
                          earlyReleaseMorningPickupTime: '',
                          earlyReleaseAfternoonDropoffTime: ''
                        });
                      }}
                      data-testid="button-cancel-new-stop"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Stops */}
          <div className="space-y-3">
            {stops.map((stop: any, index: number) => (
              <Card key={stop.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-mono">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      {editingStop === stop.id ? (
                        // Edit Form
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`edit-stop-name-${stop.id}`}>Stop Name</Label>
                              <Input
                                id={`edit-stop-name-${stop.id}`}
                                value={newStop.name}
                                onChange={(e) => setNewStop(prev => ({ ...prev, name: e.target.value }))}
                                data-testid={`input-edit-stop-name-${stop.id}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-stop-address-${stop.id}`}>Address</Label>
                              <Input
                                id={`edit-stop-address-${stop.id}`}
                                value={newStop.address}
                                onChange={(e) => setNewStop(prev => ({ ...prev, address: e.target.value }))}
                                data-testid={`input-edit-stop-address-${stop.id}`}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`edit-morning-time-${stop.id}`}>Morning Pickup</Label>
                              <Input
                                id={`edit-morning-time-${stop.id}`}
                                type="time"
                                value={newStop.morningPickupTime}
                                onChange={(e) => setNewStop(prev => ({ ...prev, morningPickupTime: e.target.value }))}
                                data-testid={`input-edit-morning-time-${stop.id}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-afternoon-time-${stop.id}`}>Afternoon Dropoff</Label>
                              <Input
                                id={`edit-afternoon-time-${stop.id}`}
                                type="time"
                                value={newStop.afternoonDropoffTime}
                                onChange={(e) => setNewStop(prev => ({ ...prev, afternoonDropoffTime: e.target.value }))}
                                data-testid={`input-edit-afternoon-time-${stop.id}`}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveStop(stop.id)}
                              disabled={!newStop.name || !newStop.address}
                              data-testid={`button-save-edit-stop-${stop.id}`}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              data-testid={`button-cancel-edit-stop-${stop.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{stop.name}</h4>
                              <p className="text-sm text-muted-foreground">{stop.address}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStop(stop.id)}
                                data-testid={`button-edit-stop-${stop.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteStop(stop.id)}
                                data-testid={`button-delete-stop-${stop.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Morning:</span>
                              <Badge variant="outline" className="text-xs">
                                {stop.morningTime || 'Not set'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Afternoon:</span>
                              <Badge variant="outline" className="text-xs">
                                {stop.afternoonTime || 'Not set'}
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stops.length === 0 && !isAddingStop && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No stops configured yet</p>
              <p className="text-sm">Add your first stop to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}