"use client";

export function ListeningBanner({
  tone,
  children,
  onDismiss,
}: {
  readonly tone: "success" | "info";
  readonly children: React.ReactNode;
  readonly onDismiss?: () => void;
}) {
  const styles =
    tone === "success"
      ? "border-[var(--jag-ready)]/40 bg-[var(--jag-ready)]/10 text-[var(--jag-text)]"
      : "border-[var(--jag-border)] bg-[var(--jag-panel)] text-[var(--jag-muted)]";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${styles}`}
    >
      <div>{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
