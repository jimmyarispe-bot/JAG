import type { ConfigModuleRow } from "@/lib/configuration/types";
import { toggleModuleAction } from "@/lib/configuration/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export function ModuleMarketplacePanel({
  organizationId,
  modules,
}: {
  organizationId: string;
  modules: ConfigModuleRow[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => (
        <article key={mod.moduleKey} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase text-slate-500">{mod.category}</p>
              <h3 className="font-semibold">{mod.displayName}</h3>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                mod.status === "enabled" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {mod.status}
            </span>
          </div>
          {mod.description && <p className="mt-2 text-sm text-slate-500">{mod.description}</p>}
          {mod.dependencies.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">Requires: {mod.dependencies.join(", ")}</p>
          )}
          <ExperienceForm
            action={toggleModuleAction}
            verb="custom"
            labels={{
              idle: mod.status === "enabled" ? "Disable" : "Enable",
              loading: mod.status === "enabled" ? "Disabling…" : "Enabling…",
              success: mod.status === "enabled" ? "✓ Disabled" : "✓ Enabled",
            }}
            progressLabel={mod.status === "enabled" ? "Disabling module…" : "Enabling module…"}
            successToast={mod.status === "enabled" ? "✓ Module disabled." : "✓ Module enabled."}
            errorToast="Unable to update module."
            className="mt-4"
            buttonVariant={mod.status === "enabled" ? "secondary" : "primary"}
          >
            <input type="hidden" name="organization_id" value={organizationId} />
            <input type="hidden" name="module_key" value={mod.moduleKey} />
            <input type="hidden" name="action" value={mod.status === "enabled" ? "disable" : "enable"} />
          </ExperienceForm>
        </article>
      ))}
    </div>
  );
}
