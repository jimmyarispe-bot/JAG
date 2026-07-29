export function JagMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate font-[family-name:var(--font-jag-mono)] text-2xl font-medium tabular-nums tracking-tight text-[var(--jag-text)]">
        {value}
      </p>
    </div>
  );
}
