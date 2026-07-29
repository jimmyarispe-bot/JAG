"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { getConnectorOrchestrator } from "@/lib/connectors/orchestrator";

type Dashboard = ReturnType<
  ReturnType<typeof getConnectorOrchestrator>["getDashboard"]
>;

type OrgOption = { readonly id: string; readonly name: string };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function JagConnectorOrchestrator({
  organizations,
  organizationId,
  organizationName,
  dashboard,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly dashboard: Dashboard;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runAction(action: string, connectorId?: string) {
    startTransition(async () => {
      await fetch("/api/jag-platform/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          organizationName,
          connectorId,
          action,
        }),
      });
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
            Connector Orchestrator™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Connector-agnostic scheduling, health, retries, rate limits, and
            audit. Runtimes expose capabilities — not vendor-specific logic.
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
                  `/jag/connectors/orchestrator?org=${encodeURIComponent(e.target.value)}`
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
            onClick={() => runAction("runDue")}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Run Due Jobs
          </button>
          <a
            href={`/jag/connectors?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium"
          >
            Connectors™
          </a>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Section title="Active Jobs">
          <p className="text-3xl font-semibold">{dashboard.activeJobs}</p>
        </Section>
        <Section title="Health">
          <ul className="space-y-1 text-sm">
            {Object.entries(dashboard.health).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Metrics">
          <ul className="space-y-1 text-xs text-slate-700">
            <li>Syncs: {dashboard.metrics.syncCount}</li>
            <li>Records: {dashboard.metrics.recordsImported}</li>
            <li>Evidence: {dashboard.metrics.evidenceCreated}</li>
            <li>Failures: {dashboard.metrics.failures}</li>
            <li>Retries: {dashboard.metrics.retries}</li>
            <li>Avg ms: {dashboard.metrics.averageSyncDurationMs}</li>
          </ul>
        </Section>
        <Section title="Queue">
          <p className="text-3xl font-semibold">{dashboard.queue.length}</p>
          <p className="text-xs text-slate-500">
            Retry queue: {dashboard.retryQueue.length}
          </p>
        </Section>
      </div>

      <Section title="Installed / Registry">
        {dashboard.registry.length === 0 ? (
          <p className="text-sm text-slate-500">
            No connectors installed. Connect from Connectors™, then orchestrate
            here.
          </p>
        ) : (
          <ul className="space-y-2">
            {dashboard.registry.map((r) => (
              <li
                key={r.installationId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{r.connectorId}</p>
                  <p className="text-xs text-slate-500">
                    {r.health} · {r.schedule} · {r.priority} · OAuth{" "}
                    {r.oauthState} · Refresh {r.refreshTokenStatus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => runAction("validate", r.connectorId)}
                  >
                    Validate
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => runAction("sync", r.connectorId)}
                  >
                    Sync
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => runAction("refresh", r.connectorId)}
                  >
                    Refresh
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Catalog">
          <ul className="max-h-80 space-y-1 overflow-y-auto text-xs">
            {dashboard.catalog.map((c) => (
              <li
                key={c.id}
                className="flex justify-between gap-2 border-b border-slate-50 py-1"
              >
                <span>
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-slate-500">
                    · {c.category} · {c.vendor}
                  </span>
                </span>
                <span className="text-slate-600">{c.status}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Rate Limits">
          {dashboard.rateLimits.length === 0 ? (
            <p className="text-sm text-slate-500">No rate-limit state yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.rateLimits.map((r) => (
                <li key={`${r.organizationId}-${r.connectorId}`}>
                  <span className="font-medium">{r.connectorId}</span> —{" "}
                  {r.remaining}/{r.providerQuota} remaining · resets{" "}
                  {new Date(r.resetAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Audit History">
        {dashboard.audit.length === 0 ? (
          <p className="text-sm text-slate-500">No orchestrator events yet.</p>
        ) : (
          <ol className="max-h-72 space-y-2 overflow-y-auto">
            {dashboard.audit.slice(0, 40).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {e.kind} · {e.connectorId}
                  </p>
                  <p className="text-xs text-slate-500">{e.message}</p>
                </div>
                <time className="text-xs text-slate-500">
                  {new Date(e.at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
