export function JagEmptyState({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-8"
      role="status"
    >
      <p className="text-sm font-medium text-[var(--jag-text)]">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--jag-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
