import { randomUUID } from "node:crypto";
import { emitAdmissionsEvent } from "./events";
import { appendNotification, listNotifications } from "./store";
import type { AdmissionsNotification } from "./types";

export function notifyAdmissions(input: {
  organizationId: string;
  applicantId: string;
  template: AdmissionsNotification["template"];
  title: string;
  body: string;
}): AdmissionsNotification {
  const n = appendNotification({
    id: randomUUID(),
    organizationId: input.organizationId,
    applicantId: input.applicantId,
    channel: "in_app",
    template: input.template,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
  emitAdmissionsEvent({
    organizationId: input.organizationId,
    entityType: "AdmissionsNotification",
    entityId: n.id,
    eventType: `admissions.notification.${input.template}`,
    actor: "system",
    metadata: { applicantId: input.applicantId, template: input.template },
  });
  return n;
}

export function createNotificationsService() {
  return {
    list: listNotifications,
    notify: notifyAdmissions,
  };
}
