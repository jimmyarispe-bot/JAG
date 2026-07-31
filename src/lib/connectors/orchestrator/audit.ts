/**
 * ConnectorAudit — every orchestrator operation becomes an event.
 */

import { randomUUID } from "node:crypto";
import {
  appendOrchestratorAudit,
  listOrchestratorAudit,
} from "@/lib/connectors/orchestrator/store";
import type {
  AuditEventKind,
  OrchestratorAuditEvent,
} from "@/lib/connectors/orchestrator/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type ConnectorAuditService = {
  record(input: {
    organizationId: string;
    connectorId: string;
    kind: AuditEventKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
  }): OrchestratorAuditEvent;
  list(organizationId: string): readonly OrchestratorAuditEvent[];
};

export function createConnectorAudit(): ConnectorAuditService {
  return {
    record(input) {
      const event: OrchestratorAuditEvent = {
        id: randomUUID(),
        organizationId: input.organizationId,
        connectorId: input.connectorId,
        kind: input.kind,
        at: new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze({ ...(input.metadata ?? {}) }),
      };
      appendOrchestratorAudit(event);
      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "connector-orchestrator",
        entityType: "ConnectorOrchestrator",
        entityId: input.connectorId,
        eventType: `orchestrator.${input.kind.toLowerCase()}`,
        actor: input.actor,
        metadata: {
          kind: input.kind,
          connectorId: input.connectorId,
          ...(input.metadata ?? {}),
        },
      });
      return event;
    },
    list(organizationId) {
      return listOrchestratorAudit(organizationId);
    },
  };
}
