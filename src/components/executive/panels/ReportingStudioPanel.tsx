"use client";

import { saveReportTemplateAction } from "@/lib/executive/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass } from "./shared";

export function ReportingStudioPanel({
  templates,
  schools,
}: {
  templates: Record<string, unknown>[];
  schools: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save template", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Template saved.",
    errorToast: "Unable to save template.",
    progressLabel: "Saving report template…",
  });
  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          fd.set("config", JSON.stringify({ metrics: ["enrollment", "revenue", "kpis"], filters: {} }));
          void action.run(async () => {
            const result = await saveReportTemplateAction(fd);
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Save report template</h2>
        <select name="school_id" className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Report name" required className={inputClass} />
        <select name="report_type" className={inputClass}>
          <option value="board">Board</option>
          <option value="kpi">KPI</option>
          <option value="financial">Financial</option>
          <option value="enrollment">Enrollment</option>
          <option value="custom">Custom</option>
        </select>
        <ActionButton
          type="submit"
          status={action.status}
          verb="save"
          labels={{ idle: "Save template", loading: "Saving…", success: "✓ Saved" }}
          errorMessage={action.errorMessage}
        />
      </form>
      <ul className="space-y-2 text-sm">
        {templates.map((t) => (
          <li key={t.id as string} className="rounded-lg bg-slate-50 px-3 py-2">
            {t.name as string} — {t.report_type as string}
          </li>
        ))}
      </ul>
    </div>
  );
}
