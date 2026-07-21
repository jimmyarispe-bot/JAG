"use client";

import Link from "next/link";
import { useState } from "react";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import type { ExecIntegrationDetailViewModel } from "@/lib/exec/load-integrations";
import {
  pauseIntegrationAction,
  reconnectIntegrationAction,
  resumeIntegrationAction,
  retryIntegrationAction,
  syncIntegrationAction,
} from "@/app/exec/integrations/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

export function IntegrationDetailPage({ data }: { data: ExecIntegrationDetailViewModel }) {
  const [message, setMessage] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "sync",
    successToast: "✓ Integration updated.",
    errorToast: "Unable to update integration.",
    progressLabel: "Syncing integration…",
    onError: (err) => setMessage(err.message),
  });

  function run(label: string, fn: () => Promise<unknown>) {
    setMessage(null);
    void action.run(async () => {
      await fn();
      setMessage(label);
      return { success: true };
    });
  }

  const { row, config, metadata, health, lifecycle, schedule, auth } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/exec/integrations" className="text-sm text-slate-500 hover:text-brand-700">
            ← Integrations
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{row.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {row.connectorId} · instance {row.instanceId}
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      {message && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
          {message}
          {action.isBusy ? " …" : ""}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton
          type="button"
          status={action.status}
          verb="sync"
          labels={{ idle: "Sync Now", loading: "Syncing…", success: "✓ Synced" }}
          disabled={row.paused}
          className="!rounded-lg !px-3 !py-1.5 !text-sm"
          onClick={() => run("Sync completed", async () => syncIntegrationAction(row.instanceId))}
        />
        <ActionButton
          type="button"
          status={action.status}
          verb="custom"
          variant="secondary"
          labels={{ idle: "Reconnect", loading: "Connecting…", success: "✓ Connected", error: "Unable to connect" }}
          className="!rounded-lg !px-3 !py-1.5 !text-sm"
          onClick={() =>
            run("Reconnected", async () => reconnectIntegrationAction(row.instanceId))
          }
        />
        <ActionButton
          type="button"
          status={action.status}
          verb="custom"
          variant="secondary"
          labels={{
            idle: row.paused ? "Resume" : "Pause",
            loading: row.paused ? "Resuming…" : "Pausing…",
            success: row.paused ? "✓ Resumed" : "✓ Paused",
            error: "Unable to update",
          }}
          className="!rounded-lg !px-3 !py-1.5 !text-sm"
          onClick={() =>
            run(
              row.paused ? "Resumed" : "Paused",
              async () =>
                row.paused
                  ? resumeIntegrationAction(row.instanceId)
                  : pauseIntegrationAction(row.instanceId)
            )
          }
        />
        <ActionButton
          type="button"
          status={action.status}
          verb="run"
          variant="secondary"
          labels={{ idle: "Retry Recovery", loading: "Retrying…", success: "✓ Retried" }}
          className="!rounded-lg !px-3 !py-1.5 !text-sm"
          errorMessage={action.errorMessage}
          onClick={() => run("Retry recovery", async () => retryIntegrationAction(row.instanceId))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame
          widgetId="integrations.detail.config"
          title="Configuration"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Auth method</dt>
              <dd className="font-medium text-slate-900">{config.authMethod}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Strategy</dt>
              <dd className="font-medium text-slate-900">{config.syncStrategy ?? "scheduled"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Schedule</dt>
              <dd className="font-medium text-slate-900">{config.scheduleCron ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Rate limit / min</dt>
              <dd className="font-medium text-slate-900">{config.rateLimitPerMinute ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Lifecycle</dt>
              <dd className="font-medium capitalize text-slate-900">
                {lifecycle?.phase?.replaceAll("_", " ") ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Enabled</dt>
              <dd className="font-medium text-slate-900">
                {config.enabled ? "Yes" : "No"}
                {config.paused ? " (paused)" : ""}
              </dd>
            </div>
          </dl>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.detail.auth"
          title="Authentication & API status"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Credentials</dt>
              <dd className="font-medium text-slate-900">
                {auth.present ? "Present" : "Missing"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Method</dt>
              <dd className="font-medium text-slate-900">{auth.authMethod ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Expires</dt>
              <dd className="font-medium text-slate-900">
                {auth.expiresAt ? new Date(auth.expiresAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Refresh token</dt>
              <dd className="font-medium text-slate-900">
                {auth.hasRefreshToken ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">API status</dt>
              <dd className="font-medium capitalize text-slate-900">
                {health?.apiStatus?.replaceAll("_", " ") ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Health</dt>
              <dd className="font-medium capitalize text-slate-900">
                {health?.status?.replaceAll("_", " ") ?? "—"}
              </dd>
            </div>
          </dl>
        </WidgetFrame>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetFrame
          widgetId="integrations.detail.sync"
          title="Sync schedule"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Last success: {schedule?.lastSuccessfulSyncAt ? new Date(schedule.lastSuccessfulSyncAt).toLocaleString() : "—"}</li>
            <li>Last failure: {schedule?.lastFailedSyncAt ? new Date(schedule.lastFailedSyncAt).toLocaleString() : "—"}</li>
            <li>Next sync: {schedule?.nextScheduledSyncAt ? new Date(schedule.nextScheduledSyncAt).toLocaleString() : "—"}</li>
            <li>Last duration: {schedule?.lastDurationMs ?? "—"} ms</li>
            <li>Records processed: {schedule?.lastRecordsProcessed ?? "—"}</li>
            <li>Retry count: {schedule?.retryCount ?? 0}</li>
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.detail.version"
          title="Connector metadata"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Version: {metadata?.version ?? "—"}</li>
            <li>Vendor: {metadata?.vendor ?? "—"}</li>
            <li>Category: {metadata?.category ?? "—"}</li>
            <li>Objects: {metadata?.objectTypes.join(", ") ?? "—"}</li>
            <li>Webhooks: {metadata?.supportsWebhook ? "Yes" : "No"}</li>
            <li>Incremental: {metadata?.supportsIncremental ? "Yes" : "No"}</li>
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.detail.rate"
          title="Rate limits"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Configured: {config.rateLimitPerMinute ?? "—"} / min</li>
            <li>Remaining (sample): {health?.rateLimitRemaining ?? "—"}</li>
            <li>Availability: {health?.availability != null ? `${Math.round(health.availability * 100)}%` : "—"}</li>
            <li>Latency: {health?.latencyMs ?? "—"} ms</li>
          </ul>
        </WidgetFrame>
      </div>

      <WidgetFrame
        widgetId="integrations.detail.sync.history"
        title="Sync history"
        domains={["integrations"]}
        dataMode={data.dataMode}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Mode</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Imported</th>
                <th className="pb-2 font-medium">Failures</th>
                <th className="pb-2 font-medium">Retries</th>
              </tr>
            </thead>
            <tbody>
              {data.syncHistory.map((s) => (
                <tr key={s.jobId} className="border-b border-slate-100">
                  <td className="py-2 text-xs text-slate-600">
                    {new Date(s.finishedAt).toLocaleString()}
                  </td>
                  <td className="py-2">{s.mode}</td>
                  <td className="py-2 capitalize">{s.status}</td>
                  <td className="py-2 tabular-nums">{s.durationMs}ms</td>
                  <td className="py-2 tabular-nums">{s.recordsAccepted}</td>
                  <td className="py-2 tabular-nums">{s.recordsRejected}</td>
                  <td className="py-2 tabular-nums">{s.retryAttempts ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetFrame>

      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetFrame
          widgetId="integrations.detail.health.history"
          title="Health history"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.healthHistory.map((h) => (
              <li key={h.id} className="border-b border-slate-100 pb-2">
                <p className="font-medium capitalize text-slate-800">
                  {h.status.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-slate-500">
                  {h.detail} · {new Date(h.recordedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.detail.retries"
          title="Retry history"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.retryHistory.length === 0 && (
              <li className="text-slate-500">No retries</li>
            )}
            {data.retryHistory.map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-2">
                <p className="font-medium text-slate-800">
                  Attempt {r.attempt}/{r.maxAttempts} · {r.outcome}
                </p>
                <p className="text-xs text-slate-500">{r.reason}</p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="integrations.detail.audit"
          title="Audit"
          domains={["integrations"]}
          dataMode={data.dataMode}
        >
          <ul className="space-y-2 text-sm">
            {data.audit.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-2">
                <p className="font-medium text-slate-800">{a.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">
                  {a.actor} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </WidgetFrame>
      </div>
    </div>
  );
}
