"use client";

import { recordSessionAssessmentAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function SessionAssessmentForm({
  sessionId,
  students,
}: {
  sessionId: string;
  students: StudentOption[];
}) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save to Academic Growth Center", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Saved",
    progressLabel: "Saving assessment…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("session_id", sessionId);
        void action.run(async () => {
          const r = await recordSessionAssessmentAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">Record assessment</h3>
      <select name="student_id" className={inputClass} required>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
        ))}
      </select>
      <select name="assessment_type" className={inputClass}>
        <option value="quick_check">Quick check</option>
        <option value="benchmark">Benchmark</option>
        <option value="map">MAP</option>
        <option value="teacher_created">Teacher-created</option>
        <option value="rubric">Rubric</option>
        <option value="mastery">Mastery</option>
      </select>
      <input name="title" placeholder="Assessment title" className={inputClass} required />
      <input name="score" placeholder="Score / result" className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        labels={{ idle: "Save to Academic Growth Center", loading: "Saving…", success: "✓ Saved" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
