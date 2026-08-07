export function ListeningStatusPill({
  label,
}: {
  readonly label: string;
}) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--jag-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--jag-muted)]">
      {label}
    </span>
  );
}
