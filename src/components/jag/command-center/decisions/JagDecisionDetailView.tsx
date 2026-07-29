import Link from "next/link";
import type { JagDecisionDetail } from "@/lib/jag-command-center/decision-center/types";
import { JagSection } from "../JagSection";
import { JagDecisionAssignmentForm } from "./JagDecisionAssignmentForm";
import { JagDecisionExecutionForm } from "./JagDecisionExecutionForm";
import { JagDecisionOutcomeForm } from "./JagDecisionOutcomeForm";
import { JagDecisionStatusForm } from "./JagDecisionStatusForm";

export function JagDecisionDetailView({
  detail,
}: {
  readonly detail: JagDecisionDetail;
}) {
  const { card } = detail;

  return (
    <div className="space-y-6">
      <JagSection
        title={card.title}
        description={`${card.categoryLabel} · ${card.organizationName} · ${card.priority}${
          card.isOverdue ? " · Overdue" : ""
        }`}
        actions={
          <Link
            href="/jag/decisions"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Queue
          </Link>
        }
      >
        <div className="space-y-4 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <Meta label="Domain" value={card.domainName} />
            <Meta label="Capability Pack" value={card.capabilityPackName} />
            <Meta label="Contributor" value={card.contributorLabel} />
            <Meta label="Confidence" value={card.confidence.toFixed(2)} mono />
            <Meta label="Evidence" value={String(card.evidenceCount)} mono />
            <Meta label="Action" value={card.actionId} mono />
          </dl>
          <p className="text-sm leading-relaxed text-[var(--jag-text)]">
            {card.recommendedAction}
          </p>
          <JagDecisionStatusForm decisionId={card.id} status={card.status} />
        </div>
      </JagSection>

      {detail.predictedConsequence ? (
        <Panel title="Predicted consequence if no action">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
            Advisory forecast — not a fact
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--jag-text)]">
            {detail.predictedConsequence.statement}
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
            <Meta
              label="Horizon"
              value={detail.predictedConsequence.horizonLabel}
            />
            <Meta
              label="Confidence"
              value={`${(detail.predictedConsequence.confidence * 100).toFixed(0)}%`}
              mono
            />
            <Meta
              label="Risk"
              value={detail.predictedConsequence.riskLevel.replace(/_/g, " ")}
            />
          </dl>
          <p className="mt-3 text-xs text-[var(--jag-muted)]">
            Related prediction:{" "}
            {detail.predictedConsequence.relatedPredictionKind.replace(
              /_/g,
              " "
            )}
            . {detail.predictedConsequence.advisoryNotice}
          </p>
        </Panel>
      ) : null}

      <Panel title="Assignment">
        <JagDecisionAssignmentForm
          decisionId={card.id}
          organizationId={card.organizationId}
          organizationName={card.organizationName}
          assignment={detail.assignment}
        />
      </Panel>

      <Panel title="Execution">
        <JagDecisionExecutionForm decisionId={card.id} />
        {detail.executionHistory.length === 0 ? (
          <Empty text="No execution updates yet. Start work to move into In Progress." />
        ) : (
          <ul className="mt-4 space-y-2">
            {detail.executionHistory.map((event) => (
              <li
                key={event.id}
                className="border-t border-[var(--jag-border)] pt-2 text-xs text-[var(--jag-muted)] first:border-0 first:pt-0"
              >
                <span className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-muted-2)]">
                  {event.at}
                </span>
                {" · "}
                <span className="text-[var(--jag-text)]">{event.kind}</span>
                {" · "}
                {event.actor}
                {" · "}
                {event.message}
                {typeof event.progressPct === "number"
                  ? ` · ${event.progressPct}%`
                  : ""}
                {event.evidenceRef ? ` · ${event.evidenceRef}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Outcome review">
        <JagDecisionOutcomeForm
          decisionId={card.id}
          outcome={detail.outcome}
          feedback={detail.feedback}
        />
      </Panel>

      <Panel title="Evidence">
        {detail.evidence.length === 0 ? (
          <Empty text="No evidence items were attached to this proposal." />
        ) : (
          <ul className="space-y-2">
            {detail.evidence.map((e) => (
              <li
                key={e.id}
                className="border-t border-[var(--jag-border)] pt-2 first:border-0 first:pt-0"
              >
                <p className="text-sm text-[var(--jag-text)]">
                  {e.summary || e.code || e.id}
                </p>
                <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  {e.source}
                  {e.code ? ` · ${e.code}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recommendations">
        {detail.recommendations.length === 0 ? (
          <Empty text="No recommendations on the source contributor result." />
        ) : (
          <ul className="space-y-3">
            {detail.recommendations.map((r) => (
              <li key={r.id}>
                <p className="text-sm text-[var(--jag-text)]">{r.title}</p>
                <p className="mt-0.5 text-xs text-[var(--jag-muted)]">
                  {r.explanation}
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  conf {r.confidence.toFixed(2)} · priority {r.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Policy Trace">
          <BulletList items={detail.policyTrace} />
        </Panel>
        <Panel title="Knowledge References">
          {detail.knowledgeReferences.length === 0 ? (
            <Empty text="No knowledge references recorded." />
          ) : (
            <BulletList items={detail.knowledgeReferences} mono />
          )}
        </Panel>
      </div>

      <Panel title="Contributor Trace">
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <Meta
            label="Contributor"
            value={detail.contributorTrace.contributorId}
            mono
          />
          <Meta label="Readiness" value={detail.contributorTrace.readiness} />
        </dl>
        <p className="mt-3 text-sm text-[var(--jag-muted)]">
          {detail.contributorTrace.explanation}
        </p>
        {detail.contributorTrace.warnings.length > 0 ? (
          <BulletList
            items={detail.contributorTrace.warnings}
            title="Warnings"
          />
        ) : null}
        {detail.contributorTrace.blockingIssues.length > 0 ? (
          <BulletList
            items={detail.contributorTrace.blockingIssues}
            title="Blocking"
          />
        ) : null}
        {detail.contributorTrace.laws.length > 0 ? (
          <BulletList
            items={detail.contributorTrace.laws}
            title="Constitutional laws"
            mono
          />
        ) : null}
        <p className="mt-2 text-xs text-[var(--jag-muted)]">
          {detail.contributorTrace.rationale}
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dependencies">
          {detail.dependencies.length === 0 ? (
            <Empty text="No upstream contributor dependencies declared." />
          ) : (
            <BulletList items={detail.dependencies} mono />
          )}
        </Panel>
        <Panel title="Observability">
          <dl className="grid gap-2 text-xs">
            <Meta
              label="Analyzed at"
              value={detail.observability.analyzedAt}
              mono
            />
            <Meta
              label="Duration"
              value={
                typeof detail.observability.durationMs === "number"
                  ? `${detail.observability.durationMs} ms`
                  : "—"
              }
              mono
            />
            <Meta
              label="Evidence count"
              value={String(detail.observability.evidenceCount)}
              mono
            />
            <Meta
              label="Recommendations"
              value={String(detail.observability.recommendationCount)}
              mono
            />
            <Meta
              label="Confidence"
              value={detail.observability.confidence.toFixed(2)}
              mono
            />
          </dl>
        </Panel>
      </div>

      <Panel title="Timeline">
        {detail.timeline.length === 0 ? (
          <Empty text="No timeline events yet." />
        ) : (
          <ul className="space-y-2">
            {detail.timeline.map((entry) => (
              <li
                key={entry.id}
                className="border-t border-[var(--jag-border)] pt-2 text-xs text-[var(--jag-muted)] first:border-0 first:pt-0"
              >
                <span className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-muted-2)]">
                  {entry.at}
                </span>
                {" · "}
                {entry.actor}
                {" · "}
                {entry.message}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
      <h2 className="mb-3 text-sm font-medium text-[var(--jag-text)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[var(--jag-muted-2)]">{label}</dt>
      <dd
        className={`mt-0.5 break-all text-[var(--jag-text)] ${
          mono ? "font-[family-name:var(--font-jag-mono)]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function BulletList({
  items,
  title,
  mono,
}: {
  items: readonly string[];
  title?: string;
  mono?: boolean;
}) {
  return (
    <div className={title ? "mt-3" : undefined}>
      {title ? (
        <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
          {title}
        </p>
      ) : null}
      <ul className="space-y-1 text-xs text-[var(--jag-muted)]">
        {items.map((item) => (
          <li
            key={item}
            className={mono ? "font-[family-name:var(--font-jag-mono)]" : ""}
          >
            – {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-3 text-xs text-[var(--jag-muted)]">{text}</p>;
}
