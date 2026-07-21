"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { ActionChip, ActionChipGroup } from "@/components/experience-system/feedback/ActionChip";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { saveSchoolBrandingAction } from "@/lib/platform/identity/server-actions";

interface SchoolConfigPanelProps {
  schools: Array<{ id: string; name: string }>;
  selectedSchoolId: string;
  branding: {
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
  } | null;
  settingsConfig: Record<string, unknown>;
}

export function SchoolConfigPanel({
  schools,
  selectedSchoolId,
  branding,
  settingsConfig,
}: SchoolConfigPanelProps) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save branding" },
    successToast: "✓ Changes saved.",
    errorToast: "Unable to save.",
    progressLabel: "Saving branding…",
  });

  return (
    <div className="space-y-6">
      <ActionChipGroup>
        {schools.map((s) => (
          <ActionChip
            key={s.id}
            href={`/dashboard/admin/schools?school=${s.id}`}
            size="sm"
            variant={s.id === selectedSchoolId ? "primary" : "secondary"}
          >
            {s.name}
          </ActionChip>
        ))}
      </ActionChipGroup>

      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void action.run(async () => {
            const result = await saveSchoolBrandingAction(fd);
            assertActionResult(result);
            return result ?? { success: true };
          });
        }}
      >
        <input type="hidden" name="school_id" value={selectedSchoolId} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Branding</h3>
          <label className="block text-sm">
            <span className="text-slate-600">Logo URL</span>
            <input
              name="logo_url"
              defaultValue={branding?.logo_url ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["primary_color", "secondary_color", "accent_color"] as const).map((field) => (
              <label key={field} className="block text-sm">
                <span className="capitalize text-slate-600">{field.replace("_", " ")}</span>
                <input
                  name={field}
                  type="color"
                  defaultValue={branding?.[field] ?? "#4F46E5"}
                  className="mt-1 h-10 w-full rounded-lg border"
                />
              </label>
            ))}
          </div>
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            labels={{ idle: "Save branding" }}
            errorMessage={action.errorMessage}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Configuration modules</h3>
          <p className="mt-1 text-sm text-slate-500">
            Admissions workflows, document requirements, funding programs, and automation templates
            are configured in their module settings. This panel centralizes branding; module admins
            manage operational config per school.
          </p>
          <ActionChipGroup className="mt-4">
            <ActionChip href="/dashboard/admissions/checklist" size="sm" variant="secondary">
              Manage checklist
            </ActionChip>
            <ActionChip href="/dashboard/admissions/workflows" size="sm" variant="secondary">
              Manage workflows
            </ActionChip>
            <ActionChip href="/dashboard/admissions/funding-programs" size="sm" variant="secondary">
              Manage funding programs
            </ActionChip>
            <ActionChip href="/dashboard/admissions/communications" size="sm" variant="secondary">
              Manage templates
            </ActionChip>
          </ActionChipGroup>
          {Object.keys(settingsConfig).length > 0 && (
            <pre className="mt-4 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {JSON.stringify(settingsConfig, null, 2)}
            </pre>
          )}
        </div>
      </form>
    </div>
  );
}
