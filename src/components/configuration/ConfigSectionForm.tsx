"use client";

import { useMemo, useState } from "react";
import type { ConfigSectionKey } from "@/lib/configuration/types";
import {
  ActionButton,
  useActionFeedback,
  useDirtyForm,
  useUnsavedChangesGuard,
} from "@/components/experience-system";

interface ConfigField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "color";
  placeholder?: string;
}

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
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(fields.map((field) => [field.name, String(config[field.name] ?? "")]))
      ),
    [config, fields]
  );

  const { isDirty, setCurrent, markClean } = useDirtyForm(initialSnapshot);
  const { guardDialog } = useUnsavedChangesGuard(isDirty);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, String(config[field.name] ?? "")]))
  );

  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save configuration" },
    successToast: "✓ Changes saved.",
    errorToast: "Unable to save.",
    progressLabel: `Saving ${title}…`,
  });

  function updateField(name: string, value: string) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      setCurrent(JSON.stringify(next));
      return next;
    });
  }

  return (
    <>
      {guardDialog}
      <form
        data-testid="config-section-form"
        method="POST"
        action="/api/configuration/section"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          void action.run(async () => {
            const response = await fetch("/api/configuration/section", {
              method: "POST",
              body: formData,
              credentials: "same-origin",
            });
            const payload = (await response.json().catch(() => null)) as {
              ok?: boolean;
              message?: string;
            } | null;

            if (!response.ok || payload?.ok === false) {
              throw new Error(
                payload?.message || `Save failed (${response.status}). Please try again.`
              );
            }

            markClean(JSON.stringify(values));
            return payload;
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
                  value={values[field.name] ?? ""}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder={field.placeholder}
                  onChange={(e) => updateField(field.name, e.target.value)}
                />
              ) : (
                <input
                  name={`field_${field.name}`}
                  type={field.type ?? "text"}
                  value={values[field.name] ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder={field.placeholder}
                  onChange={(e) => updateField(field.name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <ActionButton
          type="submit"
          data-testid="config-section-save"
          verb="save"
          labels={{ idle: "Save configuration" }}
          status={action.status}
          errorMessage={action.errorMessage}
          errorHint={action.errorHint}
          disabled={!isDirty && action.status === "idle"}
        />
      </form>
    </>
  );
}

export function ConfigJsonPreview({ config }: { config: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
      {JSON.stringify(config, null, 2)}
    </pre>
  );
}
