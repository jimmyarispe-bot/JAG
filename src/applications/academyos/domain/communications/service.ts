import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  AnnouncementRecord,
  MessageRecord,
} from "@/applications/academyos/domain/repositories";

const CHANNELS = new Set(["email", "sms", "portal", "push"]);

export const CommunicationsDomainService = {
  createMessage(input: {
    displayName: string;
    channel: string;
    body?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    now?: string;
  }): DomainResult<MessageRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "Subject is required", "displayName"));
    }
    if (!CHANNELS.has(input.channel)) {
      issues.push(
        issue(
          "invalid_channel",
          `Channel must be one of: ${[...CHANNELS].join(", ")}`,
          "channel"
        )
      );
    }
    if (!input.studentId && !input.familyId) {
      issues.push(
        issue("recipient_required", "Message requires a student or family", "studentId")
      );
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("msg"),
      displayName: input.displayName.trim(),
      body: input.body ?? null,
      studentId: input.studentId ?? null,
      familyId: input.familyId ?? null,
      channel: input.channel,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },

  publishAnnouncement(input: {
    displayName: string;
    audience: string;
    body?: string | null;
    schoolId?: string | null;
    publishOn?: string | null;
    now?: string;
  }): DomainResult<AnnouncementRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Title is required", "displayName"));
    }
    if (!input.audience?.trim()) {
      return fail(issue("required", "Audience is required", "audience"));
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("ann"),
      displayName: input.displayName.trim(),
      body: input.body ?? null,
      schoolId: input.schoolId ?? null,
      audience: input.audience,
      status: "active",
      publishOn: input.publishOn ?? now,
      createdAt: now,
      updatedAt: now,
    });
  },
};
