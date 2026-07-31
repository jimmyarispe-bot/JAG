/**
 * Delivery / persistence contracts only — no provider implementations.
 */

import type {
  CommunicationDelivery,
  CommunicationMessage,
  CommunicationMessageId,
  CommunicationTemplate,
} from "@/jag/communications/contracts/definitions";

export type CommunicationRepository = {
  readonly save: (message: CommunicationMessage) => Promise<void>;
  readonly findById: (
    messageId: CommunicationMessageId
  ) => Promise<CommunicationMessage | null>;
  readonly listByOrganization: (
    organizationId: string
  ) => Promise<readonly CommunicationMessage[]>;
};

export type CommunicationQueueRepository = {
  readonly enqueue: (delivery: CommunicationDelivery) => Promise<void>;
  readonly listPending: (
    limit?: number
  ) => Promise<readonly CommunicationDelivery[]>;
};

export type CommunicationTemplateRepository = {
  readonly save: (template: CommunicationTemplate) => Promise<void>;
  readonly findById: (
    templateId: string
  ) => Promise<CommunicationTemplate | null>;
};

/** Adapter contract for future providers — not implemented in this sprint. */
export type CommunicationDeliveryProvider = {
  readonly dispatch: (input: {
    delivery: CommunicationDelivery;
    message: CommunicationMessage;
  }) => Promise<{ ok: boolean; providerReceiptRef?: string; errorCode?: string }>;
};

export type CommunicationPersistencePorts = {
  readonly messages?: CommunicationRepository;
  readonly queue?: CommunicationQueueRepository;
  readonly templates?: CommunicationTemplateRepository;
  readonly deliveryProvider?: CommunicationDeliveryProvider;
};

let persistence: CommunicationPersistencePorts = Object.freeze({});

export function bindCommunicationPersistence(
  ports: CommunicationPersistencePorts
): void {
  persistence = Object.freeze({ ...ports });
}

export function getCommunicationPersistence(): CommunicationPersistencePorts {
  return persistence;
}

export function resetCommunicationPersistenceForTests(): void {
  persistence = Object.freeze({});
}
