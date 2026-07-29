import type { JagCardStatus } from "./types";

const LABELS: Record<JagCardStatus, string> = {
  loading: "Loading",
  empty: "Empty",
  ready: "Ready",
};

const STYLES: Record<JagCardStatus, string> = {
  loading: "border-[var(--jag-border)] text-[var(--jag-muted)]",
  empty: "border-[var(--jag-border)] text-[var(--jag-muted)]",
  ready: "border-[var(--jag-ready)] text-[var(--jag-ready)]",
};

export function JagStatusBadge({ status }: { readonly status: JagCardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
