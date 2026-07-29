import Link from "next/link";
import { redirect } from "next/navigation";
import {
  JagEmptyState,
  JagSection,
  JagStatusBadge,
} from "@/components/jag/command-center";
import {
  listJagAuditEvents,
  listPredictionObservations,
  listScenarioObservations,
} from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * Observability surfaces executive audit, prediction, and scenario runs.
 * No fabricated telemetry.
 */
export default async function JagObservabilityPage() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const events = listJagAuditEvents(40);
  const predictions = listPredictionObservations(20);
  const scenarios = listScenarioObservations(20);

  return (
    <div className="space-y-8">
      <JagSection
        title="Observability"
        description="Executive action audit trail and predictive intelligence runs. No stack traces. No fabricated telemetry."
        actions={
          <Link
            href="/jag"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Overview
          </Link>
        }
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Timestamp · Organization · User · Decision · Action
          </p>
          <JagStatusBadge status={events.length > 0 ? "ready" : "empty"} />
        </div>

        {events.length === 0 ? (
          <JagEmptyState
            title="No audit events yet"
            description="Approve, assign, complete, generate a briefing, or run forecasts to populate the executive audit trail."
          />
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {e.at}
                  </p>
                  <p className="text-[var(--jag-text)]">
                    {e.action.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{e.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  user {e.actorLabel}
                  {e.organizationId ? ` · org ${e.organizationId}` : ""}
                  {e.decisionId
                    ? ` · decision ${e.decisionId.slice(0, 12)}`
                    : ""}
                  {e.briefingId
                    ? ` · briefing ${e.briefingId.slice(0, 12)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Prediction runs"
        description="Every advisory forecast records execution, inputs, contributors, confidence calculation, and duration."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Predictions are advisory — never facts.
          </p>
          <JagStatusBadge
            status={predictions.length > 0 ? "ready" : "empty"}
          />
        </div>

        {predictions.length === 0 ? (
          <JagEmptyState
            title="No prediction runs yet"
            description="Open the Executive Overview Forecasts section or generate a briefing with a Forecast section to record a run."
          />
        ) : (
          <ul className="space-y-2">
            {predictions.map((p) => (
              <li
                key={p.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {p.finishedAt}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {p.durationMs}ms
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">
                  Horizon {p.horizon} · {p.kinds.length} kind(s) ·{" "}
                  {p.contributorsUsed.length} contributor(s) ·{" "}
                  {p.insufficientCount} insufficient
                </p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  org {p.organizationId} · signals{" "}
                  {p.inputSummary.signalCount} · open{" "}
                  {p.inputSummary.openDecisions} · overdue{" "}
                  {p.inputSummary.overdueDecisions}
                </p>
                <p className="mt-1 text-[10px] text-[var(--jag-muted-2)]">
                  Contributors:{" "}
                  {p.contributorsUsed.length > 0
                    ? p.contributorsUsed.join(", ")
                    : "none"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Scenario runs"
        description="Every advisory scenario records execution, inputs, duration, confidence, and comparison metadata."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Scenario projections are hypothetical — not certainty.
          </p>
          <JagStatusBadge status={scenarios.length > 0 ? "ready" : "empty"} />
        </div>

        {scenarios.length === 0 ? (
          <JagEmptyState
            title="No scenario runs yet"
            description="Open Scenario Planner or Decision Center what-if analysis to record a run."
          />
        ) : (
          <ul className="space-y-2">
            {scenarios.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {s.finishedAt}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {s.durationMs}ms · {s.mode}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">
                  {s.kinds.length} kind(s) · {s.scenarioIds.length} result(s)
                  {s.comparisonId ? " · comparison" : ""}
                </p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  org {s.organizationId} · kinds {s.kinds.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
