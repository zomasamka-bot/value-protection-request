import { type RequestStatus } from "@/lib/core-engine";
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StateMachineDisplay({
  currentStatus,
}: {
  currentStatus: RequestStatus;
}) {
  const states: { status: RequestStatus; label: string }[] = [
    { status: "draft", label: "Draft" },
    { status: "pending_approval", label: "Pending" },
    { status: "approved", label: "Approved" },
  ];

  const getStateIndex = (status: RequestStatus) => {
    if (status === "rejected") return -1;
    return states.findIndex((s) => s.status === status);
  };

  const currentIndex = getStateIndex(currentStatus);
  const isRejected = currentStatus === "rejected";

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-2">State Machine:</p>
      
      {isRejected ? (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Request Rejected</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {states.map((state, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={state.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "rounded-full p-1",
                      isActive &&
                        "bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isCompleted && "bg-emerald-100 dark:bg-emerald-950",
                      !isActive && !isCompleted && "bg-muted"
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-emerald-600",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {state.label}
                  </span>
                </div>
                {index < states.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-1",
                      isCompleted ? "bg-emerald-600" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
