import { Shield, Lock, FileCheck, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function InstitutionalBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">
            Institutional-Grade Governance
          </h4>
        </div>
        <Badge variant="outline" className="text-xs font-mono font-bold bg-primary/10 border-primary/40 text-primary">
          <Globe className="h-2.5 w-2.5 mr-1" />
          stable.pi
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Official <span className="font-mono font-semibold text-primary">stable.pi</span> domain application with full audit trail, evidence pack, monitoring hooks, and compliance-ready architecture for Pi Network testnet governance workflows.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-primary" />
          <span className="text-xs text-foreground">Authorization Only</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileCheck className="h-3 w-3 text-primary" />
          <span className="text-xs text-foreground">Complete Evidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-xs text-foreground">Real-Time Monitoring</span>
        </div>
      </div>
    </div>
  );
}
