export function JagSection({
  title,
  description,
  children,
  actions,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly actions?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium tracking-tight text-[var(--jag-text)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--jag-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
