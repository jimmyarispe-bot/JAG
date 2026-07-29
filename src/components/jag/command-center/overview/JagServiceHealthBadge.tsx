import type { JagServiceHealth } from "@/lib/jag-command-center";

const STYLES: Record<JagServiceHealth, string> = {
  healthy: "border-[var(--jag-ready)] text-[var(--jag-ready)]",
  loading: "border-[var(--jag-border)] text-[var(--jag-muted)]",
  unavailable: "border-[var(--jag-border-strong)] text-[var(--jag-muted)]",
};

const LABELS: Record<JagServiceHealth, string> = {
  healthy: "Healthy",
  loading: "Loading",
  unavailable: "Unavailable",
};

export function JagServiceHealthBadge({
  health,
}: {
  readonly health: JagServiceHealth;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${STYLES[health]}`}
    >
      {LABELS[health]}
    </span>
  );
}
