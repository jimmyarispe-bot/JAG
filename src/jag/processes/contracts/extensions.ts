/**
 * Process Engine extension ports.
 * The engine calls frameworks only through these contracts — never concrete imports.
 */

import type { ProcessContext, ProcessResult } from "@/jag/processes/contracts/definitions";

/** Opaque adapter results — frameworks interpret their own payloads. */
export type ExtensionCallResult = ProcessResult<{
  readonly referenceId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}>;

export type WorkflowExtensionPort = {
  readonly startLinkedWorkflow?: (input: {
    workflowDefinitionId: string;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
  readonly signalTransition?: (input: {
    workflowDefinitionId: string;
    context: ProcessContext;
    signal: string;
  }) => Promise<ExtensionCallResult>;
};

export type FormsExtensionPort = {
  readonly validateForm?: (input: {
    formDefinitionId: string;
    values: Readonly<Record<string, unknown>>;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
};

export type EntityExtensionPort = {
  readonly resolveSubject?: (input: {
    entityTypeId: string;
    subjectId: string;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
};

export type DocumentsExtensionPort = {
  readonly requireEvidence?: (input: {
    categoryId: string;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
};

export type CommunicationsExtensionPort = {
  readonly notifyParticipants?: (input: {
    templateId?: string;
    context: ProcessContext;
    eventType: string;
  }) => Promise<ExtensionCallResult>;
};

export type IntelligenceExtensionPort = {
  readonly evaluateHint?: (input: {
    packId: string;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
};

export type NavigationExtensionPort = {
  readonly resolveModule?: (input: {
    moduleId: string;
    context: ProcessContext;
  }) => Promise<ExtensionCallResult>;
};

/** Bound once at composition / test setup — never imported from packages. */
export type ProcessExtensionPorts = {
  readonly workflows?: WorkflowExtensionPort;
  readonly forms?: FormsExtensionPort;
  readonly entities?: EntityExtensionPort;
  readonly documents?: DocumentsExtensionPort;
  readonly communications?: CommunicationsExtensionPort;
  readonly intelligence?: IntelligenceExtensionPort;
  readonly navigation?: NavigationExtensionPort;
};

const EMPTY_PORTS: ProcessExtensionPorts = Object.freeze({});

let boundPorts: ProcessExtensionPorts = EMPTY_PORTS;

export function bindProcessExtensions(ports: ProcessExtensionPorts): void {
  boundPorts = Object.freeze({ ...ports });
}

export function getProcessExtensions(): ProcessExtensionPorts {
  return boundPorts;
}

export function resetProcessExtensionsForTests(): void {
  boundPorts = EMPTY_PORTS;
}
