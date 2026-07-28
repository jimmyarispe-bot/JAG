import { randomUUID } from "node:crypto";
import { emitCommunicationsEvent } from "./events";
import { listReminders, upsertReminder } from "./store";
import type { CommunicationChannel, Reminder } from "./types";
import { COMMUNICATION_CHANNELS } from "./types";

export function createReminderService() {
  return {
    schedule(input: {
      organizationId: string;
      title: string;
      dueAt: string;
      channel: CommunicationChannel;
      recipientType: Reminder["recipientType"];
      recipientId: string;
      relatedType?: Reminder["relatedType"];
      relatedId?: string | null;
      createdBy: string;
    }): Reminder | { error: string } {
      if (!input.title.trim()) return { error: "title is required." };
      if (!(COMMUNICATION_CHANNELS as readonly string[]).includes(input.channel)) {
        return { error: "Invalid channel." };
      }
      const reminder = upsertReminder({
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        dueAt: input.dueAt,
        channel: input.channel,
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        status: "Scheduled",
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Reminder",
        entityId: reminder.id,
        eventType: "reminder_scheduled",
        actor: input.createdBy,
      });
      return reminder;
    },

    sendDue(input: {
      organizationId: string;
      asOf?: string;
      actor: string;
    }): Reminder[] {
      const asOf = input.asOf ?? new Date().toISOString();
      const sent: Reminder[] = [];
      for (const r of listReminders(input.organizationId)) {
        if (r.status !== "Scheduled" || r.dueAt > asOf) continue;
        const updated = upsertReminder({ ...r, status: "Sent" });
        emitCommunicationsEvent({
          organizationId: input.organizationId,
          entityType: "Reminder",
          entityId: r.id,
          eventType: "reminder_sent",
          actor: input.actor,
        });
        sent.push(updated);
      }
      return sent;
    },

    cancel(input: {
      organizationId: string;
      reminderId: string;
      actor: string;
    }): Reminder | null {
      const current = listReminders(input.organizationId).find(
        (r) => r.id === input.reminderId
      );
      if (!current) return null;
      const updated = upsertReminder({ ...current, status: "Cancelled" });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Reminder",
        entityId: current.id,
        eventType: "reminder_cancelled",
        actor: input.actor,
      });
      return updated;
    },

    list: listReminders,
  };
}
