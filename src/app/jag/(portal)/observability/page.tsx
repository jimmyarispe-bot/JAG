import Link from "next/link";
import { redirect } from "next/navigation";
import {
  JagEmptyState,
  JagSection,
  JagStatusBadge,
} from "@/components/jag/command-center";
import {
  listConversationObservations,
  listJagAuditEvents,
  listMemoryObservations,
  listPredictionObservations,
  listScenarioObservations,
  listStrategyObservations,
  listWatcherObservations,
  listCapabilityObservations,
} from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * Observability surfaces executive audit and intelligence runs.
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
  const conversations = listConversationObservations(20);
  const memories = listMemoryObservations(20);
  const strategies = listStrategyObservations(20);
  const watchers = listWatcherObservations(20);
  const capabilities = listCapabilityObservations(20);

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

      <JagSection
        title="Conversation turns"
        description="Every executive question records intent, duration, evidence used, contributors, confidence, and related objects."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Evidence-backed answers only — not chatbot logs.
          </p>
          <JagStatusBadge
            status={conversations.length > 0 ? "ready" : "empty"}
          />
        </div>

        {conversations.length === 0 ? (
          <JagEmptyState
            title="No conversation turns yet"
            description="Ask a question at /jag/chat to record a grounded turn."
          />
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {c.finishedAt}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {c.durationMs}ms · {(c.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{c.question}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  intent {c.intent} · evidence {c.evidenceIds.length} ·
                  contributors {c.contributorsConsulted.length}
                  {c.insufficientData ? " · insufficient" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Capability operations"
        description="Capability registration, initialization, health changes, and dependency failures."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Intelligence Capability SDK — self-describing module registry.
          </p>
          <JagStatusBadge
            status={capabilities.length > 0 ? "ready" : "empty"}
          />
        </div>
        {capabilities.length === 0 ? (
          <JagEmptyState
            title="No capability operations yet"
            description="Open Capabilities to bootstrap the registry and populate this log."
          />
        ) : (
          <ul className="space-y-2">
            {capabilities.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {c.at}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {c.kind.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{c.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  {c.capabilityId ?? "registry"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Watcher operations"
        description="Watcher execution, alert generation, acknowledgements, dismissals, and resolutions."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Autonomous executive intelligence — proactive findings, never decisions.
          </p>
          <JagStatusBadge status={watchers.length > 0 ? "ready" : "empty"} />
        </div>
        {watchers.length === 0 ? (
          <JagEmptyState
            title="No watcher operations yet"
            description="Open Executive Inbox to evaluate watchers and populate this log."
          />
        ) : (
          <ul className="space-y-2">
            {watchers.map((w) => (
              <li
                key={w.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {w.at}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {w.durationMs}ms · {w.kind.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{w.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  alerts {w.alertIds.length}
                  {w.organizationId ? ` · org ${w.organizationId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Strategy operations"
        description="Goal evaluations, alignment calculations, scorecard generation, and mission updates."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Strategic intelligence — mission alignment telemetry.
          </p>
          <JagStatusBadge status={strategies.length > 0 ? "ready" : "empty"} />
        </div>
        {strategies.length === 0 ? (
          <JagEmptyState
            title="No strategy operations yet"
            description="Open Strategic Intelligence or review a decision to populate this log."
          />
        ) : (
          <ul className="space-y-2">
            {strategies.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {s.at}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {s.durationMs}ms · {s.kind.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{s.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  entities {s.entityIds.length}
                  {s.organizationId ? ` · org ${s.organizationId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Memory operations"
        description="Memory creation, pattern detection, similarity searches, and retrieval."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            Institutional memory — not chat history.
          </p>
          <JagStatusBadge status={memories.length > 0 ? "ready" : "empty"} />
        </div>
        {memories.length === 0 ? (
          <JagEmptyState
            title="No memory operations yet"
            description="Record outcomes, lessons, or open Organizational Memory to populate this log."
          />
        ) : (
          <ul className="space-y-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {m.at}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {m.durationMs}ms · {m.kind.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{m.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                  memories {m.memoryIds.length}
                  {m.organizationId ? ` · org ${m.organizationId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
