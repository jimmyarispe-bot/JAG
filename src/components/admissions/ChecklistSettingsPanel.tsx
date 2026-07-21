"use client";

import Link from "next/link";
import { updateChecklistTemplateItem } from "@/lib/admissions/sprint15-actions";
import type { ChecklistTemplateItem } from "@/lib/admissions/checklist";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface ChecklistSettingsPanelProps {
  schools: { id: string; name: string }[];
  selectedSchoolId: string;
  template: ChecklistTemplateItem[];
}

export function ChecklistSettingsPanel({
  schools,
  selectedSchoolId,
  template,
}: ChecklistSettingsPanelProps) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Toggle required", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Changes saved.",
    errorToast: "Unable to save.",
    progressLabel: "Updating checklist template…",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {schools.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/admissions/checklist?school=${s.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              s.id === selectedSchoolId
                ? "bg-brand-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {template.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                <td className="px-4 py-3 capitalize text-slate-500">{item.category}</td>
                <td className="px-4 py-3">{item.is_required ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{item.sort_order}</td>
                <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <ActionButton
                    type="button"
                    status={action.status}
                    verb="save"
                    variant="ghost"
                    size="xs"
                    labels={{ idle: "Toggle required", loading: "Saving…", success: "✓ Saved" }}
                    onClick={() => {
                      void action.run(async () => {
                        const fd = new FormData();
                        fd.set("id", item.id);
                        fd.set("school_id", selectedSchoolId);
                        fd.set("label", item.label);
                        fd.set("is_required", String(!item.is_required));
                        fd.set("is_active", String(item.is_active));
                        fd.set("sort_order", String(item.sort_order));
                        const result = await updateChecklistTemplateItem(fd);
                        assertActionResult(result);
                        return result;
                      });
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
