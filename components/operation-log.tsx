"use client";

import { type OperationLogEntry } from "@/lib/core-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";

interface OperationLogProps {
  logs: OperationLogEntry[];
}

export function OperationLog({ logs }: OperationLogProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Operation Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground capitalize">
                  {log.action.replace(/_/g, " ")}
                </span>
                <StatusBadge status={log.status} />
              </div>
              <p className="text-xs text-muted-foreground">{log.details}</p>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
