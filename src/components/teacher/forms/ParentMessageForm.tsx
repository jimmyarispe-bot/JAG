"use client";

import { sendParentMessageAction } from "@/lib/teacher/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, type StudentOption } from "./shared";

export function ParentMessageForm({ students }: { students: StudentOption[] }) {
  const action = useActionFeedback({
    verb: "send",
    labels: { idle: "Send & log to timeline", loading: "Sending…", success: "✓ Sent" },
    successToast: "✓ Sent",
    progressLabel: "Sending parent message…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void action.run(async () => {
          const r = await sendParentMessageAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold text-slate-900">Parent communication</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Student</label>
          <select name="student_id" className={inputClass} required>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Type</label>
          <select name="message_type" className={inputClass}>
            <option value="message">Message</option>
            <option value="progress_update">Progress update</option>
            <option value="conference_request">Conference request</option>
            <option value="meeting_schedule">Schedule meeting</option>
            <option value="artifact_share">Share artifact</option>
          </select>
        </div>
      </div>
      <input name="subject" placeholder="Subject" className={inputClass} required />
      <textarea name="body" placeholder="Message" rows={4} className={inputClass} required />
      <ActionButton
        type="submit"
        status={action.status}
        verb="send"
        labels={{ idle: "Send & log to timeline", loading: "Sending…", success: "✓ Sent" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
