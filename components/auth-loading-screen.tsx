"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import { Shield, Wallet, Loader2, AlertTriangle, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = {
  label: string;
  description: string;
};

const STEPS: Step[] = [
  { label: "Loading Pi SDK",       description: "Fetching the Pi Network SDK from minepi.com" },
  { label: "Initializing Network", description: "Connecting to Pi Network on stable.pi" },
  { label: "Authenticating",       description: "Verifying your Pi identity and scopes" },
  { label: "Connecting Wallet",    description: "Establishing wallet session — check Pi Browser" },
];

function resolveStepIndex(message: string): number {
  const m = message.toLowerCase();
  if (m.includes("sdk"))         return 0;
  if (m.includes("initializing")) return 1;
  if (m.includes("authenticat") || m.includes("logging")) return 2;
  return 3;
}

export function AuthLoadingScreen() {
  const { authMessage, hasError, reinitialize } = usePiAuth();

  const activeStep = hasError ? -1 : resolveStepIndex(authMessage);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      {/* App Identity */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Value Protection Request
        </h1>
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
          <Globe className="h-3 w-3" />
          stable.pi
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className={`p-2 rounded-lg ${hasError ? "bg-destructive/10" : "bg-primary/10"}`}>
            <Wallet className={`h-5 w-5 ${hasError ? "text-destructive" : "text-primary"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Pi Wallet Connection</p>
            <p className="text-xs text-muted-foreground">Authorization session only</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="space-y-3 mb-6">
          {STEPS.map((step, index) => {
            const isDone    = !hasError && index < activeStep;
            const isActive  = !hasError && index === activeStep;
            const isError   = hasError && index === activeStep;
            const isPending = !hasError && index > activeStep;

            return (
              <div key={step.label} className="flex items-start gap-3">
                {/* Icon column */}
                <div className="flex-shrink-0 mt-0.5">
                  {isDone && (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {isActive && (
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    </div>
                  )}
                  {isError && (
                    <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    </div>
                  )}
                  {isPending && (
                    <div className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                </div>

                {/* Text column */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${
                    isDone    ? "text-emerald-600 dark:text-emerald-400" :
                    isActive  ? "text-foreground" :
                    isError   ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {isError && (
                    <p className="text-xs text-destructive mt-0.5 leading-relaxed">
                      {authMessage}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status bar */}
        {!hasError && (
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
            <p className="text-xs text-muted-foreground font-mono truncate">
              {authMessage}
            </p>
          </div>
        )}

        {/* Retry on error */}
        {hasError && (
          <Button
            onClick={reinitialize}
            className="w-full mt-2"
            size="sm"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Retry Connection
          </Button>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
        Open this app inside the Pi Browser. The wallet session is authorization-only — no funds are moved.
      </p>
    </div>
  );
}
