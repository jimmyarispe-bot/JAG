"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GoogleWorkspaceConnectionStatus } from "@/lib/platform/integrations/connections";
import { cn } from "@/components/workspace-design-system/utils";

function ConnectedBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-300/60">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
      Disconnected
    </span>
  );
}

function HealthBadge({
  health,
  label,
}: {
  health: GoogleWorkspaceConnectionStatus["health"];
  label: string;
}) {
  const styles: Record<GoogleWorkspaceConnectionStatus["health"], string> = {
    healthy: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-900",
    error: "bg-rose-50 text-rose-800",
    disconnected: "bg-slate-50 text-slate-500",
    unknown: "bg-slate-50 text-slate-500",
  };
  const emoji: Record<GoogleWorkspaceConnectionStatus["health"], string> = {
    healthy: "🟢",
    warning: "🟡",
    error: "🔴",
    disconnected: "⚪",
    unknown: "⚪",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        styles[health]
      )}
    >
      <span aria-hidden>{emoji[health]}</span>
      {label}
    </span>
  );
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export function GoogleWorkspaceCard({
  initialStatus,
  className,
}: {
  initialStatus: GoogleWorkspaceConnectionStatus;
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/integrations/google/status", { cache: "no-store" });
    const json = (await res.json()) as {
      ok?: boolean;
      status?: GoogleWorkspaceConnectionStatus;
    };
    if (json.ok && json.status) setStatus(json.status);
  }, []);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  function connect() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/integrations/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        authorizeUrl?: string;
        message?: string;
        status?: GoogleWorkspaceConnectionStatus;
        demo?: boolean;
      };
      if (!res.ok || !json.ok) {
        setError(json.message || "Failed to start Google connect.");
        return;
      }
      if (json.authorizeUrl) {
        window.location.href = json.authorizeUrl;
        return;
      }
      if (json.status) setStatus(json.status);
      setMessage(json.message || "Google Workspace connected.");
      router.refresh();
    });
  }

  function disconnect() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        status?: GoogleWorkspaceConnectionStatus;
      };
      if (!res.ok || !json.ok) {
        setError(json.message || "Failed to disconnect.");
        return;
      }
      if (json.status) setStatus(json.status);
      setMessage(json.message || "Disconnected.");
      router.refresh();
      await refresh();
    });
  }

  function syncNow() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/integrations/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual", forceFull: true }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        status?: GoogleWorkspaceConnectionStatus;
      };
      if (json.status) setStatus(json.status);
      if (!res.ok || !json.ok) {
        setError(json.message || "Sync failed.");
        return;
      }
      setMessage(json.message || "Sync completed.");
      router.refresh();
    });
  }

  const syncing = status.currentSyncStatus === "running" || pending;

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Google Workspace
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Google Workspace
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Connect your Google Workspace tenant so JAG can sync Gmail metadata,
            Calendar, Drive, and Directory — metadata only by default.
          </p>
        </div>
        <ConnectedBadge connected={status.connected} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Status</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-slate-900">
            {status.status}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Current Sync Status</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-slate-900">
            {status.currentSyncStatus}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Health</dt>
          <dd className="mt-1">
            <HealthBadge health={status.health} label={status.healthLabel} />
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Last Sync</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {formatWhen(status.lastSyncAt)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Records Imported</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {status.recordsImported.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Sync Duration</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {formatDuration(status.lastSyncDurationMs)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Next Scheduled Sync</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {status.nextScheduledSyncAt
              ? formatWhen(status.nextScheduledSyncAt)
              : status.connected
                ? "After first sync"
                : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Next Full Sync</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {status.nextFullSyncAt ? formatWhen(status.nextFullSyncAt) : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
          <dt className="text-xs font-medium text-slate-500">Provider Version</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {status.providerVersion ?? "—"}
          </dd>
        </div>
      </dl>

      {status.errorDetails ? (
        <div
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800"
          role="alert"
        >
          <p className="font-medium">Error Details</p>
          <p className="mt-1 whitespace-pre-wrap">{status.errorDetails}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {status.connected ? (
          <>
            <button
              type="button"
              onClick={syncNow}
              disabled={syncing}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {status.currentSyncStatus === "running" || pending
                ? "Syncing…"
                : "Sync Now"}
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={pending}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={pending}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {pending ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
