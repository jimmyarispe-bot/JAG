import { createAnnouncementService } from "./announcements";
import { createMessagingService } from "./messaging";
import {
  listMessages,
  listNotifications,
  listWorkflows,
} from "./store";
import type { CommunicationCenterItem } from "./types";

export function createCommunicationCenterService() {
  return {
    timeline(input: {
      organizationId: string;
      studentId?: string;
      familyId?: string;
      employeeId?: string;
      campusId?: string;
      programId?: string;
      limit?: number;
    }): readonly CommunicationCenterItem[] {
      const items: CommunicationCenterItem[] = [];

      for (const n of listNotifications(input.organizationId)) {
        if (input.studentId && n.studentId !== input.studentId) continue;
        if (input.familyId && n.familyId !== input.familyId) continue;
        if (input.employeeId && n.employeeId !== input.employeeId) continue;
        if (input.campusId && n.campusId !== input.campusId) continue;
        if (input.programId && n.programId !== input.programId) continue;
        const kind =
          n.channel === "email"
            ? "email"
            : n.channel === "sms"
              ? "sms"
              : "notification";
        items.push({
          id: n.id,
          organizationId: n.organizationId,
          kind,
          title: n.title,
          body: n.body,
          occurredAt: n.createdAt,
          studentId: n.studentId,
          familyId: n.familyId,
          employeeId: n.employeeId,
          campusId: n.campusId,
          programId: n.programId,
          status: n.status,
        });
      }

      const messaging = createMessagingService();
      for (const thread of messaging.search({
        organizationId: input.organizationId,
        studentId: input.studentId,
        familyId: input.familyId,
        employeeId: input.employeeId,
      })) {
        const msgs = listMessages(input.organizationId, thread.id);
        const last = msgs[msgs.length - 1];
        items.push({
          id: thread.id,
          organizationId: thread.organizationId,
          kind: "message",
          title: thread.subject,
          body: last?.body ?? "",
          occurredAt: last?.createdAt ?? thread.updatedAt,
          studentId: thread.studentId,
          familyId: thread.familyId,
          employeeId: thread.employeeId,
          campusId: null,
          programId: null,
          status: thread.secure ? "Secure" : "Open",
        });
      }

      for (const a of createAnnouncementService().activeFeed({
        organizationId: input.organizationId,
      })) {
        items.push({
          id: a.id,
          organizationId: a.organizationId,
          kind: "announcement",
          title: a.title,
          body: a.body,
          occurredAt: a.publishedAt ?? a.createdAt,
          studentId: null,
          familyId: null,
          employeeId: null,
          campusId: a.scope === "Campus" ? a.scopeTargetId : null,
          programId: a.scope === "Program" ? a.scopeTargetId : null,
          status: "Published",
        });
      }

      for (const w of listWorkflows(input.organizationId)) {
        if (input.studentId && w.studentId !== input.studentId) continue;
        if (input.familyId && w.familyId !== input.familyId) continue;
        if (input.employeeId && w.employeeId !== input.employeeId) continue;
        if (input.campusId && w.campusId !== input.campusId) continue;
        if (input.programId && w.programId !== input.programId) continue;
        items.push({
          id: w.id,
          organizationId: w.organizationId,
          kind: "workflow",
          title: w.name,
          body: `${w.recipe} · ${w.status}`,
          occurredAt: w.updatedAt,
          studentId: w.studentId,
          familyId: w.familyId,
          employeeId: w.employeeId,
          campusId: w.campusId,
          programId: w.programId,
          status: w.status,
        });
      }

      items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      const limit = input.limit ?? 100;
      return Object.freeze(items.slice(0, limit));
    },
  };
}
