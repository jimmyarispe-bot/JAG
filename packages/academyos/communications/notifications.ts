import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { DOMAIN_EVENT_CATALOG } from "./config";
import { emitCommunicationsEvent } from "./events";
import {
  findPreference,
  findTemplateByKey,
  getChannelRouting,
  getNotification,
  listNotifications,
  listPreferences,
  upsertNotification,
  upsertPreference,
} from "./store";
import { renderTemplate } from "./templates";
import type {
  CommunicationChannel,
  CommunicationDomain,
  Notification,
  NotificationPreference,
  NotificationStatus,
} from "./types";
import { COMMUNICATION_CHANNELS, COMMUNICATION_DOMAINS } from "./types";

function resolveChannels(input: {
  organizationId: string;
  domain: CommunicationDomain;
  recipientType: Notification["recipientType"];
  recipientId: string;
  channel?: CommunicationChannel;
}): CommunicationChannel[] {
  const routing = getChannelRouting(input.organizationId);
  if (input.channel) {
    return routing.enabledChannels.includes(input.channel)
      ? [input.channel]
      : [];
  }

  const subjectType =
    input.recipientType === "parent"
      ? "parent"
      : input.recipientType === "employee"
        ? "employee"
        : input.recipientType === "family"
          ? "family"
          : null;
  const pref = subjectType
    ? findPreference(input.organizationId, subjectType, input.recipientId)
    : null;
  if (pref?.mutedDomains.includes(input.domain)) return [];

  const preferred = pref?.channels.length
    ? pref.channels
    : routing.defaultChannels;
  return preferred.filter(
    (c) => c !== "announcement" && routing.enabledChannels.includes(c)
  );
}

function deliverChannel(
  channel: CommunicationChannel
): { status: NotificationStatus; deliveredAt: string | null; failedReason: string | null } {
  const now = new Date().toISOString();
  if (channel === "in_app" || channel === "announcement") {
    return { status: "Delivered", deliveredAt: now, failedReason: null };
  }
  if (channel === "push") {
    // Future-ready: queue without failing
    return { status: "Queued", deliveredAt: null, failedReason: null };
  }
  // email / sms — connector-backed; mark Sent (queued for connector) as success path
  return { status: "Sent", deliveredAt: now, failedReason: null };
}

