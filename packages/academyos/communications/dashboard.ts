import {
  listAnnouncements,
  listMessages,
  listNotifications,
  listWorkflows,
} from "./store";
import type { CommunicationsSummary } from "./types";

export function buildCommunicationsSummary(
  organizationId: string
): CommunicationsSummary {
  const notifications = listNotifications(organizationId);
  const deliveredOrBetter = notifications.filter((n) =>
    ["Sent", "Delivered", "Read"].includes(n.status)
  );
  const failed = notifications.filter((n) => n.status === "Failed");
  const read = notifications.filter((n) => n.status === "Read" || n.readAt);
  const messages = listMessages(organizationId);
  const respondedThreads = new Set(
    messages.filter((m) => m.senderType !== "system").map((m) => m.threadId)
  );
  const threadCount = new Set(messages.map((m) => m.threadId)).size;

  const workflows = listWorkflows(organizationId);
  const outstanding = workflows.filter(
    (w) => w.status === "Active" || w.status === "Waiting"
  ).length;
  const completed = workflows.filter((w) => w.status === "Completed").length;
  const announcementsPublished = listAnnouncements(organizationId).filter(
    (a) => a.publishedAt
  ).length;

  const deliveryRate =
    notifications.length === 0
      ? 100
      : Math.round(
          (deliveredOrBetter.length / notifications.length) * 1000
        ) / 10;
  const openRate =
    deliveredOrBetter.length === 0
      ? 0
      : Math.round((read.length / deliveredOrBetter.length) * 1000) / 10;
  const responseRate =
    threadCount === 0
      ? 0
      : Math.round((respondedThreads.size / threadCount) * 1000) / 10;

  return {
    organizationId,
    deliveryRate,
    openRate,
    responseRate,
    outstandingWorkflows: outstanding,
    failedNotifications: failed.length,
    trends: {
      notificationsCreated: notifications.length,
      messagesSent: messages.length,
      announcementsPublished,
      workflowsCompleted: completed,
    },
  };
}
