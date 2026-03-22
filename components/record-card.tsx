"use client";

import { type ActionRecord } from "@/lib/core-engine";
import { StatusBadge } from "./status-badge";
import { FileText, ChevronRight } from "lucide-react";

const POLICY_LABELS: Record<string, string> = {
  freeze:     "Freeze",
  limit:      "Limit",
  escrow:     "Escrow",
  governance: "Governance",
};

interface RecordCardProps {
  record: ActionRecord;
  onClick?: () => void;
}

export function RecordCard({ record, onClick }: RecordCardProps) {
  const policy = POLICY_LABELS[record.formData?.policyType] ?? record.formData?.policyType ?? "—";
  const amount = record.formData?.amount ? `${record.formData.amount} Pi` : null;
  const label  = record.formData?.label  || null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-accent/50 active:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row: ref ID + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-mono font-semibold text-foreground truncate">
            {record.referenceId}
          </span>
        </div>
        <StatusBadge status={record.status} />
      </div>

      {/* Key fields row */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="inline-flex items-center text-xs font-medium bg-primary/8 text-primary rounded-md px-2 py-0.5 border border-primary/15">
          {policy}
        </span>
        {amount && (
          <span className="text-xs font-semibold text-foreground">{amount}</span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{label}</span>
        )}
      </div>

      {/* Bottom row: domain + date + chevron */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-primary font-medium">
            {record.evidence.manifest.domain}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(record.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}
