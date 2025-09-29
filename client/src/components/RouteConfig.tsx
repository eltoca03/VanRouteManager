import { useState } from 'react';
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
  morningTime: string | null;
  afternoonTime: string | null;
  order: number;
}

interface Route {
  id: string;
  name: string;
  area: string;
  capacity: number;
}

interface RouteConfigProps {
  routeName: string;
  timeSlot: 'morning' | 'afternoon';
}

export default function RouteConfig({ routeName, timeSlot }: RouteConfigProps) {
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
    morningTime: '',
    afternoonTime: ''
  });
  const [isAddingStop, setIsAddingStop] = useState(false);

  const handleEditStop = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    if (stop) {
      setNewStop({
        name: stop.name,
        address: stop.address,
        morningTime: stop.morningTime || '',
        afternoonTime: stop.afternoonTime || ''
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
      setNewStop({ name: '', address: '', morningTime: '', afternoonTime: '' });
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
      setNewStop({ name: '', address: '', morningTime: '', afternoonTime: '' });
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

  const handleSaveStop = (stopId: string) => {
    if (newStop.name && newStop.address && editingStop) {
      updateStopMutation.mutate({
        stopId: editingStop,
        stopData: {
          name: newStop.name,
          address: newStop.address,
          morningTime: newStop.morningTime || null,
          afternoonTime: newStop.afternoonTime || null
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStop(null);
    setNewStop({ name: '', address: '', morningTime: '', afternoonTime: '' });
  };

  const handleDeleteStop = (stopId: string) => {
    deleteStopMutation.mutate(stopId);
  };

  const handleAddStop = () => {
    if (newStop.name && newStop.address && currentRouteId) {
      createStopMutation.mutate({
        name: newStop.name,
        address: newStop.address,
        morningTime: newStop.morningTime || null,
        afternoonTime: newStop.afternoonTime || null,
        order: stops.length + 1
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Route Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Route Configuration
            <Badge variant="secondary">{timeSlot}</Badge>
          </CardTitle>
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
                <p className="font-medium">{route?.capacity || 14} seats</p>
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
                        value={newStop.morningTime}
                        onChange={(e) => setNewStop(prev => ({ ...prev, morningTime: e.target.value }))}
                        data-testid="input-new-morning-time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-afternoon-time">Afternoon Pickup</Label>
                      <Input
                        id="new-afternoon-time"
                        type="time"
                        value={newStop.afternoonTime}
                        onChange={(e) => setNewStop(prev => ({ ...prev, afternoonTime: e.target.value }))}
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
                        setNewStop({ name: '', address: '', morningTime: '', afternoonTime: '' });
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
                                value={newStop.morningTime}
                                onChange={(e) => setNewStop(prev => ({ ...prev, morningTime: e.target.value }))}
                                data-testid={`input-edit-morning-time-${stop.id}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-afternoon-time-${stop.id}`}>Afternoon Pickup</Label>
                              <Input
                                id={`edit-afternoon-time-${stop.id}`}
                                type="time"
                                value={newStop.afternoonTime}
                                onChange={(e) => setNewStop(prev => ({ ...prev, afternoonTime: e.target.value }))}
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