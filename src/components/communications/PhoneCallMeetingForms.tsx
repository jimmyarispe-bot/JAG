"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logMeetingAction, logPhoneCallAction } from "@/lib/communications/actions";

interface LogFormsProps {
  schoolId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
}

export function PhoneCallMeetingForms({ schoolId, studentId, familyId }: LogFormsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await logPhoneCallAction(fd);
            setMessage("error" in result && result.error ? result.error : "Phone call logged.");
            if (!("error" in result && result.error)) {
              e.currentTarget.reset();
              router.refresh();
            }
          });
        }}
      >
        <h3 className="text-sm font-semibold">Log phone call</h3>
        <input type="hidden" name="school_id" value={schoolId ?? ""} />
        <input type="hidden" name="student_id" value={studentId ?? ""} />
        <input type="hidden" name="family_id" value={familyId ?? ""} />
        <select name="direction" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="outbound">Outgoing</option>
          <option value="inbound">Incoming</option>
        </select>
        <input
          name="duration_seconds"
          type="number"
          min={0}
          placeholder="Duration (seconds)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="outcome"
          placeholder="Outcome"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="notes"
          rows={3}
          placeholder="Notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="follow_up_required" value="true" />
          Follow-up required
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Save call
        </button>
      </form>

      <form
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await logMeetingAction(fd);
            setMessage("error" in result && result.error ? result.error : "Meeting logged.");
            if (!("error" in result && result.error)) {
              e.currentTarget.reset();
              router.refresh();
            }
          });
        }}
      >
        <h3 className="text-sm font-semibold">Log meeting</h3>
        <input type="hidden" name="school_id" value={schoolId ?? ""} />
        <input type="hidden" name="student_id" value={studentId ?? ""} />
        <input type="hidden" name="family_id" value={familyId ?? ""} />
        <input
          name="title"
          required
          placeholder="Meeting title"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="meeting_type"
          defaultValue="parent_conference"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="parent_conference">Parent conference</option>
          <option value="iep">IEP meeting</option>
          <option value="scholarship">Scholarship meeting</option>
          <option value="staff">Staff meeting</option>
          <option value="other">Other</option>
        </select>
        <input
          name="participants"
          placeholder="Participants (comma-separated)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="decisions"
          rows={2}
          placeholder="Decisions"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="action_items"
          rows={2}
          placeholder="Action items (one per line)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Save meeting
        </button>
      </form>

      {message && <p className="text-sm text-slate-600 lg:col-span-2">{message}</p>}
    </div>
  );
}
