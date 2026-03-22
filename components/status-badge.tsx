import { CoreEngine, type RequestStatus } from "@/lib/core-engine";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide",
        CoreEngine.getStatusColor(status),
        className
      )}
    >
      {CoreEngine.getStatusLabel(status)}
    </span>
  );
}
