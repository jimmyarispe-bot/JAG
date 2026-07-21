"use client";

import { useState } from "react";
import { recordProgressAction, recordStructuredLiteracyAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function ProgressRecordForm({ students, sessionId }: { students: StudentOption[]; sessionId?: string }) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const progressAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Record progress", loading: "Recording…", success: "✓ Recorded" },
    successToast: "✓ Recorded",
    progressLabel: "Recording progress…",
  });
  const literacyAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Record SL progress", loading: "Recording…", success: "✓ Recorded" },
    successToast: "✓ Recorded",
    progressLabel: "Recording structured literacy…",
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (sessionId) fd.set("session_id", sessionId);
          void progressAction.run(async () => {
            const r = await recordProgressAction(fd);
            assertActionResult(r);
            return r;
          });
        }}
      >
        <h3 className="font-semibold text-slate-900">Academic progress</h3>
        <select name="student_id" className={inputClass} required>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
          ))}
        </select>
        <select name="domain" className={inputClass}>
          <option value="reading">Reading (levels 1–3)</option>
          <option value="writing">Writing (levels 1–3)</option>
          <option value="math">Mathematics (levels 1–3)</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="current_level" type="number" min={1} max={3} placeholder="Current level" className={inputClass} required />
          <input name="previous_level" type="number" min={1} max={3} placeholder="Previous level" className={inputClass} />
        </div>
        <textarea name="teacher_notes" placeholder="Teacher notes" rows={2} className={inputClass} />
        <ActionButton
          type="submit"
          status={progressAction.status}
          verb="save"
          labels={{ idle: "Record progress", loading: "Recording…", success: "✓ Recorded" }}
          errorMessage={progressAction.errorMessage}
        />
      </form>

      <form
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (sessionId) fd.set("session_id", sessionId);
          void literacyAction.run(async () => {
            const r = await recordStructuredLiteracyAction(fd);
            assertActionResult(r);
            if ("recommendation" in r && r.recommendation) setRecommendation(r.recommendation as string);
            return r;
          });
        }}
      >
        <h3 className="font-semibold text-slate-900">Structured Literacy</h3>
        <select name="student_id" className={inputClass} required>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="literacy_level" type="number" min={1} max={5} placeholder="Level" className={inputClass} required />
          <input name="literacy_step" type="number" min={1} max={10} placeholder="Step" className={inputClass} required />
        </div>
        <input name="instructional_minutes" type="number" placeholder="Minutes" className={inputClass} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mastery_recorded" value="true" />
          Mastery recorded — suggest next step
        </label>
        <textarea name="teacher_notes" placeholder="Notes" rows={2} className={inputClass} />
        <ActionButton
          type="submit"
          status={literacyAction.status}
          verb="save"
          labels={{ idle: "Record SL progress", loading: "Recording…", success: "✓ Recorded" }}
          errorMessage={literacyAction.errorMessage}
        />
        {recommendation && <p className="text-sm text-brand-600">{recommendation}</p>}
      </form>
    </div>
  );
}
