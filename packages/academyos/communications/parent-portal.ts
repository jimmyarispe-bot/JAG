/**
 * Parent portal — communications facets (message center, prefs, announcements, tasks).
 */

import { findApplicantByParentToken } from "../admissions/store";
import { createAnnouncementService } from "./announcements";
import { createCommunicationCenterService } from "./communication-center";
import { createMessagingService } from "./messaging";
import { createNotificationService } from "./notifications";
import { createWorkflowService } from "./workflows";
import type { CommunicationChannel, CommunicationDomain } from "./types";

export function createCommunicationsParentPortalService() {
  const notifications = createNotificationService();
  const messaging = createMessagingService();
  const announcements = createAnnouncementService();
  const workflows = createWorkflowService();
  const center = createCommunicationCenterService();

  return {
    resolve(token: string) {
      const applicant = findApplicantByParentToken(token);
      if (!applicant) return { error: "Invalid parent portal token." as const };
      const org = applicant.organizationId;
      const parentId = applicant.guardian.email;
      const familyId = applicant.id;

      return {
        messageCenter: messaging.search({
          organizationId: org,
          familyId,
          participantId: parentId,
        }),
        notifications: notifications.search({
          organizationId: org,
          recipientId: parentId,
        }),
        announcementFeed: announcements.activeFeed({ organizationId: org }),
        workflowTasks: workflows.tasksFor({
          organizationId: org,
          assigneeType: "parent",
        }),
        preferences: notifications.listPreferences(org, parentId),
        timeline: center.timeline({
          organizationId: org,
          familyId,
        }),
      };
    },

    sendMessage(input: {
      token: string;
      subject?: string;
      threadId?: string;
      body: string;
    }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent portal token." };
      const parentId = applicant.guardian.email;
      let threadId = input.threadId;
      if (!threadId) {
        const thread = messaging.openThread({
          organizationId: applicant.organizationId,
          subject: input.subject ?? "Parent message",
          participantType: "parent",
          participantIds: [parentId],
          familyId: applicant.id,
          studentId: null,
          secure: true,
          createdBy: `parent:${parentId}`,
        });
        if ("error" in thread) return thread;
        threadId = thread.id;
      }
      return messaging.send({
        organizationId: applicant.organizationId,
        threadId,
        body: input.body,
        senderType: "parent",
        senderId: parentId,
      });
    },

    setPreferences(input: {
      token: string;
      channels: readonly CommunicationChannel[];
      mutedDomains?: readonly CommunicationDomain[];
    }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent portal token." };
      return notifications.setPreferences({
        organizationId: applicant.organizationId,
        subjectType: "parent",
        subjectId: applicant.guardian.email,
        channels: input.channels,
        mutedDomains: input.mutedDomains,
      });
    },

    markNotificationRead(input: { token: string; notificationId: string }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent portal token." };
      const n = notifications.markRead({
        organizationId: applicant.organizationId,
        notificationId: input.notificationId,
        actor: `parent:${applicant.guardian.email}`,
      });
      if (!n) return { error: "Notification not found." };
      return n;
    },

    completeWorkflowStep(input: {
      token: string;
      workflowId: string;
      stepId: string;
    }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent portal token." };
      return workflows.advance({
        organizationId: applicant.organizationId,
        workflowId: input.workflowId,
        stepId: input.stepId,
        actor: `parent:${applicant.guardian.email}`,
      });
    },
  };
}
