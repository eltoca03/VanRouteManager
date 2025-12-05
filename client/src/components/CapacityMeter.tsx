import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapacityMeterProps {
  used: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function CapacityMeter({ used, total, size = "md", showLabel = true }: CapacityMeterProps) {
  // Ensure values are valid numbers
  const safeUsed = Number(used) || 0;
  const safeTotal = Number(total) || 1; // Prevent division by zero
  const percentage = (safeUsed / safeTotal) * 100;
  const getStatusColor = () => {
    if (percentage >= 100) return "text-destructive";
    if (percentage >= 80) return "text-warning";
    return "text-success";
  };

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // On mobile, limit circles to prevent overflow
  const maxVisibleCircles = 8;
  const showAllCircles = safeTotal <= maxVisibleCircles;
  const circlesToShow = showAllCircles ? safeTotal : maxVisibleCircles;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
        {Array.from({ length: circlesToShow }, (_, i) => {
          // For limited display, show proportion
          const isFilledInLimited = showAllCircles 
            ? i < safeUsed 
            : i < Math.ceil((safeUsed / safeTotal) * circlesToShow);
            
          return (
            <Circle
              key={i}
              className={cn(
                sizeClasses[size],
                isFilledInLimited ? "fill-current" : "stroke-current fill-transparent",
                getStatusColor()
              )}
            />
          );
        })}
        {!showAllCircles && (
          <span className={cn("text-xs text-muted-foreground", textSizeClasses[size])}>
            ...
          </span>
        )}
      </div>
      {showLabel && (
        <span className={cn("font-mono font-medium", textSizeClasses[size], getStatusColor())}>
          {safeUsed}/{safeTotal}
        </span>
      )}
    </div>
  );
}