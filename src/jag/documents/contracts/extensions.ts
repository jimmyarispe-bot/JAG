/**
 * Documents Engine extension ports — peers only through contracts.
 */

import type {
  DocumentInstance,
  DocumentResult,
} from "@/jag/documents/contracts/definitions";

export type DocumentExtensionCallResult = DocumentResult<{
  readonly referenceId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}>;

export type ProcessDocumentPort = {
  readonly notifyProcess?: (input: {
    processDefinitionId: string;
    instance: DocumentInstance;
    eventType: string;
  }) => Promise<DocumentExtensionCallResult>;
};

export type DecisionDocumentPort = {
  readonly enrichDecisionFacts?: (input: {
    decisionDefinitionId: string;
    instance: DocumentInstance;
  }) => Promise<DocumentExtensionCallResult>;
};

export type WorkflowDocumentPort = {
  readonly attachToWorkflow?: (input: {
    workflowDefinitionId: string;
    instance: DocumentInstance;
  }) => Promise<DocumentExtensionCallResult>;
};

export type EntityDocumentPort = {
  readonly linkEntity?: (input: {
    entityTypeId: string;
    subjectId: string;
    instance: DocumentInstance;
  }) => Promise<DocumentExtensionCallResult>;
};

export type FormsDocumentPort = {
  readonly captureMetadata?: (input: {
    formDefinitionId: string;
    instance: DocumentInstance;
  }) => Promise<DocumentExtensionCallResult>;
};

export type CommunicationsDocumentPort = {
  readonly notifyParticipants?: (input: {
    templateId?: string;
    instance: DocumentInstance;
    eventType: string;
  }) => Promise<DocumentExtensionCallResult>;
};

export type IntelligenceDocumentPort = {
  readonly annotate?: (input: {
    packId: string;
    instance: DocumentInstance;
  }) => Promise<DocumentExtensionCallResult>;
};

export type DocumentExtensionPorts = {
  readonly processes?: ProcessDocumentPort;
  readonly decisions?: DecisionDocumentPort;
  readonly workflows?: WorkflowDocumentPort;
  readonly entities?: EntityDocumentPort;
  readonly forms?: FormsDocumentPort;
  readonly communications?: CommunicationsDocumentPort;
  readonly intelligence?: IntelligenceDocumentPort;
};

const EMPTY: DocumentExtensionPorts = Object.freeze({});
let bound: DocumentExtensionPorts = EMPTY;

export function bindDocumentExtensions(ports: DocumentExtensionPorts): void {
  bound = Object.freeze({ ...ports });
}

export function getDocumentExtensions(): DocumentExtensionPorts {
  return bound;
}

export function resetDocumentExtensionsForTests(): void {
  bound = EMPTY;
}
