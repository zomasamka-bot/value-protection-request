'use client';

"use client";

import { type Evidence } from "@/lib/core-engine";
import { FileJson, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ManifestJSON({ evidence }: { evidence: Evidence }) {
  const [copied, setCopied] = useState(false);

  const manifestData = {
    referenceId: evidence.referenceId,
    domain: evidence.manifest.domain,
    timestamp: evidence.timestamp,
    releaseTag: evidence.manifest.releaseTag,
    freezeId: evidence.manifest.freezeId,
    hooks: evidence.manifest.hooks,
    runtimeLog: evidence.runtimeLog,
    apiLog: evidence.apiLog,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(manifestData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Manifest JSON
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted/30 rounded p-3 max-h-64 overflow-y-auto">
        <pre className="text-xs font-mono text-foreground">
          {JSON.stringify(manifestData, null, 2)}
        </pre>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Complete evidence manifest for audit and compliance verification
      </p>
    </div>
  );
}
