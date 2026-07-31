import Link from "next/link";
import type { JagMemoryWorkspaceModel } from "@/lib/jag-command-center/memory";
import { jagRecordLessonFormAction } from "@/lib/jag-command-center/memory";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

export function JagMemoryView({
  model,
}: {
  readonly model: JagMemoryWorkspaceModel;
}) {
  return (
    <div className="space-y-8">
      <JagSection
        title="Organizational Memory"
        description="Institutional experience — decisions, outcomes, and lessons. Not chat history."
        actions={
          <Link
            href="/jag/chat"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Ask Conversation
          </Link>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
          <JagStatusBadge
            status={model.records.length > 0 ? "ready" : "empty"}
          />
        </div>
        <p className="text-xs text-[var(--jag-muted)]">{model.explanation}</p>
        {model.organizationName ? (
          <p className="mt-2 text-sm text-[var(--jag-text)]">
            Organization · {model.organizationName}
          </p>
        ) : null}
      </JagSection>

      {model.organizationId ? (
        <JagSection
          title="Search"
          description="Filter by organization context, type, outcome, decision, contributor, policy, risk, or opportunity."
        >
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <input type="hidden" name="org" value={model.organizationId} />
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Query</span>
              <input
                name="q"
                defaultValue={model.filters.q ?? ""}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Type</span>
              <select
                name="type"
                defaultValue={model.filters.type ?? "all"}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                <option value="all">All</option>
                {model.types.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Outcome</span>
              <select
                name="outcome"
                defaultValue={model.filters.outcome ?? "all"}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="mixed">Mixed</option>
                <option value="pending">Pending</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Facet</span>
              <select
                name="facet"
                defaultValue={model.filters.facet ?? "all"}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                <option value="all">All</option>
                <option value="risk">Risk</option>
                <option value="opportunity">Opportunity</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Decision id</span>
              <input
                name="decisionId"
                defaultValue={model.filters.decisionId ?? ""}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Contributor</span>
              <input
                name="contributorId"
                defaultValue={model.filters.contributorId ?? ""}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Policy</span>
              <input
                name="policyId"
                defaultValue={model.filters.policyId ?? ""}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Goal</span>
              <input
                name="goalId"
                defaultValue={model.filters.goalId ?? ""}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded border border-[var(--jag-border-strong)] px-3 py-1.5 text-[var(--jag-text)]"
              >
                Search memory
              </button>
            </div>
          </form>
        </JagSection>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <JagSection title="Patterns" description="Advisory recurring situations.">
          {model.patterns.length === 0 ? (
            <JagEmptyState
              title="No patterns yet"
              description="Patterns appear after multiple related memories accumulate."
            />
          ) : (
            <ul className="space-y-2 text-xs">
              {model.patterns.map((p) => (
                <li
                  key={p.id}
                  className="rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2"
                >
                  <p className="font-medium text-[var(--jag-text)]">{p.label}</p>
                  <p className="mt-1 text-[var(--jag-muted)]">{p.summary}</p>
                  <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {p.occurrenceCount}× · {(p.confidence * 100).toFixed(0)}%
                  </p>
                </li>
              ))}
            </ul>
          )}
        </JagSection>

        <JagSection title="Timeline" description="Chronology of organizational experience.">
          {model.timeline.length === 0 ? (
            <JagEmptyState
              title="Empty timeline"
              description="Outcomes and lessons will appear as institutional experience accumulates."
            />
          ) : (
            <ul className="space-y-2 text-xs">
              {model.timeline.slice(0, 12).map((e) => (
                <li key={e.memoryId} className="border-t border-[var(--jag-border)] pt-2 first:border-0 first:pt-0">
                  <Link
                    href={`/jag/memory?org=${encodeURIComponent(model.organizationId ?? "")}&id=${encodeURIComponent(e.memoryId)}`}
                    className="text-[var(--jag-text)] underline-offset-2 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <p className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {e.at} · {e.type} · {e.outcome}
                  </p>
                  <p className="text-[var(--jag-muted)]">{e.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </JagSection>
      </div>

      <JagSection title="Memories" description="Search results.">
        {model.records.length === 0 ? (
          <JagEmptyState
            title="No memories match"
            description="Complete decision outcomes or record a lesson learned below."
          />
        ) : (
          <ul className="space-y-3">
            {model.records.map((r) => (
              <li
                key={r.id}
                className={`rounded-md border px-4 py-3 text-xs ${
                  model.selected?.id === r.id
                    ? "border-[var(--jag-border-strong)] bg-[var(--jag-panel)]"
                    : "border-[var(--jag-border)] bg-[var(--jag-panel)]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/jag/memory?org=${encodeURIComponent(r.organizationId)}&id=${encodeURIComponent(r.id)}`}
                    className="text-sm font-medium text-[var(--jag-text)] underline-offset-2 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                    {r.date} · {r.type} · {r.outcome} ·{" "}
                    {(r.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-[var(--jag-muted)]">{r.description}</p>
                {r.outcomeSummary ? (
                  <p className="mt-1 text-[var(--jag-text)]">
                    Outcome · {r.outcomeSummary}
                  </p>
                ) : null}
                {r.lesson ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[var(--jag-muted)]">
                    <List label="What worked" items={r.lesson.whatWorked} />
                    <List label="What failed" items={r.lesson.whatFailed} />
                    <List
                      label="Unexpected"
                      items={r.lesson.unexpectedOutcomes}
                    />
                    <List
                      label="Recommendations"
                      items={r.lesson.recommendations}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      {model.organizationId && model.organizationName ? (
        <JagSection
          title="Record lesson learned"
          description="What worked, what failed, unexpected outcomes, recommendations for the future."
        >
          <form
            action={jagRecordLessonFormAction}
            className="grid gap-3 text-xs sm:grid-cols-2"
          >
            <input type="hidden" name="organizationId" value={model.organizationId} />
            <input
              type="hidden"
              name="organizationName"
              value={model.organizationName}
            />
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[var(--jag-muted)]">Title</span>
              <input
                name="title"
                required
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[var(--jag-muted)]">Description</span>
              <textarea
                name="description"
                rows={2}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">What worked</span>
              <textarea
                name="whatWorked"
                rows={3}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">What failed</span>
              <textarea
                name="whatFailed"
                rows={3}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Unexpected outcomes</span>
              <textarea
                name="unexpected"
                rows={3}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Recommendations</span>
              <textarea
                name="recommendations"
                rows={3}
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[var(--jag-muted)]">Related decision id (optional)</span>
              <input
                name="relatedDecisionId"
                className="w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded border border-[var(--jag-border-strong)] px-3 py-1.5 text-[var(--jag-text)]"
              >
                Save lesson
              </button>
            </div>
          </form>
        </JagSection>
      ) : null}
    </div>
  );
}

function List({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      <ul className="mt-1 space-y-0.5">
        {items.map((i) => (
          <li key={i}>– {i}</li>
        ))}
      </ul>
    </div>
  );
}
