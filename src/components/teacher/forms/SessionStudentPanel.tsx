"use client";

import { takeSessionAttendanceAction, updateSessionStudentRecordAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass } from "./shared";

export function SessionStudentPanel({
  sessionId,
  studentId,
  studentName,
  attendanceStatus,
  record,
}: {
  sessionId: string;
  studentId: string;
  studentName: string;
  attendanceStatus: string;
  record?: {
    participation_level?: string | null;
    behavior_observation?: string | null;
    session_notes?: string | null;
  } | null;
}) {
  const attendanceAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Attendance", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Updated",
    progressLabel: "Updating attendance…",
  });
  const recordAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Save student record" },
    successToast: "✓ Saved",
    progressLabel: "Saving student record…",
  });

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-medium text-slate-900">{studentName}</h4>
      <p className="text-xs capitalize text-slate-500">Attendance: {attendanceStatus.replace(/_/g, " ")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["present", "virtual_present", "tardy", "absent_excused", "absent_unexcused"] as const).map((status) => (
          <ActionButton
            key={status}
            type="button"
            status={attendanceAction.status}
            verb="save"
            variant="secondary"
            labels={{
              idle: status.replace(/_/g, " "),
              loading: "Updating…",
              success: "✓ Updated",
            }}
            className="!px-2 !py-1 !text-xs capitalize"
            onClick={() => {
              void attendanceAction.run(async () => {
                const fd = new FormData();
                fd.set("session_id", sessionId);
                fd.set("student_id", studentId);
                fd.set("status", status);
                const r = await takeSessionAttendanceAction(fd);
                assertActionResult(r);
                return r;
              });
            }}
          />
        ))}
      </div>

      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("session_id", sessionId);
          fd.set("student_id", studentId);
          void recordAction.run(async () => {
            const r = await updateSessionStudentRecordAction(fd);
            assertActionResult(r);
            return r;
          });
        }}
      >
        <select name="participation_level" defaultValue={record?.participation_level ?? ""} className={inputClass}>
          <option value="">Participation…</option>
          <option value="active">Active</option>
          <option value="moderate">Moderate</option>
          <option value="minimal">Minimal</option>
          <option value="absent">Absent</option>
        </select>
        <textarea
          name="behavior_observation"
          defaultValue={record?.behavior_observation ?? ""}
          placeholder="Behavior observation"
          rows={2}
          className={inputClass}
        />
        <textarea
          name="student_session_notes"
          defaultValue={record?.session_notes ?? ""}
          placeholder="Session notes for this student"
          rows={2}
          className={inputClass}
        />
        <ActionButton
          type="submit"
          status={recordAction.status}
          verb="save"
          variant="secondary"
          labels={{ idle: "Save student record" }}
          errorMessage={recordAction.errorMessage}
          className="!py-1.5"
        />
      </form>
    </article>
  );
}
