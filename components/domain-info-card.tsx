import { Card, CardContent } from "@/components/ui/card";
import { DomainBadge } from "@/components/domain-badge";
import { Globe, ShieldCheck, Building2, CheckCircle2 } from "lucide-react";

interface DomainInfoCardProps {
  domain: string;
}

export function DomainInfoCard({ domain }: DomainInfoCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Official Domain
            </span>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        
        <div className="mb-3">
          <DomainBadge domain={domain} size="lg" showVerified={true} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span className="text-muted-foreground">Verified Pi Network domain</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Institutional-grade governance</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This application is officially bound to the <span className="font-mono font-semibold text-primary">{domain}</span> domain 
            and ready for Pi Network Testnet deployment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
