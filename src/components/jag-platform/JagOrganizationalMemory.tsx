"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  JagMemory,
  MemoryCategory,
  MemoryDashboard,
  MemorySource,
  MemoryStatus,
  MemoryTimelineEntry,
} from "@/lib/memory";
import {
  MEMORY_CATEGORIES,
  MEMORY_SOURCES,
  MEMORY_STATUSES,
} from "@/lib/memory";

type OrgOption = { readonly id: string; readonly name: string };

function statusClass(status: MemoryStatus): string {
  if (status === "Published")
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "Validated")
    return "border-sky-200 bg-sky-50 text-sky-900";
  if (status === "Archived")
    return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function JagOrganizationalMemory({
  organizations,
  organizationId,
  organizationName,
  memories,
  dashboard,
  history,
  selectedId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly memories: readonly JagMemory[];
  readonly dashboard: MemoryDashboard;
  readonly history: readonly MemoryTimelineEntry[];
  readonly selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] =
    useState<MemoryCategory>("Lesson Learned");
  const [source, setSource] = useState<MemorySource>("Manual entry");

  const selected =
    memories.find((m) => m.id === selectedId) ?? memories[0] ?? null;

  const selectedHistory = useMemo(
    () =>
      selected
        ? history.filter((h) => h.memoryId === selected.id)
        : history.slice(0, 20),
    [history, selected]
  );

  function selectMemory(id: string) {
    router.push(
      `/jag/memory?org=${encodeURIComponent(organizationId)}&memory=${encodeURIComponent(id)}`
    );
  }

  function createMemory() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title,
          summary,
          category,
          source,
          owner: "steward",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        memory?: JagMemory;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create memory.");
        return;
      }
      setTitle("");
      setSummary("");
      if (data.memory) selectMemory(data.memory.id);
      router.refresh();
    });
  }

  function setStatus(status: MemoryStatus) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          memoryId: selected.id,
          status,
          owner: selected.owner ?? "steward",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to update status.");
        return;
      }
      router.refresh();
    });
  }

  function validateSelected() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/memory/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          memoryId: selected.id,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to validate memory.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Organizational Memory™
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Institutional knowledge for {organizationName} — lessons, policies,
            and decisions preserved without AI.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded border border-slate-300 bg-white px-2 py-1"
            value={organizationId}
            onChange={(e) =>
              router.push(
                `/jag/memory?org=${encodeURIComponent(e.target.value)}`
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
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="New (7d)" value={dashboard.summary.newMemories} />
        <Stat
          label="Recently updated"
          value={dashboard.summary.recentlyUpdated}
        />
        <Stat
          label="Pending validation"
          value={dashboard.summary.pendingValidation}
        />
        <Stat label="Published" value={dashboard.summary.published} />
        <Stat label="Archived" value={dashboard.summary.archived} />
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Capture memory
            </h2>
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="Summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as MemoryCategory)
                  }
                >
                  {MEMORY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                  value={source}
                  onChange={(e) => setSource(e.target.value as MemorySource)}
                >
                  {MEMORY_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !title.trim() || !summary.trim()}
                  onClick={createMemory}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
              Memories ({memories.length})
            </div>
            <ul className="divide-y divide-slate-100">
              {memories.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectMemory(m.id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      selected?.id === m.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <span>
                      <span className="font-medium text-slate-900">
                        {m.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {m.category} · {m.source}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusClass(m.status)}`}
                    >
                      {m.status}
                    </span>
                  </button>
                </li>
              ))}
              {memories.length === 0 ? (
                <li className="px-4 py-6 text-sm text-slate-500">
                  No memories yet.
                </li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          {selected ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {selected.summary}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd>{selected.category}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd>{selected.source}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Confidence</dt>
                  <dd>{selected.confidence}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Owner</dt>
                  <dd>{selected.owner ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">References</dt>
                  <dd>{selected.referenceCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Last reviewed</dt>
                  <dd>
                    {selected.lastReviewedAt
                      ? new Date(selected.lastReviewedAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.status === "Draft" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={validateSelected}
                    className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Validate
                  </button>
                ) : null}
                {MEMORY_STATUSES.filter((s) => s !== selected.status).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() => setStatus(s)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                    >
                      → {s}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
              Select or create a memory to inspect lifecycle and links.
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
              Timeline
            </div>
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {selectedHistory.map((h) => (
                <li key={h.id} className="px-4 py-3 text-xs text-slate-600">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-800">{h.kind}</span>
                    <span>{new Date(h.at).toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5">{h.message}</p>
                </li>
              ))}
              {selectedHistory.length === 0 ? (
                <li className="px-4 py-6 text-sm text-slate-500">
                  No timeline events.
                </li>
              ) : null}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
