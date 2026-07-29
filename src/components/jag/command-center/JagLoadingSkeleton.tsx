export function JagLoadingSkeleton({
  title = "Loading…",
  description,
  cards = 6,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly cards?: number;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div>
        <p className="text-lg font-medium tracking-tight text-[var(--jag-text)]">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-[var(--jag-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
