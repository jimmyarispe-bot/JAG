import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitCommunicationsEvent } from "./events";
import {
  getAnnouncement,
  listAnnouncements,
  upsertAnnouncement,
} from "./store";
import type { Announcement, AnnouncementScope } from "./types";
import { ANNOUNCEMENT_SCOPES } from "./types";

export function createAnnouncementService() {
  return {
    create(input: {
      organizationId: string;
      title: string;
      body: string;
      scope: AnnouncementScope;
      scopeTargetId?: string | null;
      expiresAt?: string | null;
      createdBy: string;
    }): Announcement | { error: string } {
      if (!input.title.trim() || !input.body.trim()) {
        return { error: "title and body are required." };
      }
      if (!(ANNOUNCEMENT_SCOPES as readonly string[]).includes(input.scope)) {
        return { error: "Invalid announcement scope." };
      }
      if (input.scope !== "Organization" && !input.scopeTargetId) {
        return { error: "scopeTargetId is required for non-org scopes." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Announcement",
        twinEntityType: "Document",
        id,
        label: input.title.trim(),
        kind: "announcement",
        actor: input.createdBy,
        metadata: { scope: input.scope },
      });
      const announcement = upsertAnnouncement({
        id,
        organizationId: input.organizationId,
        title: input.title.trim(),
        body: input.body.trim(),
        scope: input.scope,
        scopeTargetId: input.scopeTargetId ?? null,
        publishedAt: null,
        expiresAt: input.expiresAt ?? null,
        readBy: Object.freeze([]),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Announcement",
        entityId: id,
        eventType: "announcement_created",
        actor: input.createdBy,
      });
      return announcement;
    },

    publish(input: {
      organizationId: string;
      announcementId: string;
      actor: string;
    }): Announcement | null {
      const current = getAnnouncement(
        input.organizationId,
        input.announcementId
      );
      if (!current) return null;
      const now = new Date().toISOString();
      const updated = upsertAnnouncement({
        ...current,
        publishedAt: now,
        updatedAt: now,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Announcement",
        entityId: current.id,
        eventType: "announcement_published",
        actor: input.actor,
      });
      return updated;
    },

    markRead(input: {
      organizationId: string;
      announcementId: string;
      readerId: string;
    }): Announcement | null {
      const current = getAnnouncement(
        input.organizationId,
        input.announcementId
      );
      if (!current) return null;
      if (current.readBy.includes(input.readerId)) return current;
      return upsertAnnouncement({
        ...current,
        readBy: Object.freeze([...current.readBy, input.readerId]),
        updatedAt: new Date().toISOString(),
      });
    },

    get: getAnnouncement,
    list: listAnnouncements,

    activeFeed(input: {
      organizationId: string;
      scope?: AnnouncementScope;
      scopeTargetId?: string;
      asOf?: string;
    }) {
      const asOf = input.asOf ?? new Date().toISOString();
      return Object.freeze(
        listAnnouncements(input.organizationId).filter((a) => {
          if (!a.publishedAt || a.publishedAt > asOf) return false;
          if (a.expiresAt && a.expiresAt <= asOf) return false;
          if (input.scope && a.scope !== input.scope) return false;
          if (
            input.scopeTargetId &&
            a.scopeTargetId &&
            a.scopeTargetId !== input.scopeTargetId
          ) {
            return false;
          }
          return true;
        })
      );
    },

    search(input: {
      organizationId: string;
      q?: string;
      scope?: AnnouncementScope;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listAnnouncements(input.organizationId).filter((a) => {
          if (input.scope && a.scope !== input.scope) return false;
          if (!q) return true;
          return (
            a.title.toLowerCase().includes(q) ||
            a.body.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
