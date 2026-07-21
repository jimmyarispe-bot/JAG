"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { installMarketplaceWorkflow } from "@/lib/platform/automation/server-actions";
import { MODULE_LABELS, type MarketplaceWorkflowTemplate, type PlatformModule } from "@/lib/platform/automation/types";

interface WorkflowMarketplacePanelProps {
  templates: MarketplaceWorkflowTemplate[];
  schools: { id: string; name: string }[];
}

export function WorkflowMarketplacePanel({ templates, schools }: WorkflowMarketplacePanelProps) {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Install as draft", loading: "Installing…", success: "✓ Installed" },
    successToast: "✓ Workflow installed as draft.",
    errorToast: "Unable to install workflow.",
    progressLabel: "Installing marketplace workflow…",
    onSuccess: () => {
      setMessage("Workflow installed as draft. Review and publish in the workflow builder.");
    },
  });

  const modules = Array.from(new Set(templates.map((t) => t.module)));
  const filtered =
    moduleFilter === "all" ? templates : templates.filter((t) => t.module === moduleFilter);

  function handleInstall(marketplaceKey: string, module: string) {
    if (module !== "admissions") {
      setMessage("Install is available for admissions templates only.");
      return;
    }
    if (!schoolId) {
      setMessage("Select a school before installing.");
      return;
    }

    void action.run(async () => {
      const result = await installMarketplaceWorkflow(marketplaceKey, schoolId);
      assertActionResult(result);
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Workflow Marketplace</h2>
        <p className="mt-1 text-sm text-slate-600">
          Reusable automation templates across platform modules. Install admissions workflows as drafts,
          then publish when ready. Other modules use the same architecture and will gain install support
          as those modules adopt the platform engine.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Module</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {MODULE_LABELS[m as PlatformModule] ?? m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Install to school</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {message}{" "}
          <Link href="/dashboard/admissions/workflows" className="font-medium underline">
            Open workflow builder
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((template) => (
          <article
            key={template.marketplace_key}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {MODULE_LABELS[template.module] ?? template.module}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">{template.name}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {template.category}
              </span>
            </div>
            {template.description && (
              <p className="mt-2 flex-1 text-sm text-slate-600">{template.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Trigger: {template.trigger_event.replace(/_/g, " ")} ·{" "}
              {template.step_definitions.length} step
              {template.step_definitions.length === 1 ? "" : "s"}
            </p>
            {template.module === "admissions" ? (
              <ActionButton
                type="button"
                status={action.status}
                verb="create"
                labels={{
                  idle: "Install as draft",
                  loading: "Installing…",
                  success: "✓ Installed",
                }}
                className="mt-4"
                errorMessage={action.errorMessage}
                onClick={() => handleInstall(template.marketplace_key, template.module)}
              />
            ) : (
              <p
                className="mt-4 text-xs text-slate-500"
                title="Marketplace install is enabled for admissions templates only"
              >
                Install unavailable for this module
              </p>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No marketplace templates match this filter.
        </p>
      )}
    </div>
  );
}
