import { Badge } from "@/components/ui/badge";
import { Beaker } from "lucide-react";

export function TestnetIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="outline" 
        className="bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-700 dark:text-amber-300 shadow-lg"
      >
        <Beaker className="h-3 w-3 mr-1.5" />
        Testnet Mode
      </Badge>
    </div>
  );
}
