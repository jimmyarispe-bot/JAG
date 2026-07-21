"use client";

import type {
  ConnectorLifecycleState,
  ConnectorMetadata,
} from "@/lib/platform/integrations/types";
import { ConnectorStatus } from "@/components/integrations/ConnectorStatus";
import { cn } from "@/components/workspace-design-system/utils";

export function ConnectorCard({
  metadata,
  state = "disconnected",
  lastSyncAt,
  onSync,
  onConfigure,
  className,
}: {
  metadata: ConnectorMetadata;
  state?: ConnectorLifecycleState;
  lastSyncAt?: string | null;
  onSync?: () => void;
  onConfigure?: () => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{metadata.displayName}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {metadata.provider} · v{metadata.version}
          </p>
        </div>
        <ConnectorStatus state={state} />
      </div>
      {metadata.description ? (
        <p className="text-sm text-slate-600">{metadata.description}</p>
      ) : null}
      <p className="text-xs text-slate-500">
        Last sync: {lastSyncAt ?? "Never"}
      </p>
      <div className="mt-auto flex gap-2">
        {onSync ? (
          <button
            type="button"
            onClick={onSync}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Sync now
          </button>
        ) : null}
        {onConfigure ? (
          <button
            type="button"
            onClick={onConfigure}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Configure
          </button>
        ) : null}
      </div>
    </article>
  );
}
