import { Badge } from "@/components/ui/badge";
import { Globe, ShieldCheck } from "lucide-react";

interface DomainBadgeProps {
  domain: string;
  size?: "sm" | "md" | "lg";
  showVerified?: boolean;
}

export function DomainBadge({ domain, size = "md", showVerified = false }: DomainBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge 
      variant="outline" 
      className={`bg-primary/10 border-primary/40 text-primary font-mono font-bold tracking-wide ${sizeClasses[size]} hover:bg-primary/20 transition-colors`}
    >
      <Globe className={`${iconSize[size]} mr-1.5 flex-shrink-0`} />
      {domain}
      {showVerified && (
        <ShieldCheck className={`${iconSize[size]} ml-1.5 flex-shrink-0 text-emerald-600`} />
      )}
    </Badge>
  );
}
