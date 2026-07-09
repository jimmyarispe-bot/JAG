import { cn } from "../utils";

type RecommendationPriority = "low" | "medium" | "high";

const priorityConfig: Record<RecommendationPriority, { label: string; tone: string }> = {
  low: { label: "Low", tone: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", tone: "bg-amber-100 text-amber-800" },
  high: { label: "High", tone: "bg-rose-100 text-rose-800" },
};

interface RecommendationIndicatorProps {
  priority: RecommendationPriority;
  className?: string;
}

export function RecommendationIndicator({ priority, className }: RecommendationIndicatorProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", config.tone, className)}>
      {config.label} priority
    </span>
  );
}
