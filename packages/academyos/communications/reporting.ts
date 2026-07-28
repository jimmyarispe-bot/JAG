import { buildCommunicationsSummary } from "./dashboard";
import {
  listAnnouncements,
  listMessages,
  listNotifications,
  listThreads,
  listWorkflows,
} from "./store";

export type CommunicationsReportKind =
  | "notification_delivery"
  | "message_activity"
  | "announcement_reach"
  | "workflow_completion"
  | "communication_trends"
  | "parent_engagement"
  | "employee_engagement";

export type CommunicationsReport = {
  readonly kind: CommunicationsReportKind;
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly rows: readonly Record<string, string | number>[];
  readonly csv: string;
  readonly pdf: string;
};

function toCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function toPdf(title: string, lines: readonly string[]): string {
  const contentLines = [title, "", ...lines].map((l) =>
    l.replace(/[()\\]/g, "")
  );
  const stream =
    "BT /F1 10 Tf 50 750 Td " +
    contentLines
      .map((l, i) => (i === 0 ? `(${l}) Tj` : `0 -14 Td (${l}) Tj`))
      .join(" ") +
    " ET";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

function wrap(
  kind: CommunicationsReportKind,
  organizationId: string,
  rows: Record<string, string | number>[],
  title: string
): CommunicationsReport {
  const csv = toCsv(rows);
  const lines = rows.slice(0, 40).map((r) =>
    Object.values(r)
      .map(String)
      .join(" | ")
  );
  return {
    kind,
    organizationId,
    generatedAt: new Date().toISOString(),
    rows: Object.freeze(rows),
    csv,
    pdf: toPdf(title, lines),
  };
}

export function createCommunicationsReportingService() {
  return {
    generate(
      organizationId: string,
      kind: CommunicationsReportKind
    ): CommunicationsReport {
      const summary = buildCommunicationsSummary(organizationId);
      switch (kind) {
        case "notification_delivery":
          return wrap(
            kind,
            organizationId,
            listNotifications(organizationId).map((n) => ({
              id: n.id,
              domain: n.domain,
              eventKey: n.eventKey,
              channel: n.channel,
              status: n.status,
              recipientId: n.recipientId,
            })),
            "Notification Delivery"
          );
        case "message_activity":
          return wrap(
            kind,
            organizationId,
            listThreads(organizationId).map((t) => ({
              threadId: t.id,
              subject: t.subject,
              messages: listMessages(organizationId, t.id).length,
              secure: t.secure ? "yes" : "no",
              studentId: t.studentId ?? "",
            })),
            "Message Activity"
          );
        case "announcement_reach":
          return wrap(
            kind,
            organizationId,
            listAnnouncements(organizationId).map((a) => ({
              id: a.id,
              title: a.title,
              scope: a.scope,
              reads: a.readBy.length,
              publishedAt: a.publishedAt ?? "",
            })),
            "Announcement Reach"
          );
        case "workflow_completion":
          return wrap(
            kind,
            organizationId,
            listWorkflows(organizationId).map((w) => ({
              id: w.id,
              recipe: w.recipe,
              status: w.status,
              stepsCompleted: w.steps.filter((s) => s.status === "Completed")
                .length,
              stepsTotal: w.steps.length,
            })),
            "Workflow Completion"
          );
        case "communication_trends":
          return wrap(
            kind,
            organizationId,
            [
              {
                deliveryRate: summary.deliveryRate,
                openRate: summary.openRate,
                responseRate: summary.responseRate,
                outstandingWorkflows: summary.outstandingWorkflows,
                failedNotifications: summary.failedNotifications,
                notifications: summary.trends.notificationsCreated,
                messages: summary.trends.messagesSent,
                announcements: summary.trends.announcementsPublished,
                workflowsCompleted: summary.trends.workflowsCompleted,
              },
            ],
            "Communication Trends"
          );
        case "parent_engagement": {
          const parentNotifs = listNotifications(organizationId).filter(
            (n) => n.recipientType === "parent" || n.recipientType === "family"
          );
          const parentThreads = listThreads(organizationId).filter(
            (t) => t.participantType === "parent" || t.participantType === "family"
          );
          return wrap(
            kind,
            organizationId,
            [
              {
                notifications: parentNotifs.length,
                read: parentNotifs.filter((n) => n.readAt).length,
                threads: parentThreads.length,
                messages: parentThreads.reduce(
                  (a, t) => a + listMessages(organizationId, t.id).length,
                  0
                ),
              },
            ],
            "Parent Engagement"
          );
        }
        case "employee_engagement": {
          const empNotifs = listNotifications(organizationId).filter(
            (n) =>
              n.recipientType === "employee" || n.recipientType === "staff"
          );
          const empThreads = listThreads(organizationId).filter(
            (t) =>
              t.participantType === "employee" || t.participantType === "staff"
          );
          return wrap(
            kind,
            organizationId,
            [
              {
                notifications: empNotifs.length,
                read: empNotifs.filter((n) => n.readAt).length,
                threads: empThreads.length,
                messages: empThreads.reduce(
                  (a, t) => a + listMessages(organizationId, t.id).length,
                  0
                ),
              },
            ],
            "Employee Engagement"
          );
        }
        default:
          return wrap(kind, organizationId, [], "Communications Report");
      }
    },
  };
}
