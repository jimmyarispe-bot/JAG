export function ListeningProgress({
  current,
  total,
  label,
}: {
  readonly current: number;
  readonly total: number;
  readonly label?: string;
}) {
  const pct = total <= 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div
      className="space-y-2"
      data-testid="listening-progress"
      aria-label={label ?? `Progress ${current} of ${total}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--lp-muted)]">
        <span>
          {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--lp-border)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="h-full rounded-full bg-[var(--lp-accent)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
