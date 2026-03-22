import { Layers, Cog, Workflow, Database } from "lucide-react";

export function ArchitectureSummary() {
  const layers = [
    {
      icon: Cog,
      title: "Core Engine",
      description: "Unified state machine & evidence generation",
    },
    {
      icon: Workflow,
      title: "Action Config",
      description: "Behavior definition & flow control",
    },
    {
      icon: Database,
      title: "Evidence Pack",
      description: "Complete audit trail & manifest",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Unified Architecture
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-3">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-2 p-2 bg-muted/30 rounded border border-muted"
            >
              <div className="p-1.5 bg-primary/10 rounded">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">
                  {layer.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {layer.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Designed for institutional expansion without rebuilding core systems
      </p>
    </div>
  );
}
