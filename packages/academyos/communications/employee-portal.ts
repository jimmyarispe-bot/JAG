/**
 * Employee portal — communications inbox, tasks, announcements, preferences.
 */

import { findEmployeeByPortalToken } from "../workforce/store";
import { createAnnouncementService } from "./announcements";
import { createCommunicationCenterService } from "./communication-center";
import { createMessagingService } from "./messaging";
import { createNotificationService } from "./notifications";
import { createWorkflowService } from "./workflows";
import type { CommunicationChannel, CommunicationDomain } from "./types";

export function createCommunicationsEmployeePortalService() {
  const notifications = createNotificationService();
  const messaging = createMessagingService();
  const announcements = createAnnouncementService();
  const workflows = createWorkflowService();
  const center = createCommunicationCenterService();

  return {
    resolve(token: string) {
      const employee = findEmployeeByPortalToken(token);
      if (!employee) return { error: "Invalid employee portal token." as const };
      const org = employee.organizationId;

      return {
        inbox: notifications.search({
          organizationId: org,
          recipientId: employee.id,
        }),
        messages: messaging.search({
          organizationId: org,
          employeeId: employee.id,
          participantId: employee.id,
        }),
        tasks: workflows.tasksFor({
          organizationId: org,
          assigneeType: "employee",
        }),
        workflowQueue: workflows.search({
          organizationId: org,
          employeeId: employee.id,
          status: "Active",
        }),
        announcements: announcements.activeFeed({ organizationId: org }),
        preferences: notifications.listPreferences(org, employee.id),
        timeline: center.timeline({
          organizationId: org,
          employeeId: employee.id,
        }),
      };
    },

    sendMessage(input: {
      token: string;
      subject?: string;
      threadId?: string;
      body: string;
    }) {
      const employee = findEmployeeByPortalToken(input.token);
      if (!employee) return { error: "Invalid employee portal token." };
      let threadId = input.threadId;
      if (!threadId) {
        const thread = messaging.openThread({
          organizationId: employee.organizationId,
          subject: input.subject ?? "Staff message",
          participantType: "employee",
          participantIds: [employee.id],
          employeeId: employee.id,
          secure: true,
          createdBy: `employee:${employee.id}`,
        });
        if ("error" in thread) return thread;
        threadId = thread.id;
      }
      return messaging.send({
        organizationId: employee.organizationId,
        threadId,
        body: input.body,
        senderType: "employee",
        senderId: employee.id,
      });
    },

    setPreferences(input: {
      token: string;
      channels: readonly CommunicationChannel[];
      mutedDomains?: readonly CommunicationDomain[];
    }) {
      const employee = findEmployeeByPortalToken(input.token);
      if (!employee) return { error: "Invalid employee portal token." };
      return notifications.setPreferences({
        organizationId: employee.organizationId,
        subjectType: "employee",
        subjectId: employee.id,
        channels: input.channels,
        mutedDomains: input.mutedDomains,
      });
    },

    completeWorkflowStep(input: {
      token: string;
      workflowId: string;
      stepId: string;
    }) {
      const employee = findEmployeeByPortalToken(input.token);
      if (!employee) return { error: "Invalid employee portal token." };
      return workflows.advance({
        organizationId: employee.organizationId,
        workflowId: input.workflowId,
        stepId: input.stepId,
        actor: `employee:${employee.id}`,
      });
    },
  };
}
