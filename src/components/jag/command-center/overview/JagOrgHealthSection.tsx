import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";
import type { JagOrgHealthView } from "@/lib/jag-command-center";

export function JagOrgHealthSection({
  health,
}: {
  readonly health: JagOrgHealthView;
}) {
  return (
    <JagSection
      title="Organization Health"
      description="School Health Intelligence when a bound assessment exists."
    >
      <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            {health.source ?? "education.cognition.school_health"}
          </p>
          <JagStatusBadge status={health.status === "ready" ? "ready" : "empty"} />
        </div>

        {health.status === "empty" ? (
          <p className="text-sm leading-relaxed text-[var(--jag-muted)]">
            {health.explanation}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Overall Health" value={formatStance(health.overallHealth)} />
              <Metric
                label="Trend"
                value={health.trend ?? "Not reported"}
                muted={!health.trend}
              />
              <Metric label="Risk Level" value={health.riskLevel ?? "—"} />
              <Metric
                label="Confidence"
                value={
                  typeof health.confidence === "number"
                    ? health.confidence.toFixed(2)
                    : "—"
                }
              />
            </div>
            {typeof health.healthScore === "number" ? (
              <p className="font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                Health score {health.healthScore.toFixed(2)}
                {health.capturedAt ? ` · ${health.capturedAt}` : ""}
              </p>
            ) : null}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
                Primary Drivers
              </p>
              {health.primaryDrivers.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--jag-muted)]">
                  No drivers listed on the bound assessment.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-[var(--jag-text)]">
                  {health.primaryDrivers.map((driver) => (
                    <li key={driver} className="flex gap-2">
                      <span className="text-[var(--jag-muted-2)]">–</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[var(--jag-muted)]">
              {health.explanation}
            </p>
          </div>
        )}
      </div>
    </JagSection>
  );
}

function Metric({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-medium capitalize ${
          muted ? "text-[var(--jag-muted)]" : "text-[var(--jag-text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatStance(stance?: string): string {
  if (!stance) return "—";
  return stance.replace(/_/g, " ");
}
