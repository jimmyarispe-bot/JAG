"use client";

import { assignInterventionAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function InterventionForm({ students }: { students: StudentOption[] }) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Assign intervention", loading: "Assigning…", success: "✓ Assigned" },
    successToast: "✓ Assigned",
    progressLabel: "Assigning intervention…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void action.run(async () => {
          const r = await assignInterventionAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">Assign intervention</h3>
      <select name="student_id" className={inputClass} required>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
        ))}
      </select>
      <select name="intervention_category" className={inputClass}>
        <option value="reading">Reading</option>
        <option value="math">Math</option>
        <option value="writing">Writing</option>
        <option value="behavior">Behavior</option>
        <option value="executive_functioning">Executive functioning</option>
        <option value="attendance">Attendance</option>
        <option value="social_emotional">Social-emotional</option>
      </select>
      <input name="intervention_type" placeholder="Intervention name" className={inputClass} required />
      <input name="goal_text" placeholder="Goal" className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="frequency" placeholder="Frequency" className={inputClass} />
        <input name="duration_weeks" type="number" placeholder="Weeks" className={inputClass} />
        <input name="review_date" type="date" className={inputClass} />
      </div>
      <textarea name="notes" placeholder="Notes" rows={2} className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        labels={{ idle: "Assign intervention", loading: "Assigning…", success: "✓ Assigned" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
