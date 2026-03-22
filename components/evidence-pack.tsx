"use client";

import { type Evidence } from "@/lib/core-engine";
import { Package, Hash, Clock, Globe, Tag, Snowflake, Receipt, Link } from "lucide-react";

export function EvidencePack({ evidence }: { evidence: Evidence }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Evidence Pack</h3>
      </div>

      <div className="space-y-3">
        {/* Reference ID */}
        <div className="flex items-start gap-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Reference ID</p>
            <p className="text-xs font-mono text-foreground break-all">
              {evidence.referenceId}
            </p>
          </div>
        </div>

        {/* Domain */}
        <div className="flex items-start gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Domain</p>
            <p className="text-xs font-mono text-primary font-medium">
              {evidence.manifest.domain}
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-start gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Timestamp</p>
            <p className="text-xs font-mono text-foreground">
              {new Date(evidence.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Release Tag */}
        <div className="flex items-start gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Release Tag</p>
            <p className="text-xs font-mono text-foreground">
              {evidence.manifest.releaseTag}
            </p>
          </div>
        </div>

        {/* Freeze ID */}
        <div className="flex items-start gap-2">
          <Snowflake className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Freeze ID</p>
            <p className="text-xs font-mono text-foreground break-all">
              {evidence.manifest.freezeId}
            </p>
          </div>
        </div>

        {/* Payment ID — only present after payment completes */}
        {evidence.paymentId && (
          <div className="flex items-start gap-2">
            <Receipt className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Payment ID</p>
              <p className="text-xs font-mono text-foreground break-all">
                {evidence.paymentId}
              </p>
            </div>
          </div>
        )}

        {/* On-chain txid — only present after blockchain confirms */}
        {evidence.txid && (
          <div className="flex items-start gap-2">
            <Link className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Blockchain Txid</p>
              <p className="text-xs font-mono text-foreground break-all">
                {evidence.txid}
              </p>
            </div>
          </div>
        )}

        {/* Runtime Log */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Runtime Log</p>
          <div className="bg-muted/30 rounded p-2 space-y-1 max-h-32 overflow-y-auto">
            {evidence.runtimeLog.map((log, index) => (
              <p key={index} className="text-xs font-mono text-foreground">
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
