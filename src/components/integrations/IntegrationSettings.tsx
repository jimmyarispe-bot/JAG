"use client";

import type { AuthStrategy, SyncMode } from "@/lib/platform/integrations/types";
import { cn } from "@/components/workspace-design-system/utils";

export type IntegrationSettingsValue = {
  enabled: boolean;
  authStrategy: AuthStrategy;
  syncMode: SyncMode;
  scheduleCron: string;
  rateLimitPerMinute: number;
};

export function IntegrationSettings({
  value,
  onChange,
  className,
}: {
  value: IntegrationSettingsValue;
  onChange?: (next: IntegrationSettingsValue) => void;
  className?: string;
}) {
  const update = <K extends keyof IntegrationSettingsValue>(
    key: K,
    next: IntegrationSettingsValue[K]
  ) => {
    onChange?.({ ...value, [key]: next });
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Integration settings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Shared settings applied through the Integration Platform Core.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
        <span>Enabled</span>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => update("enabled", event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block text-xs text-slate-500">Auth strategy</span>
        <select
          value={value.authStrategy}
          onChange={(event) => update("authStrategy", event.target.value as AuthStrategy)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="oauth2">OAuth2</option>
          <option value="api_key">API key</option>
          <option value="service_account">Service account</option>
          <option value="jwt">JWT</option>
          <option value="basic">Basic auth</option>
        </select>
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block text-xs text-slate-500">Sync mode</span>
        <select
          value={value.syncMode}
          onChange={(event) => update("syncMode", event.target.value as SyncMode)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="manual">Manual</option>
          <option value="scheduled">Scheduled</option>
          <option value="incremental">Incremental</option>
          <option value="full">Full</option>
        </select>
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block text-xs text-slate-500">Schedule (cron)</span>
        <input
          type="text"
          value={value.scheduleCron}
          onChange={(event) => update("scheduleCron", event.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
        />
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block text-xs text-slate-500">Rate limit / minute</span>
        <input
          type="number"
          min={1}
          value={value.rateLimitPerMinute}
          onChange={(event) => update("rateLimitPerMinute", Number(event.target.value) || 1)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
