"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  ExecutionDashboard,
  JagMilestone,
  JagProject,
  JagWorkItem,
  WorkStatus,
  WorkTimelineEntry,
} from "@/lib/work";
import { WORK_STATUSES } from "@/lib/work";

type OrgOption = { readonly id: string; readonly name: string };

function statusClass(status: WorkStatus): string {
  if (status === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "Blocked") return "border-rose-200 bg-rose-50 text-rose-900";
  if (status === "In Progress") return "border-sky-200 bg-sky-50 text-sky-900";
  if (status === "Review") return "border-violet-200 bg-violet-50 text-violet-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function JagWorkExecution({
  organizations,
  organizationId,
  organizationName,
  workItems,
  projects,
  milestones,
  dashboard,
  history,
  selectedId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly workItems: readonly JagWorkItem[];
  readonly projects: readonly JagProject[];
  readonly milestones: readonly JagMilestone[];
  readonly dashboard: ExecutionDashboard;
  readonly history: readonly WorkTimelineEntry[];
  readonly selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const selected =
    workItems.find((w) => w.id === selectedId) ?? workItems[0] ?? null;

  const selectedHistory = useMemo(
    () =>
      selected
        ? history.filter((h) => h.entityId === selected.id)
        : history.slice(0, 20),
    [history, selected]
  );

  function selectWork(id: string) {
    router.push(
      `/jag/work?org=${encodeURIComponent(organizationId)}&work=${encodeURIComponent(id)}`
    );
  }

  function createProject() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/work/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: projectTitle,
          description: "Execution project",
          businessUnit: "Operations",
          department: "PMO",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        project?: JagProject;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create project.");
        return;
      }
      setProjectTitle("");
      if (data.project) setSelectedProjectId(data.project.id);
      router.refresh();
    });
  }

  function createWork() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title,
          description,
          projectId: selectedProjectId || null,
          businessUnit: "Operations",
          department: "Execution",
          assignee: "operator",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        workItem?: JagWorkItem;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create work item.");
        return;
      }
      setTitle("");
      setDescription("");
      if (data.workItem) selectWork(data.workItem.id);
      else router.refresh();
    });
  }

  function patch(body: Record<string, unknown>) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          workItemId: selected.id,
          ...body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to update work item.");
        return;
      }
      router.refresh();
    });
  }

  function addMilestone() {
    const projectId = selected?.projectId || selectedProjectId;
    if (!projectId) {
      setError("Select or create a project first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/work/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          projectId,
          title: `Milestone ${milestones.length + 1}`,
          description: "Execution milestone",
        }),
      });
      if (!res.ok) {
        setError("Unable to add milestone.");
        return;
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
            Work & Execution™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Connect goals, decisions, and risks to operational work for{" "}
            {organizationName}. Deterministic progress only.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) => {
              router.push(
                `/jag/work?org=${encodeURIComponent(e.target.value)}`
              );
            }}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active projects
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.activeProjects}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active work
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.activeWorkItems}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Blocked
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.blockedWork}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Overdue
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.overdueWork}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Done this week
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.completedThisWeek}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Work items ({workItems.length})
          </h2>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {workItems.length === 0 ? (
              <li className="text-sm text-slate-500">No work items yet.</li>
            ) : (
              workItems.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => selectWork(w.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      selected?.id === w.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{w.title}</span>
                      <span className="text-xs text-slate-500">
                        {w.progressPercent}%
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      <span
                        className={`rounded border px-1.5 py-0.5 ${statusClass(w.status)}`}
                      >
                        {w.status}
                      </span>
                      <span className="rounded border border-slate-200 px-1.5 py-0.5 text-slate-600">
                        {w.type}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Selected work
          </h2>
          {selected ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-lg font-semibold text-slate-900">
                {selected.title}
              </p>
              <p className="text-slate-600">{selected.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Assignee</dt>
                  <dd>{selected.assignee ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Project</dt>
                  <dd className="truncate">{selected.projectId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Twin</dt>
                  <dd className="truncate">{selected.twinEntityId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Goal / Decision / Risk</dt>
                  <dd className="truncate">
                    {[
                      selected.relatedGoalId ? "G" : null,
                      selected.relatedDecisionId ? "D" : null,
                      selected.relatedRiskId ? "R" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Due</dt>
                  <dd>{selected.dueDate ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Effort</dt>
                  <dd>
                    {selected.actualEffort}/{selected.estimatedEffort}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {WORK_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending || selected.status === status}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                    onClick={() => patch({ status })}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                onClick={() => patch({ assignee: "lead" })}
              >
                Assign to lead
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No work selected.</p>
          )}
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create project
          </h2>
          <div className="mt-3 space-y-3">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Project title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
            <button
              type="button"
              disabled={pending || !projectTitle.trim()}
              onClick={createProject}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Create project
            </button>
            <ul className="space-y-1 text-xs text-slate-600">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    {p.title}
                  </button>{" "}
                  · {p.progressPercent}%
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create work item
          </h2>
          <div className="mt-3 space-y-3">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !title.trim() || !description.trim()}
              onClick={createWork}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Create work
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Milestones
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={addMilestone}
            className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
          >
            Add milestone
          </button>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {milestones.length === 0 ? (
              <li className="text-slate-500">No milestones.</li>
            ) : (
              milestones.map((m) => (
                <li key={m.id} className="border-b border-slate-100 pb-2">
                  <span className="font-medium">{m.title}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {m.progressPercent}%
                    {m.overdue ? " · overdue" : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Timeline
        </h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {selectedHistory.length === 0 ? (
            <li className="text-slate-500">No timeline events.</li>
          ) : (
            selectedHistory.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <span>
                  <span className="font-medium">{e.kind}</span> — {e.message}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(e.at).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
