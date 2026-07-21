"use client";

import { useState } from "react";
import { saveTeacherNoteAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function TeacherNoteForm({ students }: { students: StudentOption[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save note" },
    successToast: "✓ Saved",
    progressLabel: "Saving note…",
    onError: (err) => setMsg(err.message),
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        const fd = new FormData(e.currentTarget);
        void action.run(async () => {
          const r = await saveTeacherNoteAction(fd);
          assertActionResult(r);
          setMsg("Note saved");
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">New instructional note</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Category</label>
          <select name="category" className={inputClass} required>
            <option value="academic">Academic</option>
            <option value="behavior">Behavior</option>
            <option value="parent_communication">Parent communication</option>
            <option value="intervention">Intervention</option>
            <option value="observation">Observation</option>
            <option value="planning">Planning</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Student (optional)</label>
          <select name="student_id" className={inputClass}>
            <option value="">—</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
        </div>
      </div>
      <input name="title" placeholder="Title" className={inputClass} required />
      <textarea name="body" placeholder="Note body" rows={3} className={inputClass} required />
      <input name="tags" placeholder="Tags (comma-separated)" className={inputClass} />
      <ActionButton type="submit" status={action.status} verb="save" labels={{ idle: "Save note" }} errorMessage={action.errorMessage} />
      {msg && <p className="text-xs text-slate-600">{msg}</p>}
    </form>
  );
}
