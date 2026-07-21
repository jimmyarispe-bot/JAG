"use client";

import { registerArtifactAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function ArtifactForm({ sessionId, students }: { sessionId?: string; students: StudentOption[] }) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Register artifact", loading: "Saving…", success: "✓ Registered" },
    successToast: "✓ Registered",
    progressLabel: "Registering artifact…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (sessionId) fd.set("session_id", sessionId);
        const studentId = fd.get("student_id") as string;
        const title = fd.get("title") as string;
        if (!fd.get("storage_path")) {
          fd.set("storage_path", `artifacts/${studentId}/${Date.now()}-${title.replace(/\s+/g, "-").toLowerCase()}`);
        }
        void action.run(async () => {
          const r = await registerArtifactAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">Register artifact</h3>
      <select name="student_id" className={inputClass} required>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
        ))}
      </select>
      <select name="artifact_type" className={inputClass}>
        <option value="photo">Photo</option>
        <option value="pdf">PDF</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
        <option value="assessment">Assessment</option>
        <option value="observation_note">Observation note</option>
        <option value="work_sample">Work sample</option>
        <option value="writing_sample">Writing sample</option>
        <option value="reading_recording">Reading recording</option>
        <option value="math_work">Math work</option>
        <option value="other">Other</option>
      </select>
      <select name="subject_domain" className={inputClass}>
        <option value="">Subject (optional)</option>
        <option value="reading">Reading</option>
        <option value="writing">Writing</option>
        <option value="math">Math</option>
        <option value="structured_literacy">Structured literacy</option>
      </select>
      <input name="title" placeholder="Title" className={inputClass} required />
      <input name="file_name" placeholder="File name" className={inputClass} />
      <input name="learning_objective" placeholder="Learning objective" className={inputClass} />
      <textarea name="description" placeholder="Description" rows={2} className={inputClass} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visible_to_parent" value="true" />
        Visible on Parent Portal
      </label>
      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Register artifact", loading: "Saving…", success: "✓ Registered" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
