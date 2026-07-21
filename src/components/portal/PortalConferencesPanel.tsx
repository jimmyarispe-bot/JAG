"use client";

import { requestConferenceAction, respondToMeetingAction } from "@/lib/portal/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

interface MeetingRow {
  id: string;
  title: string;
  scheduled_at: string | null;
  agenda: string | null;
  notes: string | null;
  virtual_meeting_url: string | null;
  parent_response_status: string | null;
  students?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

interface RequestRow {
  id: string;
  status: string;
  students?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

interface PortalConferencesPanelProps {
  meetings: MeetingRow[];
  requests: RequestRow[];
  students: { id: string; first_name: string; last_name: string }[];
}

function studentName(row: { students?: MeetingRow["students"] }) {
  const s = row.students;
  const r = Array.isArray(s) ? s[0] : s;
  return r ? `${r.first_name} ${r.last_name}` : "Student";
}

export function PortalConferencesPanel({ meetings, requests, students }: PortalConferencesPanelProps) {
  const action = useActionFeedback({
    verb: "submit",
    successToast: "✓ Updated",
    errorToast: "Unable to update.",
    progressLabel: "Updating conference…",
  });

  return (
    <div className="space-y-8">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          fd.set("preferred_times", JSON.stringify([fd.get("preferred_time")]));
          void action.run(async () => {
            const result = await requestConferenceAction(fd);
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Request a conference</h2>
        <select name="student_id" required className={inputClass}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
        </select>
        <input name="preferred_time" type="datetime-local" required className={inputClass} />
        <textarea name="notes" placeholder="Notes for the school" rows={3} className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit request", loading: "Submitting…", success: "✓ Submitted" }}
          errorMessage={action.errorMessage}
        />
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Scheduled meetings</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {meetings.map((m) => (
            <li key={m.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="font-medium">{m.title}</p>
              <p className="text-slate-500">{studentName(m)} · {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : "TBD"}</p>
              {m.agenda && <p className="mt-2 text-slate-600">{m.agenda}</p>}
              {m.virtual_meeting_url && (
                <div className="mt-2">
                  <ActionChip href={m.virtual_meeting_url} size="sm" variant="primary">
                    Join virtual meeting
                  </ActionChip>
                </div>
              )}
              {m.notes && <p className="mt-2 text-slate-600"><strong>Notes:</strong> {m.notes}</p>}
              {m.parent_response_status !== "accepted" && m.scheduled_at && (
                <form
                  className="mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("meeting_id", m.id);
                    fd.set("response", "accepted");
                    void action.run(async () => {
                      const result = await respondToMeetingAction(fd);
                      assertActionResult(result);
                      return result;
                    });
                  }}
                >
                  <ActionButton
                    type="submit"
                    status={action.status}
                    verb="approve"
                    variant="success"
                    size="xs"
                    labels={{ idle: "Confirm", loading: "Confirming…", success: "✓ Confirmed" }}
                  />
                </form>
              )}
            </li>
          ))}
          {!meetings.length && <li className="text-slate-500">No scheduled conferences.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Your requests</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 capitalize">
              {studentName(r)} — {r.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
