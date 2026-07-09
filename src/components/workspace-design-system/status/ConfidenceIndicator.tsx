import { cn, formatPercent } from "../utils";

interface ConfidenceIndicatorProps {
  value: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

function toneForValue(value: number): string {
  if (value >= 80) return "text-emerald-600 bg-emerald-50";
  if (value >= 60) return "text-brand-600 bg-brand-50";
  if (value >= 40) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

export function ConfidenceIndicator({ value, label = "Confidence", compact = false, className }: ConfidenceIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const tone = toneForValue(clamped);

  if (compact) {
    return (
      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tone, className)}>
        {formatPercent(clamped)}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 font-medium", tone)}>{formatPercent(clamped)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
