/**
 * JAG Communications Engine — immutable core contracts.
 * Orchestration only: no provider fields, no industry terminology.
 */

export type CommunicationDefinitionId = string;
export type CommunicationMessageId = string;
export type CommunicationTemplateId = string;
export type CommunicationDeliveryId = string;

export type CommunicationChannelKind =
  | "email"
  | "sms"
  | "push"
  | "in-app"
  | "webhook"
  | "external";

export const COMMUNICATION_CHANNEL_KINDS: readonly CommunicationChannelKind[] =
  ["email", "sms", "push", "in-app", "webhook", "external"] as const;

export type CommunicationParticipantRole =
  | "sender"
  | "recipient"
  | "cc"
  | "bcc"
  | "group"
  | "org_role";

export type CommunicationStatus =
  | "draft"
  | "resolved"
  | "rendered"
  | "scheduled"
  | "queued"
  | "dispatch_requested"
  | "cancelled"
  | "retrying"
  | "completed"
  | "failed"
  | "archived";

/** Declared by packages; orchestrated by JAG. */
export type CommunicationDefinition = {
  readonly id: CommunicationDefinitionId;
  readonly applicationId: string;
  readonly version: string;
  readonly label: string;
  readonly description?: string;
  readonly defaultChannel: CommunicationChannelKind;
  readonly allowedChannels?: readonly CommunicationChannelKind[];
  readonly templateIds?: readonly CommunicationTemplateId[];
  readonly dependsOn?: readonly CommunicationDefinitionId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly extensions?: Readonly<{
    processDefinitionIds?: readonly string[];
    decisionDefinitionIds?: readonly string[];
    documentDefinitionIds?: readonly string[];
    workflowDefinitionIds?: readonly string[];
    entityTypeIds?: readonly string[];
    identityRoleIds?: readonly string[];
    organizationUnitIds?: readonly string[];
  }>;
};

export type CommunicationChannel = {
  readonly kind: CommunicationChannelKind;
  readonly label: string;
  readonly description?: string;
  /** Descriptor only — never a provider API key or endpoint URL. */
  readonly adapterKey?: string;
};

export type CommunicationTemplate = {
  readonly id: CommunicationTemplateId;
  readonly definitionId: CommunicationDefinitionId;
  readonly label: string;
  readonly locale?: string;
  readonly subject?: string;
  readonly body: string;
  /** Placeholder names allowed in subject/body (e.g. "recipient.name"). */
  readonly variables?: readonly string[];
  /** Attachment references only — document instance ids or content refs. */
  readonly attachmentRefs?: readonly string[];
};

export type CommunicationParticipant = {
  readonly role: CommunicationParticipantRole;
  readonly userId?: string;
  readonly groupId?: string;
  readonly orgRoleId?: string;
  readonly addressHint?: string;
  readonly displayName?: string;
};

export type CommunicationRecipient = {
  readonly participant: CommunicationParticipant;
  readonly channel: CommunicationChannelKind;
  readonly resolvedAddress?: string;
  readonly resolved: boolean;
};

export type CommunicationPreference = {
  readonly userId: string;
  readonly organizationId: string;
  readonly channel: CommunicationChannelKind;
  readonly enabled: boolean;
  readonly quietHours?: Readonly<{
    readonly startHour: number;
    readonly endHour: number;
    readonly timezone: string;
  }>;
};

export type CommunicationMessage = {
  readonly id: CommunicationMessageId;
  readonly definitionId: CommunicationDefinitionId;
  readonly definitionVersion: string;
  readonly organizationId: string;
  readonly status: CommunicationStatus;
  readonly channel: CommunicationChannelKind;
  readonly templateId?: CommunicationTemplateId;
  readonly locale?: string;
  readonly participants: readonly CommunicationParticipant[];
  readonly recipients: readonly CommunicationRecipient[];
  readonly variables: Readonly<Record<string, unknown>>;
  readonly renderedSubject?: string;
  readonly renderedBody?: string;
  readonly attachmentRefs: readonly string[];
  readonly createdAt: string;
  readonly createdByUserId: string;
  readonly updatedAt: string;
  readonly scheduledAt?: string;
  readonly cancelledAt?: string;
  readonly completedAt?: string;
  readonly archivedAt?: string;
  readonly retryCount: number;
  readonly correlationId?: string;
};

export type CommunicationDelivery = {
  readonly id: CommunicationDeliveryId;
  readonly messageId: CommunicationMessageId;
  readonly channel: CommunicationChannelKind;
  readonly status:
    | "pending"
    | "queued"
    | "dispatch_requested"
    | "cancelled"
    | "retry_scheduled"
    | "completed"
    | "failed";
  readonly attempt: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly scheduledAt?: string;
  readonly lastErrorCode?: string;
  /** Opaque provider receipt — never provider credentials. */
  readonly providerReceiptRef?: string;
};

export type CommunicationEventType =
  | "communication.created"
  | "communication.recipients_resolved"
  | "communication.template_rendered"
  | "communication.routed"
  | "communication.scheduled"
  | "communication.dispatch_requested"
  | "communication.retry_scheduled"
  | "communication.cancelled"
  | "communication.completed"
  | "communication.archived";

export type CommunicationEvent = {
  readonly id: string;
  readonly type: CommunicationEventType;
  readonly messageId: CommunicationMessageId;
  readonly definitionId: CommunicationDefinitionId;
  readonly occurredAt: string;
  readonly actorUserId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
};

export type CommunicationMetrics = {
  readonly messageId: CommunicationMessageId;
  readonly definitionId: CommunicationDefinitionId;
  readonly createdAt: string;
  readonly retryCount: number;
  readonly recipientCount: number;
  readonly deliveryCount: number;
  readonly status: CommunicationStatus;
};

export type CommunicationResult<T = void> = {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly events?: readonly CommunicationEvent[];
};
