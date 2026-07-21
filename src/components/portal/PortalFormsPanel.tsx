"use client";

import { submitPortalFormAction } from "@/lib/portal/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

interface PortalFormsPanelProps {
  templates: { id: string; title: string; description: string | null; form_type: string; requires_signature: boolean }[];
  submissions: { id: string; submitted_at: string; portal_form_templates?: { title: string } | { title: string }[] | null }[];
  students: { id: string; first_name: string; last_name: string; family_id: string | null }[];
}

export function PortalFormsPanel({ templates, submissions, students }: PortalFormsPanelProps) {
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Submit", loading: "Submitting…", success: "✓ Submitted" },
    successToast: "✓ Submitted",
    errorToast: "Unable to submit.",
    progressLabel: "Submitting form…",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="font-semibold">Available forms</h2>
        {templates.map((t) => (
          <form
            key={t.id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("template_id", t.id);
              fd.set("answers", JSON.stringify({ notes: fd.get("notes") }));
              void action.run(async () => {
                const result = await submitPortalFormAction(fd);
                assertActionResult(result);
                return result;
              });
            }}
          >
            <h3 className="font-medium">{t.title}</h3>
            {t.description && <p className="text-sm text-slate-600">{t.description}</p>}
            <select name="student_id" className={inputClass}>
              <option value="">Family-wide</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <input type="hidden" name="family_id" value={students[0]?.family_id ?? ""} />
            <textarea name="notes" placeholder="Your responses" rows={3} className={inputClass} required />
            {t.requires_signature && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" required />
                I agree and electronically sign this form
              </label>
            )}
            <ActionButton
              type="submit"
              status={action.status}
              verb="submit"
              labels={{ idle: "Submit", loading: "Submitting…", success: "✓ Submitted" }}
              errorMessage={action.errorMessage}
            />
          </form>
        ))}
      </section>
      <section>
        <h2 className="font-semibold">Submitted</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {submissions.map((s) => {
            const tmpl = Array.isArray(s.portal_form_templates) ? s.portal_form_templates[0] : s.portal_form_templates;
            return (
              <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {tmpl?.title ?? "Form"} — {new Date(s.submitted_at).toLocaleDateString()}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
