"use client";

import type { ConnectorMetadata } from "@/lib/platform/integrations/types";
import { cn } from "@/components/workspace-design-system/utils";

export function InstallConnectorDialog({
  open,
  catalog,
  onClose,
  onInstall,
  className,
}: {
  open: boolean;
  catalog: readonly ConnectorMetadata[];
  onClose: () => void;
  onInstall: (connectorId: string) => void;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-connector-title"
    >
      <div
        className={cn(
          "max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="install-connector-title" className="text-base font-semibold text-slate-900">
              Install connector
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a connector from the platform registry. All connectors share the same
              lifecycle, auth, sync, and normalization framework.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {catalog.map((connector) => (
            <li
              key={connector.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{connector.displayName}</p>
                <p className="text-xs text-slate-500">
                  {connector.provider} · v{connector.version}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInstall(connector.id)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Install
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
