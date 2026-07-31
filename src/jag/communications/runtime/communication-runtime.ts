/**
 * CommunicationRuntime — message orchestration without delivery providers.
 */

import type {
  CommunicationChannelKind,
  CommunicationDelivery,
  CommunicationMessage,
  CommunicationMessageId,
  CommunicationMetrics,
  CommunicationParticipant,
  CommunicationResult,
} from "@/jag/communications/contracts/definitions";
import { getCommunicationExtensions } from "@/jag/communications/contracts/extensions";
import { emitCommunicationEvent } from "@/jag/communications/events";
import { getCommunicationPersistence } from "@/jag/communications/delivery";
import { resolveCommunicationRecipients } from "@/jag/communications/participants";
import {
  assertCommunicationRegistered,
  getCommunicationPreference,
  getCommunicationTemplate,
} from "@/jag/communications/registry";
import { routeCommunicationChannel } from "@/jag/communications/routing";
import { communicationNow } from "@/jag/communications/runtime/clock";
import { nextCommunicationOpaqueId } from "@/jag/communications/runtime/ids";
import {
  getCommunicationMessage,
  listCommunicationDeliveries,
  putCommunicationDelivery,
  putCommunicationMessage,
} from "@/jag/communications/runtime/message-store";
import { renderCommunicationTemplate } from "@/jag/communications/templates";
import { trackCommunicationTelemetry } from "@/jag/communications/telemetry";

function fail<T = never>(code: string, message: string): CommunicationResult<T> {
  return { ok: false, error: { code, message } };
}

function iso(d: Date = communicationNow()): string {
  return d.toISOString();
}

function mutateMessage(
  message: CommunicationMessage,
  patch: Partial<CommunicationMessage>
): CommunicationMessage {
  const next: CommunicationMessage = Object.freeze({
    ...message,
    ...patch,
    participants: Object.freeze(
      [...(patch.participants ?? message.participants)].map((p) =>
        Object.freeze({ ...p })
      )
    ),
    recipients: Object.freeze(
      [...(patch.recipients ?? message.recipients)].map((r) =>
        Object.freeze({
          ...r,
          participant: Object.freeze({ ...r.participant }),
        })
      )
    ),
    variables: Object.freeze({
      ...(patch.variables ?? message.variables),
    }),
    attachmentRefs: Object.freeze([
      ...(patch.attachmentRefs ?? message.attachmentRefs),
    ]),
  });
  putCommunicationMessage(next);
  return next;
}

export type CreateCommunicationInput = {
  definitionId: string;
  organizationId: string;
  actorUserId: string;
  participants: readonly CommunicationParticipant[];
  variables?: Record<string, unknown>;
  templateId?: string;
  locale?: string;
  channel?: CommunicationChannelKind;
  attachmentRefs?: readonly string[];
  correlationId?: string;
};

export async function createCommunicationMessage(
  input: CreateCommunicationInput
): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const definition = assertCommunicationRegistered(input.definitionId);

  let channel: CommunicationChannelKind;
  try {
    const prefUser = input.participants.find((p) => p.userId)?.userId;
    const preference = prefUser
      ? getCommunicationPreference({
          organizationId: input.organizationId,
          userId: prefUser,
          channel: input.channel ?? definition.defaultChannel,
        })
      : null;
    channel = routeCommunicationChannel({
      definition,
      preferredChannel: input.channel,
      preference,
    });
  } catch (err) {
    return fail(
      "routing_failed",
      err instanceof Error ? err.message : "Routing failed"
    );
  }

  const at = iso();
  const messageId = nextCommunicationOpaqueId("msg");
  const message: CommunicationMessage = Object.freeze({
    id: messageId,
    definitionId: definition.id,
    definitionVersion: definition.version,
    organizationId: input.organizationId,
    status: "draft",
    channel,
    templateId: input.templateId ?? definition.templateIds?.[0],
    locale: input.locale,
    participants: Object.freeze(
      input.participants.map((p) => Object.freeze({ ...p }))
    ),
    recipients: Object.freeze([]),
    variables: Object.freeze({ ...(input.variables ?? {}) }),
    attachmentRefs: Object.freeze([...(input.attachmentRefs ?? [])]),
    createdAt: at,
    createdByUserId: input.actorUserId,
    updatedAt: at,
    retryCount: 0,
    correlationId: input.correlationId,
  });

  putCommunicationMessage(message);

  emitCommunicationEvent({
    type: "communication.created",
    messageId,
    definitionId: definition.id,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { channel },
  });
  emitCommunicationEvent({
    type: "communication.routed",
    messageId,
    definitionId: definition.id,
    occurredAt: at,
    data: { channel },
  });
  trackCommunicationTelemetry({
    kind: "create",
    messageId,
    definitionId: definition.id,
    at,
  });
  trackCommunicationTelemetry({
    kind: "route",
    messageId,
    definitionId: definition.id,
    at,
  });

  const ports = getCommunicationExtensions();
  for (const processId of definition.extensions?.processDefinitionIds ?? []) {
    if (ports.processes?.notifyProcess) {
      await ports.processes.notifyProcess({
        processDefinitionId: processId,
        message,
        eventType: "communication.created",
      });
    }
  }

  return { ok: true, value: { message } };
}

