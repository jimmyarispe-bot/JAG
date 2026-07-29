"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  GoalDashboard,
  GoalHealth,
  GoalTimelineEntry,
  JagGoal,
} from "@/lib/goals";
import { GOAL_TYPES } from "@/lib/goals";

type OrgOption = { readonly id: string; readonly name: string };

function healthClass(health: GoalHealth): string {
  if (health === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (health === "On Track") return "border-sky-200 bg-sky-50 text-sky-900";
  if (health === "Watch") return "border-amber-200 bg-amber-50 text-amber-900";
  if (health === "At Risk") return "border-orange-200 bg-orange-50 text-orange-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

function GoalList({
  title,
  goals,
  selectedId,
  onSelect,
}: {
  title: string;
  goals: readonly JagGoal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}{" "}
        <span className="font-normal text-slate-400">({goals.length})</span>
      </h2>
      <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {goals.length === 0 ? (
          <li className="text-sm text-slate-500">None</li>
        ) : (
          goals.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onSelect(g.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedId === g.id
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-slate-900">{g.title}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {g.progressPercent}%
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">
                  <span className={`rounded border px-1.5 py-0.5 ${healthClass(g.health)}`}>
                    {g.health}
                  </span>
                  <span className="rounded border border-slate-200 px-1.5 py-0.5 text-slate-600">
                    {g.goalType}
                  </span>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function JagGoalsStrategy({
  organizations,
  organizationId,
  organizationName,
  goals,
  dashboard,
  history,
  selectedId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly goals: readonly JagGoal[];
  readonly dashboard: GoalDashboard;
  readonly history: readonly GoalTimelineEntry[];
  readonly selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<(typeof GOAL_TYPES)[number]>(
    "Strategic Goal"
  );

  const selected =
    goals.find((g) => g.id === selectedId) ?? goals[0] ?? null;

  const selectedHistory = useMemo(
    () =>
      selected
        ? history.filter((h) => h.goalId === selected.id)
        : history.slice(0, 20),
    [history, selected]
  );

  function selectGoal(id: string) {
    router.push(
      `/jag/goals?org=${encodeURIComponent(organizationId)}&goal=${encodeURIComponent(id)}`
    );
  }

  function createGoal() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title,
          description,
          goalType,
          businessUnit: "Corporate",
          department: "Strategy",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        goal?: JagGoal;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create goal.");
        return;
      }
      setTitle("");
      setDescription("");
      if (data.goal) selectGoal(data.goal.id);
      else router.refresh();
    });
  }

  function patch(body: Record<string, unknown>) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          goalId: selected.id,
          ...body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to update goal.");
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
            Goals & Strategy™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Strategic goals, OKRs, and initiatives for {organizationName}.
            Progress and health are rule-based — no AI.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) => {
              router.push(
                `/jag/goals?org=${encodeURIComponent(e.target.value)}`
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

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.activeGoals}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Completed
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.completedGoals}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            At risk
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.goalsAtRisk}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Behind schedule
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.goalsBehindSchedule}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <GoalList
          title="Strategic Goals"
          goals={dashboard.strategicGoals}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
        <GoalList
          title="Objectives"
          goals={dashboard.objectives}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
        <GoalList
          title="Key Results"
          goals={dashboard.keyResults}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GoalList
          title="At Risk"
          goals={dashboard.atRisk}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
        <GoalList
          title="Behind Schedule"
          goals={dashboard.behindSchedule}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
        <GoalList
          title="Completed"
          goals={dashboard.completed}
          selectedId={selected?.id ?? null}
          onSelect={selectGoal}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create goal
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
              value={goalType}
              onChange={(e) =>
                setGoalType(e.target.value as (typeof GOAL_TYPES)[number])
              }
            >
              {GOAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !title.trim() || !description.trim()}
              onClick={createGoal}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Create
            </button>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Selected goal
          </h2>
          {selected ? (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <p className="text-lg font-semibold text-slate-900">
                {selected.title}
              </p>
              <p className="text-slate-600">{selected.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Type</dt>
                  <dd>{selected.goalType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Level</dt>
                  <dd>{selected.hierarchyLevel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Progress</dt>
                  <dd>{selected.progressPercent}%</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Health</dt>
                  <dd>
                    <span
                      className={`rounded border px-1.5 py-0.5 ${healthClass(selected.health)}`}
                    >
                      {selected.health}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Twin entity</dt>
                  <dd className="truncate">{selected.twinEntityId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Parent</dt>
                  <dd className="truncate">{selected.parentGoalId ?? "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={() =>
                    patch({
                      manualProgressPercent: Math.min(
                        100,
                        selected.progressPercent + 10
                      ),
                    })
                  }
                >
                  +10% progress
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={() => patch({ status: "Completed" })}
                >
                  Mark completed
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={() => patch({ status: "Archived" })}
                >
                  Archive
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No goal selected.</p>
          )}
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
                  <span className="font-medium text-slate-800">{e.kind}</span>
                  {" — "}
                  {e.message}
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
