/**
 * Decision Engine extension ports — frameworks only through contracts.
 */

import type { DecisionContext, DecisionResult } from "@/jag/decisions/contracts/definitions";

export type DecisionExtensionCallResult = {
  readonly ok: boolean;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly error?: { readonly code: string; readonly message: string };
};

export type ProcessDecisionPort = {
  readonly enrichFromProcess?: (input: {
    processDefinitionId: string;
    context: DecisionContext;
  }) => Promise<DecisionExtensionCallResult>;
};

export type WorkflowDecisionPort = {
  readonly enrichFromWorkflow?: (input: {
    workflowDefinitionId: string;
    context: DecisionContext;
  }) => Promise<DecisionExtensionCallResult>;
};

export type FormsDecisionPort = {
  readonly readFormFacts?: (input: {
    formDefinitionId: string;
    context: DecisionContext;
  }) => Promise<DecisionExtensionCallResult>;
};

export type EntityDecisionPort = {
  readonly readEntityFacts?: (input: {
    entityTypeId: string;
    subjectId: string;
    context: DecisionContext;
  }) => Promise<DecisionExtensionCallResult>;
};

export type IntelligenceDecisionPort = {
  readonly annotate?: (input: {
    packId: string;
    context: DecisionContext;
    result: DecisionResult;
  }) => Promise<DecisionExtensionCallResult>;
};

export type CommunicationsDecisionPort = {
  readonly notifyOutcome?: (input: {
    templateId?: string;
    context: DecisionContext;
    outcome: string;
  }) => Promise<DecisionExtensionCallResult>;
};

export type TelemetryDecisionPort = {
  readonly forward?: (input: {
    context: DecisionContext;
    eventType: string;
    data?: Readonly<Record<string, unknown>>;
  }) => Promise<DecisionExtensionCallResult>;
};

export type DecisionExtensionPorts = {
  readonly processes?: ProcessDecisionPort;
  readonly workflows?: WorkflowDecisionPort;
  readonly forms?: FormsDecisionPort;
  readonly entities?: EntityDecisionPort;
  readonly intelligence?: IntelligenceDecisionPort;
  readonly communications?: CommunicationsDecisionPort;
  readonly telemetry?: TelemetryDecisionPort;
};

const EMPTY: DecisionExtensionPorts = Object.freeze({});
let bound: DecisionExtensionPorts = EMPTY;

export function bindDecisionExtensions(ports: DecisionExtensionPorts): void {
  bound = Object.freeze({ ...ports });
}

export function getDecisionExtensions(): DecisionExtensionPorts {
  return bound;
}

export function resetDecisionExtensionsForTests(): void {
  bound = EMPTY;
}
