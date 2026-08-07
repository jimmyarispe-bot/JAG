"use client";

export function ListeningThankYou({
  title,
  privacyStatement,
}: {
  readonly title: string;
  readonly privacyStatement?: string;
}) {
  return (
    <div
      className="space-y-4 rounded-md border border-[var(--lp-border)] bg-[var(--lp-panel)] px-5 py-8"
      data-testid="listening-thank-you"
      role="status"
    >
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--lp-ready)]">
        Submitted
      </p>
      <h1 className="text-2xl font-medium text-[var(--lp-text)]">Thank you</h1>
      <p className="text-sm leading-relaxed text-[var(--lp-muted)]">
        Your response to <span className="text-[var(--lp-text)]">{title}</span>{" "}
        was received. You may close this page.
      </p>
      {privacyStatement ? (
        <p className="border-t border-[var(--lp-border)] pt-4 text-sm leading-relaxed text-[var(--lp-muted)]">
          {privacyStatement}
        </p>
      ) : null}
    </div>
  );
}
