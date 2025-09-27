import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapacityMeterProps {
  used: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function CapacityMeter({ used, total, size = "md", showLabel = true }: CapacityMeterProps) {
  const percentage = (used / total) * 100;
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

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <Circle
            key={i}
            className={cn(
              sizeClasses[size],
              i < used ? "fill-current" : "stroke-current fill-transparent",
              getStatusColor()
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("font-mono font-medium", textSizeClasses[size], getStatusColor())}>
          {used}/{total}
        </span>
      )}
    </div>
  );
}