export async function resolveCommunicationRecipientsForMessage(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
}): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }

  const recipients = await resolveCommunicationRecipients({
    organizationId: current.organizationId,
    channel: current.channel,
    participants: current.participants,
  });

  const at = iso();
  const message = mutateMessage(current, {
    recipients,
    status: "resolved",
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.recipients_resolved",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { count: recipients.length },
  });

  return { ok: true, value: { message } };
}

export async function renderCommunicationMessage(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
  templateId?: string;
}): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }

  const templateId = input.templateId ?? current.templateId;
  if (!templateId) {
    return fail("template_required", "No template id on message");
  }
  const template = getCommunicationTemplate(templateId);
  if (!template || template.definitionId !== current.definitionId) {
    return fail(
      "template_not_found",
      `Template "${templateId}" is not registered for this definition`
    );
  }

  const rendered = renderCommunicationTemplate({
    template,
    variables: current.variables,
  });

  const at = iso();
  const message = mutateMessage(current, {
    templateId,
    renderedSubject: rendered.subject,
    renderedBody: rendered.body,
    status: "rendered",
    updatedAt: at,
    attachmentRefs: [
      ...new Set([
        ...current.attachmentRefs,
        ...(template.attachmentRefs ?? []),
      ]),
    ],
  });

  emitCommunicationEvent({
    type: "communication.template_rendered",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { unresolved: rendered.unresolved },
  });
  trackCommunicationTelemetry({
    kind: "render",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message } };
}

export async function scheduleCommunicationDelivery(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
  scheduledAt?: string;
}): Promise<
  CommunicationResult<{ message: CommunicationMessage; delivery: CommunicationDelivery }>
> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }
  if (current.status === "cancelled" || current.status === "archived") {
    return fail(
      "invalid_status",
      `Cannot schedule message in status "${current.status}"`
    );
  }

  let message = current;
  if (message.recipients.length === 0) {
    const resolved = await resolveCommunicationRecipientsForMessage({
      messageId: message.id,
      actorUserId: input.actorUserId,
    });
    if (!resolved.ok || !resolved.value) {
      return fail(
        resolved.error?.code ?? "resolve_failed",
        resolved.error?.message ?? "Recipient resolution failed"
      );
    }
    message = resolved.value.message;
  }
  if (!message.renderedBody) {
    const rendered = await renderCommunicationMessage({
      messageId: message.id,
      actorUserId: input.actorUserId,
    });
    if (!rendered.ok || !rendered.value) {
      return fail(
        rendered.error?.code ?? "render_failed",
        rendered.error?.message ?? "Template render failed"
      );
    }
    message = rendered.value.message;
  }

  const at = iso();
  const scheduledAt = input.scheduledAt ?? at;
  const deliveryId = nextCommunicationOpaqueId("dlv");
  const delivery: CommunicationDelivery = Object.freeze({
    id: deliveryId,
    messageId: message.id,
    channel: message.channel,
    status: "pending",
    attempt: 1,
    createdAt: at,
    updatedAt: at,
    scheduledAt,
  });
  putCommunicationDelivery(delivery);

  message = mutateMessage(message, {
    status: "scheduled",
    scheduledAt,
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.scheduled",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { deliveryId, scheduledAt },
  });
  trackCommunicationTelemetry({
    kind: "schedule",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message, delivery } };
}

export async function queueCommunicationDispatch(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
}): Promise<
  CommunicationResult<{ message: CommunicationMessage; delivery: CommunicationDelivery }>
> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }

  let deliveries = listCommunicationDeliveries(current.id);
  if (deliveries.length === 0) {
    const scheduled = await scheduleCommunicationDelivery({
      messageId: current.id,
      actorUserId: input.actorUserId,
    });
    if (!scheduled.ok || !scheduled.value) {
      return fail(
        scheduled.error?.code ?? "schedule_failed",
        scheduled.error?.message ?? "Schedule failed"
      );
    }
    deliveries = listCommunicationDeliveries(current.id);
  }

  const latest = deliveries[deliveries.length - 1]!;
  const at = iso();
  const delivery: CommunicationDelivery = Object.freeze({
    ...latest,
    status: "dispatch_requested",
    updatedAt: at,
  });
  putCommunicationDelivery(delivery);

  const message = mutateMessage(
    getCommunicationMessage(current.id) ?? current,
    {
      status: "dispatch_requested",
      updatedAt: at,
    }
  );

  // Persistence queue adapter (optional) — never calls a real provider.
  const persistence = getCommunicationPersistence();
  if (persistence.queue?.enqueue) {
    await persistence.queue.enqueue(delivery);
  }

  emitCommunicationEvent({
    type: "communication.dispatch_requested",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { deliveryId: delivery.id },
  });
  trackCommunicationTelemetry({
    kind: "dispatch",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message, delivery } };
}

