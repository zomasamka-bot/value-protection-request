import { type HookStatus } from "@/lib/core-engine";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

export function HooksMonitor({ hooks }: { hooks: HookStatus[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Monitoring Hooks
        </h3>
      </div>

      <div className="space-y-2">
        {hooks.map((hook) => (
          <div
            key={hook.name}
            className="flex items-center justify-between p-2 bg-muted/30 rounded border border-muted"
          >
            <div className="flex items-center gap-2">
              {hook.status === "active" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : hook.status === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span className="text-xs font-medium text-foreground capitalize">
                {hook.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {hook.status}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Real-time governance monitoring for institutional compliance and audit
        requirements.
      </p>
    </div>
  );
}
