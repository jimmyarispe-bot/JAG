import { cn } from "../utils";

type InterventionStatus = "active" | "planned" | "completed" | "paused";

const statusConfig: Record<InterventionStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-brand-100 text-brand-800" },
  planned: { label: "Planned", tone: "bg-sky-100 text-sky-800" },
  completed: { label: "Completed", tone: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Paused", tone: "bg-slate-100 text-slate-600" },
};

interface InterventionIndicatorProps {
  status: InterventionStatus;
  className?: string;
}

export function InterventionIndicator({ status, className }: InterventionIndicatorProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", config.tone, className)}>
      {config.label}
    </span>
  );
}
