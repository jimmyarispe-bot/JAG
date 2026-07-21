import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/enterprise-data/context";
import { getMappingTemplates } from "@/lib/enterprise-data/mapping-engine";
import { EdpShell } from "@/components/enterprise-data/EdpNav";
import { MappingStudioPanel } from "@/components/enterprise-data/EdpPanels";
import { saveMappingAction } from "@/lib/enterprise-data/actions";
import { DEFAULT_STUDENT_MAPPINGS } from "@/lib/enterprise-data/types";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function DataMappingsPage() {
  await requirePagePermission(["data.manage", "data.admin"]);

  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const templates = orgId ? await getMappingTemplates(supabase, orgId) : [];

  return (
    <EdpShell title="Data Mapping Studio" subtitle="Visual field mapper with templates, transformations, and validation preview">
      <MappingStudioPanel templates={templates} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Save mapping template</h2>
        <ExperienceForm
          action={saveMappingAction}
          verb="save"
          labels={{ idle: "Save template" }}
          progressLabel="Save template…"
          className="space-y-4"
        >
          <label className="block text-sm">
          Template name
          <input name="template_name" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" defaultValue="Student Default" />
          </label>
          <input type="hidden" name="import_type" value="student" />
          <input type="hidden" name="field_mappings" value={JSON.stringify(DEFAULT_STUDENT_MAPPINGS)} />
          <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_default" value="true" />
          Set as default
          </label>
        </ExperienceForm>
      </section>
    </EdpShell>
  );
}
