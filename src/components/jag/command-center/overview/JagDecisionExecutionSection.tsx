import Link from "next/link";
import type { JagDecisionExecutionDashboard } from "@/lib/jag-command-center";
import { JagMetric } from "../JagMetric";
import { JagSection } from "../JagSection";

export function JagDecisionExecutionSection({
  metrics,
}: {
  readonly metrics: JagDecisionExecutionDashboard;
}) {
  return (
    <JagSection
      title="Decision Execution"
      description="Operational command queue — open work, assignment load, and outcome quality."
      actions={
        <Link
          href={metrics.href}
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Decision Center
        </Link>
      }
    >
      <div className="grid gap-4 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 sm:grid-cols-2 lg:grid-cols-5">
        <JagMetric label="Open Decisions" value={String(metrics.openDecisions)} />
        <JagMetric label="Assigned" value={String(metrics.assigned)} />
        <JagMetric label="Overdue" value={String(metrics.overdue)} />
        <JagMetric
          label="Completed This Week"
          value={String(metrics.completedThisWeek)}
        />
        <JagMetric
          label="Outcome Success Rate"
          value={
            metrics.outcomeSuccessRate === null
              ? "—"
              : `${Math.round(metrics.outcomeSuccessRate * 100)}%`
          }
        />
      </div>
      {metrics.outcomeReviewedCount === 0 ? (
        <p className="mt-3 text-xs text-[var(--jag-muted)]">
          Outcome success rate appears after decisions reach Outcome Reviewed.
          Empty means no reviewed outcomes yet — not a fabricated zero.
        </p>
      ) : null}
    </JagSection>
  );
}
