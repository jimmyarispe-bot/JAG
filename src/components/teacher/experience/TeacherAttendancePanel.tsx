"use client";

import { useState } from "react";
import { teacherExperienceTakeAttendance } from "@/lib/teacher/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

const STATUSES = ["present", "late", "excused", "absent"] as const;

export function TeacherAttendancePanel({
  sessionId,
  organizationId,
  students,
}: {
  sessionId: string;
  organizationId: string;
  students: { id: string; name: string; status: string }[];
}) {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(students.map((s) => [s.id, s.status === "pending" ? "present" : s.status]))
  );
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "save",
    successToast: "Attendance saved",
    errorToast: "Unable to save attendance.",
    onError: (err) => setError(err.message),
  });

  function applyBulk(status: string) {
    setStatuses(Object.fromEntries(students.map((s) => [s.id, status])));
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full bg-slate-100 px-3 py-1 capitalize hover:bg-slate-200"
            onClick={() => applyBulk(s)}
          >
            Mark all {s}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {students.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span>{s.name}</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 capitalize"
              value={statuses[s.id] ?? "present"}
              onChange={(e) => setStatuses((prev) => ({ ...prev, [s.id]: e.target.value }))}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </li>
        ))}
        {!students.length && <li className="text-slate-500">No roster students for this session.</li>}
      </ul>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Comments</span>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Optional session attendance notes"
        />
      </label>
      <ActionButton
        type="button"
        status={action.status}
        verb="save"
        labels={{ idle: "Save attendance", loading: "Saving…", success: "✓ Saved" }}
        onClick={() => {
          void action.run(async () => {
            // Existing takeSessionAttendanceAction expects per-student posts; submit sequentially.
            for (const s of students) {
              const formData = new FormData();
              formData.set("session_id", sessionId);
              formData.set("student_id", s.id);
              formData.set("status", statuses[s.id] ?? "present");
              formData.set("organization_id", organizationId);
              const result = await teacherExperienceTakeAttendance(formData);
              if ("error" in result && result.error) throw new Error(result.error);
            }
            return { success: true };
          });
        }}
      />
    </div>
  );
}
