"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import type { ComplianceObligation } from "@/lib/compliance/types";
import {
  completeObligationAction,
  createCategoryAction,
  createObligationAction,
  registerDocumentAction,
  saveEscalationRuleAction,
  saveReminderScheduleAction,
} from "@/lib/compliance/actions";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export function ObligationForm({
  schools,
  categories,
}: {
  schools: { id: string; name: string }[];
  categories: Record<string, unknown>[];
}) {
  return (
    <ExperienceForm
      action={createObligationAction}
      verb="create"
      labels={{ idle: "Create obligation" }}
      progressLabel="Creating obligation…"
      successToast="✓ Obligation created."
      errorToast="Unable to create obligation."
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
    >
      <h2 className="font-semibold">Create obligation</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="school_id" required className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="category_key" required className={inputClass}>
          {categories.map((c) => (
            <option key={c.id as string} value={c.category_key as string}>
              {c.name as string}
            </option>
          ))}
        </select>
      </div>
      <input name="title" placeholder="Title" required className={inputClass} />
      <textarea name="description" placeholder="Description" className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="due_date" type="date" required className={inputClass} />
        <select name="frequency" className={inputClass}>
          {["one_time", "monthly", "quarterly", "semiannual", "annual"].map((f) => (
            <option key={f} value={f}>
              {f.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select name="risk_level" className={inputClass}>
          {["low", "medium", "high", "critical"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </ExperienceForm>
  );
}

export function CompleteObligationButton({ obligationId }: { obligationId: string }) {
  const action = useActionFeedback({
    verb: "custom",
    labels: { idle: "Complete", loading: "Completing…", success: "✓ Done", error: "Unable to complete" },
    successToast: "✓ Obligation completed.",
    errorToast: "Unable to complete obligation.",
    progressLabel: "Completing obligation…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="custom"
      variant="success"
      size="xs"
      labels={{ idle: "Complete", loading: "Completing…", success: "✓ Done", error: "Unable to complete" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("obligation_id", obligationId);
          const result = await completeObligationAction(fd);
          assertActionResult(result);
          return result ?? { success: true };
        });
      }}
    />
  );
}

export function ObligationTable({ obligations }: { obligations: ComplianceObligation[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Due</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Risk</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {obligations.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 font-medium">{o.title}</td>
              <td className="px-4 py-3 text-slate-500">{o.compliance_categories?.name ?? "—"}</td>
              <td className="px-4 py-3">{o.due_date}</td>
              <td className="px-4 py-3 capitalize">{o.status}</td>
              <td className="px-4 py-3 capitalize">{o.risk_level}</td>
              <td className="px-4 py-3">
                {o.status !== "completed" && <CompleteObligationButton obligationId={o.id} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!obligations.length && <p className="py-8 text-center text-slate-500">No obligations in this view.</p>}
    </div>
  );
}

export function ComplianceCategoryForm() {
  return (
    <ExperienceForm
      action={createCategoryAction}
      verb="create"
      labels={{ idle: "Create" }}
      progressLabel="Creating category…"
      successToast="✓ Category created."
      errorToast="Unable to create category."
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
    >
      <h2 className="font-semibold">Add category</h2>
      <input name="name" placeholder="Category name" required className={inputClass} />
      <input name="category_key" placeholder="Unique key" required className={inputClass} />
      <select name="domain" className={inputClass}>
        {[
          "governance",
          "accreditation",
          "licensing",
          "insurance",
          "hr",
          "finance",
          "facilities",
          "technology",
          "student_services",
          "general",
        ].map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </ExperienceForm>
  );
}

export function ComplianceDocumentForm({ obligations }: { obligations: ComplianceObligation[] }) {
  return (
    <ExperienceForm
      action={registerDocumentAction}
      verb="upload"
      labels={{ idle: "Upload record" }}
      progressLabel="Registering document…"
      successToast="✓ Document registered."
      errorToast="Unable to register document."
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
    >
      <h2 className="font-semibold">Register document</h2>
      <select name="obligation_id" required className={inputClass}>
        {obligations.slice(0, 50).map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
      <select name="document_type" className={inputClass}>
        {[
          "pdf",
          "inspection_report",
          "license",
          "insurance_certificate",
          "signed_form",
          "photo",
          "spreadsheet",
        ].map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <input name="file_name" placeholder="File name" required className={inputClass} />
      <input name="storage_path" placeholder="Storage path" required className={inputClass} />
    </ExperienceForm>
  );
}

export function ComplianceAdminForms({
  reminderSchedules,
  escalationRules,
}: {
  reminderSchedules: Record<string, unknown>[];
  escalationRules: Record<string, unknown>[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ExperienceForm
        action={saveReminderScheduleAction}
        verb="save"
        progressLabel="Saving reminder schedule…"
        successToast="✓ Reminder schedule saved."
        errorToast="Unable to save schedule."
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
      >
        <h2 className="font-semibold">Reminder schedule</h2>
        <input name="name" placeholder="Schedule name" required className={inputClass} />
        <input
          name="days_before"
          placeholder="Days: 180,90,30,7,1,0"
          className={inputClass}
          defaultValue="180,120,90,60,45,30,21,14,7,3,1,0"
        />
        <ul className="text-xs text-slate-500 space-y-1">
          {reminderSchedules.map((s) => (
            <li key={s.id as string}>{s.name as string}</li>
          ))}
        </ul>
      </ExperienceForm>
      <ExperienceForm
        action={saveEscalationRuleAction}
        verb="save"
        progressLabel="Saving escalation rule…"
        successToast="✓ Escalation rule saved."
        errorToast="Unable to save rule."
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
      >
        <h2 className="font-semibold">Escalation rule</h2>
        <input name="name" placeholder="Rule name" required className={inputClass} />
        <input name="days_overdue" type="number" placeholder="Days overdue" required className={inputClass} />
        <select name="escalate_to_role" className={inputClass}>
          {["SCHOOL_LEADER", "EXECUTIVE_DIRECTOR", "CEO", "FOUNDER", "HR", "FINANCE"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <ul className="text-xs text-slate-500 space-y-1">
          {escalationRules.map((r) => (
            <li key={r.id as string}>
              {r.days_overdue as number}d → {r.escalate_to_role as string}
            </li>
          ))}
        </ul>
      </ExperienceForm>
    </div>
  );
}
