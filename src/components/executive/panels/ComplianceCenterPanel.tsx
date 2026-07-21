"use client";

import { createComplianceRequirementAction } from "@/lib/executive/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass } from "./shared";

export function ComplianceCenterPanel({
  items,
  schools,
}: {
  items: Record<string, unknown>[];
  schools: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Add", loading: "Adding…", success: "✓ Added" },
    successToast: "✓ Requirement added.",
    errorToast: "Unable to add requirement.",
    progressLabel: "Adding compliance requirement…",
  });
  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          void action.run(async () => {
            const result = await createComplianceRequirementAction(new FormData(form));
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Track requirement</h2>
        <select name="school_id" className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="requirement_type" className={inputClass}>
          <option value="accreditation">Accreditation</option>
          <option value="state_approval">State approval</option>
          <option value="special_education">Special education</option>
          <option value="financial_audit">Financial audit</option>
          <option value="hr_compliance">HR compliance</option>
          <option value="safety">Safety</option>
        </select>
        <input name="title" placeholder="Requirement title" required className={inputClass} />
        <input name="due_date" type="date" className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Add", loading: "Adding…", success: "✓ Added" }}
          errorMessage={action.errorMessage}
        />
      </form>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id as string} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>{item.title as string}</span>
            <span className="capitalize text-slate-500">
              {item.status as string} · {(item.due_date as string) ?? "—"}
            </span>
          </li>
        ))}
        {!items.length && (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-slate-500">
            No compliance requirements yet. Add one above to start tracking.
          </li>
        )}
      </ul>
    </div>
  );
}