export function createNotificationService() {
  return {
    /** Route a domain event into one or more channel notifications. */
    fromDomainEvent(input: {
      organizationId: string;
      domain: CommunicationDomain;
      eventKey: string;
      recipientType: Notification["recipientType"];
      recipientId: string;
      title?: string;
      body?: string;
      variables?: Readonly<Record<string, string>>;
      studentId?: string | null;
      familyId?: string | null;
      employeeId?: string | null;
      campusId?: string | null;
      programId?: string | null;
      channel?: CommunicationChannel;
      createdBy: string;
      metadata?: Record<string, string>;
    }): Notification[] | { error: string } {
      if (!(COMMUNICATION_DOMAINS as readonly string[]).includes(input.domain)) {
        return { error: "Invalid domain." };
      }
      const catalog = DOMAIN_EVENT_CATALOG.find(
        (e) => e.domain === input.domain && e.eventKey === input.eventKey
      );
      const channels = resolveChannels(input);
      if (channels.length === 0) {
        return { error: "No enabled channels for recipient." };
      }

      const templateKey = `${input.domain}.${input.eventKey}`;
      const template = findTemplateByKey(input.organizationId, templateKey);
      const vars = input.variables ?? {};
      const title =
        input.title ??
        (template
          ? renderTemplate(template.subject, vars)
          : (catalog?.title ?? input.eventKey));
      const body =
        input.body ??
        (template
          ? renderTemplate(template.body, vars)
          : `${catalog?.title ?? input.eventKey} notification.`);

      const created: Notification[] = [];
      for (const channel of channels) {
        if (input.channel && channel !== input.channel) continue;
        const delivery = deliverChannel(channel);
        const now = new Date().toISOString();
        const id = randomUUID();
        const twinId = projectAcademyEntityToTwin({
          organizationId: input.organizationId,
          academyEntity: "Notification",
          twinEntityType: "Document",
          id,
          label: title,
          kind: "notification",
          actor: input.createdBy,
          metadata: {
            domain: input.domain,
            eventKey: input.eventKey,
            channel,
          },
        });
        const n = upsertNotification({
          id,
          organizationId: input.organizationId,
          domain: input.domain,
          eventKey: input.eventKey,
          channel,
          status: delivery.status,
          title,
          body,
          templateId: template?.id ?? null,
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          studentId: input.studentId ?? null,
          familyId: input.familyId ?? null,
          employeeId: input.employeeId ?? null,
          campusId: input.campusId ?? null,
          programId: input.programId ?? null,
          metadata: Object.freeze(input.metadata ?? {}),
          deliveredAt: delivery.deliveredAt,
          readAt: null,
          failedReason: delivery.failedReason,
          twinEntityId: twinId,
          createdAt: now,
          updatedAt: now,
          createdBy: input.createdBy,
        });
        emitCommunicationsEvent({
          organizationId: input.organizationId,
          entityType: "Notification",
          entityId: id,
          eventType: "notification_routed",
          actor: input.createdBy,
          metadata: {
            domain: input.domain,
            eventKey: input.eventKey,
            channel,
            status: delivery.status,
          },
        });
        created.push(n);
      }
      return created;
    },

    markRead(input: {
      organizationId: string;
      notificationId: string;
      actor: string;
    }): Notification | null {
      const current = getNotification(
        input.organizationId,
        input.notificationId
      );
      if (!current) return null;
      const now = new Date().toISOString();
      const updated = upsertNotification({
        ...current,
        status: "Read",
        readAt: now,
        updatedAt: now,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Notification",
        entityId: current.id,
        eventType: "notification_read",
        actor: input.actor,
      });
      return updated;
    },

    markFailed(input: {
      organizationId: string;
      notificationId: string;
      reason: string;
      actor: string;
    }): Notification | null {
      const current = getNotification(
        input.organizationId,
        input.notificationId
      );
      if (!current) return null;
      const updated = upsertNotification({
        ...current,
        status: "Failed",
        failedReason: input.reason,
        updatedAt: new Date().toISOString(),
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Notification",
        entityId: current.id,
        eventType: "notification_failed",
        actor: input.actor,
        metadata: { reason: input.reason },
      });
      return updated;
    },

    setPreferences(input: {
      organizationId: string;
      subjectType: NotificationPreference["subjectType"];
      subjectId: string;
      channels: readonly CommunicationChannel[];
      mutedDomains?: readonly CommunicationDomain[];
    }): NotificationPreference | { error: string } {
      for (const c of input.channels) {
        if (!(COMMUNICATION_CHANNELS as readonly string[]).includes(c)) {
          return { error: "Invalid channel in preferences." };
        }
      }
      const existing = findPreference(
        input.organizationId,
        input.subjectType,
        input.subjectId
      );
      return upsertPreference({
        id: existing?.id ?? randomUUID(),
        organizationId: input.organizationId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        channels: Object.freeze([...input.channels]),
        mutedDomains: Object.freeze([...(input.mutedDomains ?? [])]),
        updatedAt: new Date().toISOString(),
      });
    },

    get: getNotification,
    list: listNotifications,
    listPreferences,

    search(input: {
      organizationId: string;
      q?: string;
      domain?: CommunicationDomain;
      status?: NotificationStatus;
      recipientId?: string;
      studentId?: string;
      employeeId?: string;
      channel?: CommunicationChannel;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listNotifications(input.organizationId).filter((n) => {
          if (input.domain && n.domain !== input.domain) return false;
          if (input.status && n.status !== input.status) return false;
          if (input.recipientId && n.recipientId !== input.recipientId)
            return false;
          if (input.studentId && n.studentId !== input.studentId) return false;
          if (input.employeeId && n.employeeId !== input.employeeId)
            return false;
          if (input.channel && n.channel !== input.channel) return false;
          if (!q) return true;
          return (
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.eventKey.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
