import Link from "next/link";
import { explainAlertForDetail } from "@/lib/jag-command-center/explain";
import type { JagInboxWorkspaceModel } from "@/lib/jag-command-center/watchers";
import {
  jagAcknowledgeAlertAction,
  jagDismissAlertAction,
  jagResolveAlertAction,
} from "@/lib/jag-command-center/watchers";
import { JagExplainPanel } from "../explain";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

export function JagInboxView({
  model,
}: {
  readonly model: JagInboxWorkspaceModel;
}) {
  const selected = model.selected;

  return (
    <div className="space-y-8">
      <JagSection
        title="Executive Inbox"
        description="Proactive findings — risks, opportunities, and attention items. JAG never executes decisions."
        actions={
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/jag/chat"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Ask Conversation
            </Link>
            <Link
              href="/jag/graph"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Graph
            </Link>
            <Link
              href="/jag/strategy"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Strategy
            </Link>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
          <JagStatusBadge
            status={model.alerts.length > 0 ? "ready" : "empty"}
          />
        </div>
        <p className="text-xs text-[var(--jag-muted)]">{model.explanation}</p>
        {model.organizations.length > 1 ? (
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-xs">
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Organization</span>
              <select
                name="org"
                defaultValue={model.organizationId ?? ""}
                className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                {model.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-[var(--jag-border)] px-2 py-1.5 text-[var(--jag-text)]"
            >
              Load
            </button>
          </form>
        ) : model.organizationName ? (
          <p className="mt-2 text-sm text-[var(--jag-text)]">
            Organization · {model.organizationName}
          </p>
        ) : null}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[var(--jag-muted)]">Open</dt>
            <dd className="text-lg text-[var(--jag-text)]">{model.counts.open}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Critical</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.counts.critical}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">High</dt>
            <dd className="text-lg text-[var(--jag-text)]">{model.counts.high}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Acknowledged</dt>
            <dd className="text-lg text-[var(--jag-text)]">
              {model.counts.acknowledged}
            </dd>
          </div>
        </dl>
      </JagSection>

      {!model.organizationId ? (
        <JagEmptyState
          title="No organization selected"
          description="Bind an organization to run watchers."
        />
      ) : (
        <>
          <JagSection
            title="Digests"
            description="Morning, afternoon, weekly, monthly, and board digests from watcher output."
          >
            <form method="get" className="flex flex-wrap gap-2 text-xs">
              <input type="hidden" name="org" value={model.organizationId} />
              {model.digestKinds.map((kind) => (
                <button
                  key={kind}
                  type="submit"
                  name="digest"
                  value={kind}
                  className="rounded border border-[var(--jag-border)] px-2 py-1.5 capitalize text-[var(--jag-text)]"
                >
                  {kind}
                </button>
              ))}
            </form>
            {model.latestDigest ? (
              <div className="mt-3 rounded border border-[var(--jag-border)] p-3 text-sm">
                <p className="font-medium text-[var(--jag-text)]">
                  {model.latestDigest.title}
                </p>
                <p className="mt-1 text-xs text-[var(--jag-muted)]">
                  {model.latestDigest.criticalCount} critical ·{" "}
                  {model.latestDigest.highCount} high ·{" "}
                  {model.latestDigest.alertIds.length} item(s)
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--jag-muted)]">
                  {model.latestDigest.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--jag-muted)]">
                Generate a digest to summarize current attention items.
              </p>
            )}
          </JagSection>

          <JagSection
            title="Attention queue"
            description="Meaningful findings only — duplicates merged, noise suppressed."
          >
            {model.alerts.length === 0 ? (
              <JagEmptyState
                title="Inbox clear"
                description="No material watcher findings right now. Quality over quantity."
              />
            ) : (
              <ul className="space-y-2">
                {model.alerts.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/jag/inbox?org=${encodeURIComponent(model.organizationId!)}&id=${encodeURIComponent(a.id)}`}
                      className={`block rounded border px-3 py-2 text-sm ${
                        selected?.id === a.id
                          ? "border-[var(--jag-text)] bg-[var(--jag-panel)]"
                          : "border-[var(--jag-border)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-[var(--jag-text)]">
                          {a.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-wide text-[var(--jag-muted)]">
                          {a.severity} · {a.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--jag-muted)]">
                        {a.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </JagSection>

          {selected ? (
            <JagSection
              title="Alert detail"
              description="Evidence, drivers, related strategy, and recommended executive action."
            >
              <div className="space-y-3 text-sm">
                <p className="text-[var(--jag-text)]">{selected.summary}</p>
                <p className="text-xs text-[var(--jag-muted)]">
                  Confidence {(selected.confidence * 100).toFixed(0)}% · type{" "}
                  {selected.type.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-[var(--jag-text)]">
                  <span className="text-[var(--jag-muted)]">Recommended · </span>
                  {selected.recommendedExecutiveAction}
                </p>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                    Primary drivers
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-[var(--jag-muted)]">
                    {selected.primaryDrivers.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                    Evidence
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-[var(--jag-muted)]">
                    {selected.explanation.evidence.map((e) => (
                      <li key={e.id}>
                        {e.source}: {e.summary}
                      </li>
                    ))}
                  </ul>
                </div>
                {(selected.explanation.memory.length > 0 ||
                  selected.explanation.forecasts.length > 0 ||
                  selected.explanation.scenarios.length > 0) && (
                  <div className="text-xs text-[var(--jag-muted)]">
                    {selected.explanation.memory.length > 0 ? (
                      <p>Memory · {selected.explanation.memory.join("; ")}</p>
                    ) : null}
                    {selected.explanation.forecasts.length > 0 ? (
                      <p>
                        Forecasts · {selected.explanation.forecasts.join("; ")}
                      </p>
                    ) : null}
                    {selected.explanation.scenarios.length > 0 ? (
                      <p>
                        Scenarios · {selected.explanation.scenarios.join("; ")}
                      </p>
                    ) : null}
                  </div>
                )}
                <p className="text-xs text-[var(--jag-muted)]">
                  Contributors ·{" "}
                  {selected.explanation.contributors.join(", ")}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <form action={jagAcknowledgeAlertAction}>
                    <input type="hidden" name="alertId" value={selected.id} />
                    <button
                      type="submit"
                      className="rounded border border-[var(--jag-border)] px-2 py-1 text-xs text-[var(--jag-text)]"
                    >
                      Acknowledge
                    </button>
                  </form>
                  <form action={jagDismissAlertAction}>
                    <input type="hidden" name="alertId" value={selected.id} />
                    <button
                      type="submit"
                      className="rounded border border-[var(--jag-border)] px-2 py-1 text-xs text-[var(--jag-text)]"
                    >
                      Dismiss
                    </button>
                  </form>
                  <form action={jagResolveAlertAction}>
                    <input type="hidden" name="alertId" value={selected.id} />
                    <button
                      type="submit"
                      className="rounded border border-[var(--jag-border)] px-2 py-1 text-xs text-[var(--jag-text)]"
                    >
                      Resolve
                    </button>
                  </form>
                </div>
                <JagExplainPanel
                  explanation={explainAlertForDetail({
                    organizationId: selected.organizationId,
                    alertId: selected.id,
                    title: selected.title,
                    summary: selected.summary,
                    confidence: selected.confidence,
                    type: selected.type,
                    drivers: selected.primaryDrivers,
                    evidence: selected.evidence,
                    memory: selected.explanation.memory,
                    goals: selected.relatedGoalIds,
                    decisions: selected.relatedDecisionIds,
                    rulesFired: [
                      selected.watcherId,
                      selected.type,
                      ...selected.primaryDrivers.slice(0, 3),
                    ],
                  })}
                  graphHref={`/jag/graph?org=${encodeURIComponent(selected.organizationId)}&focus=${encodeURIComponent(`alert:${selected.id}`)}`}
                />
                <p className="text-[11px] text-[var(--jag-muted)]">
                  {selected.advisoryNotice}
                </p>
              </div>
            </JagSection>
          ) : null}
        </>
      )}
    </div>
  );
}
