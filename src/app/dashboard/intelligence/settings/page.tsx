import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/intelligence-platform/context";
import { getOrgSettings, getModuleSettings } from "@/lib/intelligence-platform/settings";
import { getProviderDefinitions } from "@/lib/intelligence-platform/provider-abstraction";
import { AipShell } from "@/components/intelligence-platform/AipNav";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { saveSettingsAction, saveModuleSettingsAction } from "@/lib/intelligence-platform/actions";

export default async function SettingsPage() {
  await requirePagePermission(["ai.admin", "ai.manage"]);

  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const [settings, moduleSettings, providers] = orgId
    ? await Promise.all([
        getOrgSettings(supabase, orgId),
        getModuleSettings(supabase, orgId),
        getProviderDefinitions(supabase),
      ])
    : [null, [], []];

  return (
    <AipShell title="AI Settings" subtitle="Organization, school, and module-level AI configuration">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Organization settings</h2>
        <ExperienceForm
          action={saveSettingsAction}
          verb="save"
          labels={{ idle: "Save organization settings", loading: "Saving…", success: "✓ Saved" }}
          progressLabel="Saving organization settings…"
          successToast="✓ Settings saved."
          errorToast="Unable to save settings."
          className="space-y-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ai_enabled" value="true" defaultChecked={settings?.ai_enabled} />
            AI enabled (architecture ready)
          </label>
          <label className="block text-sm">
            Default provider
            <select name="default_provider_key" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2" defaultValue={settings?.default_provider_key ?? ""}>
              <option value="">None</option>
              {providers.map((p) => (
                <option key={p.provider_key} value={p.provider_key}>{p.display_name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="require_human_review" value="true" defaultChecked={settings?.require_human_review ?? true} />
            Require human review
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ferpa_masking_enabled" value="true" defaultChecked={settings?.ferpa_masking_enabled ?? true} />
            FERPA masking enabled
          </label>
        </ExperienceForm>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Module settings</h2>
        <ExperienceForm
          action={saveModuleSettingsAction}
          verb="save"
          labels={{ idle: "Save module", loading: "Saving…", success: "✓ Saved" }}
          progressLabel="Saving module settings…"
          successToast="✓ Module settings saved."
          errorToast="Unable to save module settings."
          className="flex flex-wrap items-end gap-4"
          buttonVariant="secondary"
        >
          <label className="block text-sm">
            Module
            <select name="module_key" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2">
              <option value="admissions">Admissions</option>
              <option value="finance">Finance</option>
              <option value="executive">Executive</option>
              <option value="hr">HR</option>
              <option value="ssis">SSIS</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ai_enabled" value="true" />
            Enabled
          </label>
        </ExperienceForm>
        {moduleSettings.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {moduleSettings.map((m) => (
              <li key={m.id}>{m.module_key}: {m.ai_enabled ? "enabled" : "disabled"}</li>
            ))}
          </ul>
        )}
      </section>
    </AipShell>
  );
}
