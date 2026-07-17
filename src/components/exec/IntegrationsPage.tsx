"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import type { ExecIntegrationsViewModel } from "@/lib/exec/load-integrations";
import {
  pauseIntegrationAction,
  reconnectIntegrationAction,
  resumeIntegrationAction,
  syncIntegrationAction,
} from "@/app/exec/integrations/actions";

export function IntegrationsPage({ data }: { data: ExecIntegrationsViewModel }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [health, setHealth] = useState<string>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () => ["all", ...new Set(data.rows.map((r) => r.category))],
    [data.rows]
  );

  const filtered = useMemo(() => {
    return data.rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (health !== "all" && row.health !== health) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.connectorId.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [data.rows, category, health, query]);

  function run(label: string, fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn();
        setMessage(label);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Integration Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lifecycle, health, sync history, and audit for every connector
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      {message && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
          {message}
          {pending ? " …" : ""}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search connectors…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
        <select
          value={health}
          onChange={(e) => setHealth(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All health</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="degraded">Degraded</option>
          <option value="offline">Offline</option>
          <option value="auth_required">Auth required</option>
          <option value="rate_limited">Rate limited</option>
          <option value="error">Error</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <WidgetFrame
        widgetId="integrations.connected"
        title="Connected systems"
        domains={["integrations"]}
        dataMode={data.dataMode}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">System</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Health</th>
                <th className="pb-2 font-medium">Last / next sync</th>
                <th className="pb-2 font-medium">Imported</th>
                <th className="pb-2 font-medium">Errors</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.instanceId} className="border-b border-slate-100 align-top">
                  <td className="py-3">
                    <Link
                      href={`/exec/integrations/${encodeURIComponent(row.instanceId)}`}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {row.connectorId} · v{row.version ?? "?"} · {row.lifecyclePhase ?? "—"}
                      {row.placeholder ? " · placeholder" : ""}
                    </p>
                  </td>
                  <td className="py-3 capitalize text-slate-700">{row.status}</td>
                  <td className="py-3">
                    <HealthChip health={row.health} />
                  </td>
                  <td className="py-3 text-xs text-slate-600">
                    <div>{row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString() : "Never"}</div>
                    <div className="text-slate-400">
                      Next:{" "}
                      {row.nextSyncAt ? new Date(row.nextSyncAt).toLocaleString() : "—"}
                    </div>
                  </td>
                  <td className="py-3 tabular-nums text-slate-800">{row.recordsImported}</td>
                  <td className="py-3 tabular-nums text-slate-800">{row.failures}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending || row.paused}
                        onClick={() =>
                          run(
                            `Synced ${row.name}`,
                            async () => syncIntegrationAction(row.instanceId)
                          )
                        }
                        className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        Sync Now
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(`Reconnected ${row.name}`, async () =>
                            reconnectIntegrationAction(row.instanceId)
                          )
                        }
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reconnect
                      </button>
                      {row.paused ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(`Resumed ${row.name}`, async () =>
                              resumeIntegrationAction(row.instanceId)
                            )
                          }
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(`Paused ${row.name}`, async () =>
                              pauseIntegrationAction(row.instanceId)
                            )
                          }
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Pause
                        </button>
                      )}
                      <Link
                        href={`/exec/integrations/${encodeURIComponent(row.instanceId)}`}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-6 text-sm text-slate-500">No connectors match your filters.</p>
          )}
        </div>
      </WidgetFrame>

      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetFrame
          widgetId="integrations.sync.history"
          title="Sync history"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.recentSyncs.length === 0 && (
              <li className="text-slate-500">No syncs yet</li>
            )}
            {data.recentSyncs.map((s) => (
              <li key={s.jobId} className="border-b border-slate-100 pb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-slate-800">{s.connectorId}</span>
                  <span className="text-xs capitalize text-slate-500">{s.status}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {s.durationMs}ms · {s.recordsAccepted} imported · retries {s.retryAttempts ?? 0}
                </p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.audit"
          title="Audit"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.recentAudit.length === 0 && (
              <li className="text-slate-500">No audit events</li>
            )}
            {data.recentAudit.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-2">
                <p className="font-medium text-slate-800">{a.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">
                  {a.connectorId} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.events"
          title="Notifications / events"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.recentEvents.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span>
                  <span className="font-medium text-slate-800">{e.type}</span>
                  {e.connectorId && (
                    <span className="ml-2 text-xs text-slate-500">{e.connectorId}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(e.occurredAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </WidgetFrame>
      </div>
    </div>
  );
}

function HealthChip({ health }: { health: string }) {
  const tone =
    health === "healthy"
      ? "bg-emerald-50 text-emerald-700"
      : health === "warning" || health === "degraded" || health === "rate_limited"
        ? "bg-amber-50 text-amber-800"
        : health === "error" ||
            health === "offline" ||
            health === "unhealthy" ||
            health === "auth_required"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {health.replaceAll("_", " ")}
    </span>
  );
}
