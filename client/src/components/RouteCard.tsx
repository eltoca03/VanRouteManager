import { MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CapacityMeter from "./CapacityMeter";
import { cn } from "@/lib/utils";

interface Stop {
  id: string;
  name: string;
  morningTime?: string;
  afternoonTime?: string;
  bookedSeats: number;
}

interface RouteCardProps {
  id: string;
  name: string;
  area: string;
  capacity: number;
  stops: Stop[];
  timeSlot: "morning" | "afternoon";
  isDriverActive?: boolean;
  onSelect?: () => void;
  className?: string;
}

export default function RouteCard({ 
  name, 
  area, 
  capacity, 
  stops, 
  timeSlot, 
  isDriverActive = false, 
  onSelect,
  className 
}: RouteCardProps) {
  const totalBooked = stops.reduce((sum, stop) => sum + stop.bookedSeats, 0);
  const availableSeats = capacity - totalBooked;
  
  const getStatusColor = () => {
    if (availableSeats === 0) return "destructive";
    if (availableSeats <= 2) return "secondary";
    return "default";
  };

  return (
    <Card className={cn("hover-elevate cursor-pointer min-h-44", className)} onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isDriverActive && (
              <Badge variant="outline" className="text-success border-success">
                Live
              </Badge>
            )}
            <Badge variant={getStatusColor()}>
              {availableSeats === 0 ? "Full" : `${availableSeats} seats`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">
              {timeSlot} Route
            </span>
          </div>
          <CapacityMeter used={totalBooked} total={capacity} size="sm" />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Stops ({stops.length})
          </h4>
          <div className="space-y-1">
            {/* Show first 2 stops on mobile, all on desktop */}
            {stops.slice(0, 2).map((stop, index) => {
              const time = timeSlot === "morning" ? stop.morningTime : stop.afternoonTime;
              return (
                <div key={stop.id} className="flex items-center justify-between text-sm p-3 rounded bg-muted/50 min-h-11">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      {time && (
                        <div className="text-muted-foreground font-mono text-xs">
                          {time}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {stop.bookedSeats}/{capacity}
                  </div>
                </div>
              );
            })}
            {stops.length > 2 && (
              <div className="text-center py-2">
                <span className="text-xs text-muted-foreground">
                  +{stops.length - 2} more stops
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}