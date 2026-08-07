import type { ListeningPublicErrorView } from "@/lib/platform/listening";

export function ListeningPublicError({
  error,
}: {
  readonly error: ListeningPublicErrorView;
}) {
  return (
    <div
      className="rounded-md border border-[var(--lp-border)] bg-[var(--lp-panel)] px-5 py-8"
      role="alert"
      data-testid="listening-public-error"
      data-error-kind={error.kind}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--lp-muted)]">
        Listening
      </p>
      <h1 className="mt-2 text-xl font-medium text-[var(--lp-text)]">
        {error.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--lp-muted)]">
        {error.description}
      </p>
    </div>
  );
}
