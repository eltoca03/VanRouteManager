import { Calendar, Clock, MapPin, User, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  id: string;
  studentName: string;
  route: string;
  stop: string;
  date: string;
  timeSlot: "morning" | "afternoon";
  time: string;
  status: "confirmed" | "cancelled";
  canCancel?: boolean;
  onCancel?: (id: string) => void;
  className?: string;
}

export default function BookingCard({
  id,
  studentName,
  route,
  stop,
  date,
  timeSlot,
  time,
  status,
  canCancel = true,
  onCancel,
  className
}: BookingCardProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel(id);
    }
  };

  return (
    <Card className={cn(
      "relative",
      status === "cancelled" && "opacity-60",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={status === "confirmed" ? "default" : "secondary"}
              className={status === "cancelled" ? "text-muted-foreground" : ""}
            >
              {status === "confirmed" ? "Confirmed" : "Cancelled"}
            </Badge>
            {canCancel && status === "confirmed" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                data-testid={`button-cancel-${id}`}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{route}</div>
              <div className="text-muted-foreground text-xs">{stop}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground text-xs capitalize">{timeSlot}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm pt-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">{time}</span>
        </div>
      </CardContent>
    </Card>
  );
}