"use client";

import { useState } from "react";
import type { ConfigSectionKey } from "@/lib/configuration/types";

interface ConfigField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "color";
  placeholder?: string;
}

type SaveState = {
  ok: boolean;
  message: string;
};

export function ConfigSectionForm({
  sectionKey,
  organizationId,
  title,
  description,
  fields,
  config,
}: {
  sectionKey: ConfigSectionKey;
  organizationId: string;
  title: string;
  description?: string;
  fields: ConfigField[];
  config: Record<string, unknown>;
}) {
  const [state, setState] = useState<SaveState>({ ok: false, message: "" });
  const [pending, setPending] = useState(false);

  return (
    <form
      data-testid="config-section-form"
      method="POST"
      action="/api/configuration/section"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setPending(true);
        setState({ ok: false, message: "" });
        void fetch("/api/configuration/section", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        })
          .then(async (response) => {
            const payload = (await response.json().catch(() => null)) as SaveState | null;
            if (!payload) {
              setState({
                ok: false,
                message: response.ok ? "Configuration saved." : `Save failed (${response.status}).`,
              });
              return;
            }
            setState(payload);
          })
          .catch(() => {
            setState({ ok: false, message: "Network error while saving configuration." });
          })
          .finally(() => {
            setPending(false);
          });
      }}
    >
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="section_key" value={sectionKey} />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block text-sm sm:col-span-2">
            <span className="text-slate-600">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                name={`field_${field.name}`}
                defaultValue={String(config[field.name] ?? "")}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder={field.placeholder}
              />
            ) : (
              <input
                name={`field_${field.name}`}
                type={field.type ?? "text"}
                defaultValue={String(config[field.name] ?? "")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        data-testid="config-section-save"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save configuration"}
      </button>
    </form>
  );
}

export function ConfigJsonPreview({ config }: { config: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
      {JSON.stringify(config, null, 2)}
    </pre>
  );
}