export async function cancelCommunication(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
}): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }
  if (current.status === "completed" || current.status === "archived") {
    return fail(
      "invalid_status",
      `Cannot cancel message in status "${current.status}"`
    );
  }

  const at = iso();
  for (const d of listCommunicationDeliveries(current.id)) {
    if (
      d.status === "pending" ||
      d.status === "queued" ||
      d.status === "dispatch_requested" ||
      d.status === "retry_scheduled"
    ) {
      putCommunicationDelivery(
        Object.freeze({ ...d, status: "cancelled", updatedAt: at })
      );
    }
  }

  const message = mutateMessage(current, {
    status: "cancelled",
    cancelledAt: at,
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.cancelled",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
  });
  trackCommunicationTelemetry({
    kind: "cancel",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message } };
}

export async function retryCommunication(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
}): Promise<
  CommunicationResult<{ message: CommunicationMessage; delivery: CommunicationDelivery }>
> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }
  if (current.status === "cancelled" || current.status === "archived") {
    return fail(
      "invalid_status",
      `Cannot retry message in status "${current.status}"`
    );
  }

  const at = iso();
  const attempt = current.retryCount + 1;
  const delivery: CommunicationDelivery = Object.freeze({
    id: nextCommunicationOpaqueId("dlv"),
    messageId: current.id,
    channel: current.channel,
    status: "retry_scheduled",
    attempt,
    createdAt: at,
    updatedAt: at,
    scheduledAt: at,
  });
  putCommunicationDelivery(delivery);

  const message = mutateMessage(current, {
    status: "retrying",
    retryCount: attempt,
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.retry_scheduled",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
    data: { attempt, deliveryId: delivery.id },
  });
  trackCommunicationTelemetry({
    kind: "retry",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message, delivery } };
}

export async function completeCommunication(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
  providerReceiptRef?: string;
}): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }

  const at = iso();
  const deliveries = listCommunicationDeliveries(current.id);
  const latest = deliveries[deliveries.length - 1];
  if (latest) {
    putCommunicationDelivery(
      Object.freeze({
        ...latest,
        status: "completed",
        updatedAt: at,
        providerReceiptRef: input.providerReceiptRef,
      })
    );
  }

  const message = mutateMessage(current, {
    status: "completed",
    completedAt: at,
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.completed",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
  });
  trackCommunicationTelemetry({
    kind: "complete",
    messageId: message.id,
    definitionId: message.definitionId,
    at,
  });

  return { ok: true, value: { message } };
}

export async function archiveCommunication(input: {
  messageId: CommunicationMessageId;
  actorUserId?: string;
}): Promise<CommunicationResult<{ message: CommunicationMessage }>> {
  const current = getCommunicationMessage(input.messageId);
  if (!current) {
    return fail("message_not_found", `Message "${input.messageId}" not found`);
  }

  const at = iso();
  const message = mutateMessage(current, {
    status: "archived",
    archivedAt: at,
    updatedAt: at,
  });

  emitCommunicationEvent({
    type: "communication.archived",
    messageId: message.id,
    definitionId: message.definitionId,
    occurredAt: at,
    actorUserId: input.actorUserId,
  });

  return { ok: true, value: { message } };
}

export function getCommunicationMetrics(
  messageId: CommunicationMessageId
): CommunicationMetrics | null {
  const message = getCommunicationMessage(messageId);
  if (!message) return null;
  return {
    messageId: message.id,
    definitionId: message.definitionId,
    createdAt: message.createdAt,
    retryCount: message.retryCount,
    recipientCount: message.recipients.length,
    deliveryCount: listCommunicationDeliveries(messageId).length,
    status: message.status,
  };
}

export const CommunicationRuntime = {
  create: createCommunicationMessage,
  resolveRecipients: resolveCommunicationRecipientsForMessage,
  render: renderCommunicationMessage,
  schedule: scheduleCommunicationDelivery,
  queueDispatch: queueCommunicationDispatch,
  cancel: cancelCommunication,
  retry: retryCommunication,
  complete: completeCommunication,
  archive: archiveCommunication,
  getMessage: getCommunicationMessage,
  listDeliveries: listCommunicationDeliveries,
  getMetrics: getCommunicationMetrics,
} as const;
