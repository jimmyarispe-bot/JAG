import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitCommunicationsEvent } from "./events";
import {
  getThread,
  listMessages,
  listThreads,
  upsertMessage,
  upsertThread,
} from "./store";
import type { Message, MessageThread } from "./types";

export function createMessagingService() {
  return {
    openThread(input: {
      organizationId: string;
      subject: string;
      participantType: MessageThread["participantType"];
      participantIds: readonly string[];
      studentId?: string | null;
      familyId?: string | null;
      employeeId?: string | null;
      secure?: boolean;
      createdBy: string;
    }): MessageThread | { error: string } {
      if (!input.subject.trim()) return { error: "subject is required." };
      if (!input.participantIds.length) {
        return { error: "At least one participant is required." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Message",
        twinEntityType: "Document",
        id,
        label: input.subject.trim(),
        kind: "message_thread",
        actor: input.createdBy,
      });
      const thread = upsertThread({
        id,
        organizationId: input.organizationId,
        subject: input.subject.trim(),
        participantType: input.participantType,
        participantIds: Object.freeze([...input.participantIds]),
        studentId: input.studentId ?? null,
        familyId: input.familyId ?? null,
        employeeId: input.employeeId ?? null,
        secure: input.secure ?? true,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Message",
        entityId: id,
        eventType: "thread_opened",
        actor: input.createdBy,
      });
      return thread;
    },

    send(input: {
      organizationId: string;
      threadId: string;
      body: string;
      senderType: Message["senderType"];
      senderId: string;
    }): Message | { error: string } | null {
      const thread = getThread(input.organizationId, input.threadId);
      if (!thread) return null;
      if (!input.body.trim()) return { error: "body is required." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Message",
        twinEntityType: "Document",
        id,
        label: `Message in ${thread.subject}`,
        kind: "message",
        actor: input.senderId,
      });
      const message = upsertMessage({
        id,
        organizationId: input.organizationId,
        threadId: thread.id,
        body: input.body.trim(),
        senderType: input.senderType,
        senderId: input.senderId,
        readBy: Object.freeze([input.senderId]),
        twinEntityId: twinId,
        createdAt: now,
      });
      upsertThread({ ...thread, updatedAt: now });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Message",
        entityId: id,
        eventType: "message_sent",
        actor: input.senderId,
        metadata: { threadId: thread.id },
      });
      return message;
    },

    markRead(input: {
      organizationId: string;
      messageId: string;
      readerId: string;
    }): Message | null {
      const message = listMessages(input.organizationId).find(
        (m) => m.id === input.messageId
      );
      if (!message) return null;
      if (message.readBy.includes(input.readerId)) return message;
      return upsertMessage({
        ...message,
        readBy: Object.freeze([...message.readBy, input.readerId]),
      });
    },

    getThread,
    listThreads,
    listMessages,

    search(input: {
      organizationId: string;
      q?: string;
      studentId?: string;
      familyId?: string;
      employeeId?: string;
      participantId?: string;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listThreads(input.organizationId).filter((t) => {
          if (input.studentId && t.studentId !== input.studentId) return false;
          if (input.familyId && t.familyId !== input.familyId) return false;
          if (input.employeeId && t.employeeId !== input.employeeId)
            return false;
          if (
            input.participantId &&
            !t.participantIds.includes(input.participantId)
          ) {
            return false;
          }
          if (!q) return true;
          return t.subject.toLowerCase().includes(q);
        })
      );
    },
  };
}
