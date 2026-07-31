/**
 * Communications Engine extension ports — peers only through contracts.
 */

import type {
  CommunicationMessage,
  CommunicationParticipant,
  CommunicationRecipient,
  CommunicationResult,
} from "@/jag/communications/contracts/definitions";

export type CommunicationExtensionCallResult = CommunicationResult<{
  readonly referenceId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly recipients?: readonly CommunicationRecipient[];
}>;

export type ProcessCommunicationPort = {
  readonly notifyProcess?: (input: {
    processDefinitionId: string;
    message: CommunicationMessage;
    eventType: string;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type DecisionCommunicationPort = {
  readonly enrichDecisionFacts?: (input: {
    decisionDefinitionId: string;
    message: CommunicationMessage;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type DocumentCommunicationPort = {
  readonly resolveAttachments?: (input: {
    documentDefinitionId: string;
    message: CommunicationMessage;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type WorkflowCommunicationPort = {
  readonly attachToWorkflow?: (input: {
    workflowDefinitionId: string;
    message: CommunicationMessage;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type EntityCommunicationPort = {
  readonly resolveSubjectParticipants?: (input: {
    entityTypeId: string;
    subjectId: string;
    message: CommunicationMessage;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type IdentityCommunicationPort = {
  readonly resolveParticipants?: (input: {
    participants: readonly CommunicationParticipant[];
    organizationId: string;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type OrganizationCommunicationPort = {
  readonly resolveOrgRoleRecipients?: (input: {
    orgRoleId: string;
    organizationId: string;
    channel: string;
  }) => Promise<CommunicationExtensionCallResult>;
};

export type CommunicationExtensionPorts = {
  readonly processes?: ProcessCommunicationPort;
  readonly decisions?: DecisionCommunicationPort;
  readonly documents?: DocumentCommunicationPort;
  readonly workflows?: WorkflowCommunicationPort;
  readonly entities?: EntityCommunicationPort;
  readonly identity?: IdentityCommunicationPort;
  readonly organization?: OrganizationCommunicationPort;
};

const EMPTY: CommunicationExtensionPorts = Object.freeze({});
let bound: CommunicationExtensionPorts = EMPTY;

export function bindCommunicationExtensions(
  ports: CommunicationExtensionPorts
): void {
  bound = Object.freeze({ ...ports });
}

export function getCommunicationExtensions(): CommunicationExtensionPorts {
  return bound;
}

export function resetCommunicationExtensionsForTests(): void {
  bound = EMPTY;
}
