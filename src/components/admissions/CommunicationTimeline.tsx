"use client";

import {
  cancelQueuedCommunication,
  customizeQueuedCommunication,
  resendCommunication,
  sendManualCommunication,
} from "@/lib/admissions/communications/actions";
import type { ApplicantTimelineEntry } from "@/lib/admissions/communications/queries";
import type {
  CommunicationRecord,
  QueuedCommunication,
} from "@/lib/admissions/communications/types";
import { CHANNEL_LABELS } from "@/lib/admissions/communications/types";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface CommunicationTimelineProps {
  leadId: string;
  applicationId?: string | null;
  guardianEmail: string | null;
  timeline: ApplicantTimelineEntry[];
  communications: CommunicationRecord[];
  pendingQueue: QueuedCommunication[];
}

function channelBadge(channel?: string) {
  const colors: Record<string, string> = {
    email: "bg-blue-100 text-blue-700",
    sms: "bg-emerald-100 text-emerald-700",
    portal_notification: "bg-violet-100 text-violet-700",
    internal_note: "bg-amber-100 text-amber-700",
  };
  const label = channel ? (CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] ?? channel) : "Event";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[channel ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

function typeIcon(type: ApplicantTimelineEntry["type"]) {
  if (type === "communication") return "✉";
  if (type === "note") return "📝";
  if (type === "decision") return "⚖";
  return "→";
}

export function CommunicationTimeline({
  leadId,
  applicationId,
  guardianEmail,
  timeline,
  communications: _communications,
  pendingQueue,
}: CommunicationTimelineProps) {
  void _communications;
  const action = useActionFeedback({
    verb: "send",
    successToast: "✓ Changes saved.",
    errorToast: "Unable to complete.",
    progressLabel: "Updating communications…",
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Applicant Timeline</h3>
            <p className="mt-1 text-xs text-slate-500">
              All emails, SMS, portal notifications, notes, and stage changes
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {timeline.length === 0 && (
            <p className="text-sm text-slate-500">No activity recorded yet.</p>
          )}
          {timeline.map((entry) => (
            <div key={`${entry.type}-${entry.id}`} className="flex gap-3 border-l-2 border-slate-100 pl-4">
              <span className="text-sm" aria-hidden>{typeIcon(entry.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                  {entry.channel && channelBadge(entry.channel)}
                  {entry.deliveryStatus && (
                    <span className="text-xs text-slate-400">{entry.deliveryStatus}</span>
                  )}
                  {entry.openStatus && entry.openStatus !== "unknown" && (
                    <span className="text-xs text-slate-400">· {entry.openStatus}</span>
                  )}
                </div>
                {entry.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 line-clamp-4">{entry.body}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.sentBy ? ` · ${entry.sentBy}` : ""}
                  {entry.templateKey ? ` · ${entry.templateKey}` : ""}
                </p>
                {entry.type === "communication" && entry.channel === "email" && (
                  <form
                    className="mt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      fd.set("communication_id", entry.id);
                      fd.set("lead_id", leadId);
                      void action.run(async () => {
                        const r = await resendCommunication(fd);
                        assertActionResult(r);
                        return r;
                      });
                    }}
                  >
                    <ActionButton
                      type="submit"
                      status={action.status}
                      verb="send"
                      variant="secondary"
                      size="xs"
                      labels={{ idle: "Resend", loading: "Sending…", success: "✓ Sent" }}
                    />
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingQueue.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6">
          <h3 className="text-sm font-semibold text-slate-900">Scheduled Communications</h3>
          <div className="mt-4 space-y-3">
            {pendingQueue.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.template_key}</p>
                    <p className="text-xs text-slate-500">
                      {channelBadge(item.channel)} · {new Date(item.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                  <ActionButton
                    type="button"
                    status={action.status}
                    verb="delete"
                    variant="danger"
                    size="xs"
                    labels={{ idle: "Cancel", loading: "Cancelling…", success: "✓ Cancelled" }}
                    onClick={() => {
                      void action.run(async () => {
                        const r = await cancelQueuedCommunication(item.id, leadId);
                        assertActionResult(r);
                        return r;
                      });
                    }}
                  />
                </div>
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("queue_id", item.id);
                    fd.set("lead_id", leadId);
                    void action.run(async () => {
                      const r = await customizeQueuedCommunication(fd);
                      assertActionResult(r);
                      return r;
                    });
                  }}
                >
                  <input type="hidden" name="queue_id" value={item.id} />
                  <input type="hidden" name="lead_id" value={leadId} />
                  <input
                    name="subject"
                    placeholder="Custom subject (optional)"
                    defaultValue={item.custom_subject ?? ""}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="body"
                    placeholder="Custom body (optional)"
                    defaultValue={item.custom_body ?? ""}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <ActionButton
                    type="submit"
                    status={action.status}
                    verb="save"
                    labels={{ idle: "Save customization", loading: "Saving…", success: "✓ Saved" }}
                    className="!rounded-lg !px-3 !py-1.5 !text-xs"
                  />
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Send Manual Communication</h3>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void action.run(async () => {
              const r = await sendManualCommunication(fd);
              assertActionResult(r);
              return r;
            });
          }}
        >
          <input type="hidden" name="lead_id" value={leadId} />
          {applicationId && <input type="hidden" name="application_id" value={applicationId} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="channel" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="portal_notification">Portal Notification</option>
              <option value="internal_note">Internal Note</option>
            </select>
            <input
              name="sent_to"
              defaultValue={guardianEmail ?? ""}
              placeholder="Recipient"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <input
            name="subject"
            placeholder="Subject"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            placeholder="Message body — use {{student_name}}, {{parent_name}}, {{portal_link}}, etc."
            required
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <ActionButton
            type="submit"
            status={action.status}
            verb="send"
            labels={{ idle: "Send now", loading: "Sending…", success: "✓ Sent" }}
            errorMessage={action.errorMessage}
          />
        </form>
      </div>
    </div>
  );
}
