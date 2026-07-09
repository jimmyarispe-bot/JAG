import { wdsMasteryLevels, type WdsMasteryLevel } from "../tokens";
import { cn } from "../utils";

interface MasteryBadgeProps {
  level: WdsMasteryLevel;
  size?: "sm" | "md";
  className?: string;
}

export function MasteryBadge({ level, size = "md", className }: MasteryBadgeProps) {
  const config = wdsMasteryLevels[level];
  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        config.tone,
        className
      )}
    >
      {config.label}
    </span>
  );
}
