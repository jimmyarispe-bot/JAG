"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TwinEntity,
  TwinExplorerView,
  TwinRelationship,
  TwinTimelineItem,
} from "@/lib/digital-twin";

type OrgOption = { readonly id: string; readonly name: string };

function EntityList({
  title,
  entities,
  selectedId,
  onSelect,
}: {
  title: string;
  entities: readonly TwinEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({entities.length})
      </h3>
      {entities.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">None</p>
      ) : (
        <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
          {entities.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect(e.id)}
                className={`w-full rounded border px-2 py-1 text-left text-xs ${
                  selectedId === e.id
                    ? "border-slate-400 bg-slate-100"
                    : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <span className="font-medium text-slate-900">{e.label}</span>
                <span className="mt-0.5 block text-slate-500">
                  {e.entityType}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JagTwinExplorer({
  organizations,
  organizationId,
  view,
  timeline,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly view: TwinExplorerView;
  readonly timeline: readonly TwinTimelineItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    view.organizations[0]?.id ?? null
  );

  const allEntities = useMemo(() => {
    const map = new Map<string, TwinEntity>();
    for (const group of [
      view.organizations,
      view.people,
      view.teams,
      view.assets,
      view.decisions,
      view.documents,
      view.products,
    ]) {
      for (const e of group) map.set(e.id, e);
    }
    return map;
  }, [view]);

  const selected = selectedId ? allEntities.get(selectedId) ?? null : null;

  const related = useMemo(() => {
    if (!selected) return [] as TwinRelationship[];
    return view.relationships.filter(
      (r) =>
        r.fromTwinId === selected.id || r.toTwinId === selected.id
    );
  }, [selected, view.relationships]);

  const filteredSearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...allEntities.values()]
      .filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.entityType.toLowerCase().includes(q) ||
          e.externalKey.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allEntities, query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Digital Twin™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Canonical organizational model for people, teams, assets,
            decisions, evidence, and connectors — mirrored into the Knowledge
            Graph™. No AI, simulations, or predictive modeling.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) =>
              router.push(
                `/jag/twin?org=${encodeURIComponent(e.target.value)}`
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Twin Metrics
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Twin entities</dt>
            <dd className="text-2xl font-semibold">
              {view.metrics.entityCount}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Relationships</dt>
            <dd className="text-2xl font-semibold">
              {view.metrics.relationshipCount}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Graph nodes</dt>
            <dd className="text-2xl font-semibold">
              {view.metrics.graphNodeCount}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Graph edges</dt>
            <dd className="text-2xl font-semibold">
              {view.metrics.graphEdgeCount}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm text-slate-600">
          Search twin entities
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Person, Document, Asset, Decision…"
          />
        </label>
        {filteredSearch.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {filteredSearch.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="text-sm text-slate-800 underline"
                  onClick={() => setSelectedId(e.id)}
                >
                  {e.label} · {e.entityType}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <EntityList
            title="Organizations"
            entities={view.organizations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <EntityList
            title="People"
            entities={view.people}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <EntityList
            title="Teams"
            entities={view.teams}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <EntityList
            title="Assets / Connectors"
            entities={view.assets}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <EntityList
            title="Decisions"
            entities={view.decisions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <EntityList
            title="Evidence / Documents"
            entities={view.documents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Select an entity to inspect relationships.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-500">
                  {selected.entityType}
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selected.label}
                </h2>
                <p className="mt-1 text-slate-600">
                  {selected.description || "No description."}
                </p>
              </div>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Twin ID</dt>
                  <dd className="font-mono text-xs">{selected.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Graph node</dt>
                  <dd className="font-mono text-xs">{selected.graphNodeId}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">External key</dt>
                  <dd className="font-mono text-xs">{selected.externalKey}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  Relationships
                </h3>
                {related.length === 0 ? (
                  <p className="mt-1 text-slate-500">No relationships yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {related.map((r) => {
                      const otherId =
                        r.fromTwinId === selected.id
                          ? r.toTwinId
                          : r.fromTwinId;
                      const other = allEntities.get(otherId);
                      return (
                        <li
                          key={r.id}
                          className="rounded border border-slate-100 px-2 py-1 text-xs"
                        >
                          <button
                            type="button"
                            className="font-medium underline"
                            onClick={() => setSelectedId(otherId)}
                          >
                            {other?.label ?? otherId.slice(0, 8)}
                          </button>{" "}
                          <span className="text-slate-500">
                            · {r.relationshipType}
                            {r.graphEdgeId ? " · mirrored to KG" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Twin Timeline
        </h2>
        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No twin events yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {timeline.slice(0, 40).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.kind} · {item.detail}
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
