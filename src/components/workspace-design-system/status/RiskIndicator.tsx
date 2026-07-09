import { wdsRiskLevels, type WdsRiskLevel } from "../tokens";
import { cn } from "../utils";

interface RiskIndicatorProps {
  level: WdsRiskLevel;
  compact?: boolean;
  className?: string;
}

export function RiskIndicator({ level, compact = false, className }: RiskIndicatorProps) {
  const config = wdsRiskLevels[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        config.tone,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}
