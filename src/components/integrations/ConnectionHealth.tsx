"use client";

import type { HealthSnapshot } from "@/lib/platform/integrations/types";
import { deriveOperationalStatus } from "@/lib/platform/integrations/core/health";
import { ConnectorStatus } from "@/components/integrations/ConnectorStatus";
import { cn } from "@/components/workspace-design-system/utils";

export function ConnectionHealth({
  health,
  className,
}: {
  health: HealthSnapshot;
  className?: string;
}) {
  const operational = deriveOperationalStatus(health);

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white/90 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Connection health
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{operational}</p>
        </div>
        <ConnectorStatus state={health.connectionStatus} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Last success</dt>
          <dd>{health.lastSuccessfulSync ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last failure</dt>
          <dd>{health.lastFailedSync ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Duration</dt>
          <dd>{health.lastSyncDurationMs != null ? `${health.lastSyncDurationMs}ms` : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Records</dt>
          <dd>{health.recordsProcessed}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Errors</dt>
          <dd>{health.errorCount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Rate limit</dt>
          <dd className="capitalize">{health.rateLimitState}</dd>
        </div>
      </dl>
      {health.message ? <p className="mt-3 text-xs text-slate-500">{health.message}</p> : null}
    </div>
  );
}
