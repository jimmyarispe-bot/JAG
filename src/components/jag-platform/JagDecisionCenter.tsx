"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  DecisionStatus,
  DecisionSummary,
  JagDecision,
  MergedDecisionTimelineItem,
} from "@/lib/executive-intelligence/decisions";
import { DECISION_STATUSES } from "@/lib/executive-intelligence/decisions";

type OrgOption = { readonly id: string; readonly name: string };

function severityClass(severity: string): string {
  if (severity === "Critical") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "Warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function JagDecisionCenter({
  organizations,
  organizationId,
  decisions,
  summary,
  mergedTimeline,
  selectedId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly decisions: readonly JagDecision[];
  readonly summary: DecisionSummary;
  readonly mergedTimeline: readonly MergedDecisionTimelineItem[];
  readonly selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "Open">(
    "Open"
  );

  const selected =
    decisions.find((d) => d.id === selectedId) ?? decisions[0] ?? null;

  const filtered = useMemo(() => {
    if (statusFilter === "Open") {
      return decisions.filter(
        (d) =>
          d.status === "Detected" ||
          d.status === "Needs Review" ||
          d.status === "Assigned" ||
          d.status === "In Progress"
      );
    }
    return decisions.filter((d) => d.status === statusFilter);
  }, [decisions, statusFilter]);

  function selectDecision(id: string) {
    router.push(
      `/jag/decisions?org=${encodeURIComponent(organizationId)}&decision=${encodeURIComponent(id)}`
    );
  }

  async function patch(body: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          decisionId: selected?.id,
          ...body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(
          data.userMessage ?? data.error ?? "Unable to update decision."
        );
        return;
      }
      router.refresh();
    });
  }

  async function createManual() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          category: "Manual",
          title: "Manual executive decision",
          description:
            "Operator-created decision requiring review and assignment.",
          severity: "Info",
          businessUnit: "Corporate",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        userMessage?: string;
        decision?: JagDecision;
      };
      if (!res.ok || data.ok === false) {
        setError(
          data.userMessage ?? data.error ?? "Unable to create decision."
        );
        return;
      }
      if (data.decision) {
        selectDecision(data.decision.id);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Decision Center™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Structured executive inbox for decisions that need attention.
            Deterministic only — no AI recommendations or autonomous actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600">
            Organization
            <select
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
              value={organizationId}
              onChange={(e) =>
                router.push(
                  `/jag/decisions?org=${encodeURIComponent(e.target.value)}`
                )
              }
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => void createManual()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            New Decision
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Decision Summary
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Open</dt>
            <dd className="text-2xl font-semibold">{summary.open}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Overdue</dt>
            <dd className="text-2xl font-semibold">{summary.overdue}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Critical</dt>
            <dd className="text-2xl font-semibold">{summary.critical}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Recently Resolved</dt>
            <dd className="text-2xl font-semibold">
              {summary.recentlyResolved}
            </dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-4 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-500">By Business Unit</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(summary.byBusinessUnit).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">By Department</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(summary.byDepartment).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Decisions
            </h2>
            <select
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DecisionStatus | "Open")
              }
            >
              <option value="Open">Open</option>
              {DECISION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No decisions in this view.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => selectDecision(d.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      selected?.id === d.id
                        ? "border-slate-400 ring-1 ring-slate-300"
                        : "border-slate-100"
                    } ${severityClass(d.severity)}`}
                  >
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs opacity-80">
                      {d.priority} · {d.status} · {d.category}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Select a decision to view detail.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selected.title}
                </h2>
                <p className="mt-1 text-slate-600">{selected.description}</p>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <select
                      className="mt-0.5 rounded border border-slate-300 bg-white px-2 py-1"
                      disabled={pending}
                      value={selected.status}
                      onChange={(e) =>
                        void patch({ status: e.target.value })
                      }
                    >
                      {DECISION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Severity / Priority</dt>
                  <dd>
                    {selected.severity} · {selected.priority}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Trigger</dt>
                  <dd>{selected.trigger}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Owner</dt>
                  <dd>
                    {selected.owner
                      ? `${selected.owner.targetLabel} (${selected.owner.targetType})`
                      : "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Due</dt>
                  <dd>
                    {selected.dueDate
                      ? new Date(selected.dueDate).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd>{selected.source}</dd>
                </div>
              </dl>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Recommended process (static)
                </p>
                <p className="mt-1 text-slate-700">
                  {selected.recommendedProcess}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Supporting evidence
                </p>
                <ul className="mt-1 list-inside list-disc text-slate-700">
                  {selected.relatedEvidenceIds.length === 0 ? (
                    <li>None linked</li>
                  ) : (
                    selected.relatedEvidenceIds.map((id) => (
                      <li key={id}>
                        <a
                          className="underline"
                          href={`/jag/evidence?org=${encodeURIComponent(organizationId)}&doc=${encodeURIComponent(id)}`}
                        >
                          {id.slice(0, 8)}…
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  onClick={() =>
                    void patch({
                      assignment: {
                        targetType: "Person",
                        targetId: "user.exec",
                        targetLabel: "Executive Owner",
                        reason: "Assigned from Decision Center™",
                      },
                    })
                  }
                >
                  Assign Person
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  onClick={() =>
                    void patch({
                      assignment: {
                        targetType: "Team",
                        targetId: "team.ops",
                        targetLabel: "Operations Team",
                      },
                    })
                  }
                >
                  Assign Team
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  onClick={() =>
                    void patch({
                      assignment: {
                        targetType: "Business Unit",
                        targetId: "bu.finance",
                        targetLabel: "Finance",
                      },
                      businessUnit: "Finance",
                    })
                  }
                >
                  Assign Business Unit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  onClick={() => void patch({ status: "Resolved" })}
                >
                  Resolve
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Decision Timeline
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Merged decision, insight, connector, and evidence events.
        </p>
        {mergedTimeline.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No timeline events yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {mergedTimeline.slice(0, 40).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.source} · {item.detail}
                  </p>
                </div>
                <time className="text-xs text-slate-500">
                  {new Date(item.at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
