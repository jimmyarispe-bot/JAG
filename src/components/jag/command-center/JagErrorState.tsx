export function JagErrorState({
  title = "Something went wrong",
  description = "The Command Center could not complete this request. Try again, or return to the overview. Technical details are not shown.",
  action,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-4 py-8"
      role="alert"
    >
      <p className="text-sm font-medium text-[var(--jag-text)]">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--jag-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
