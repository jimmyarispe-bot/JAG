import type { RuntimeActionResult } from "./action-result";
import type { ActionExecutionRequest } from "./action-types";

export interface ActionAuditRecord {
  auditEventId: string;
  actionId: string;
  principalId: string;
  effectiveUserId: string;
  organizationId: string;
  contextId: string;
  intentId?: string;
  cognitionBriefId: string;
  cognitionRecommendationId?: string;
  evidenceRefs: readonly { source: string; id: string }[];
  providerId?: string;
  status: string;
  timestamp: string;
  correlationId?: string;
  sessionId?: string;
  error?: { code: string; message: string };
  payloadSummary?: Readonly<Record<string, unknown>>;
}

/**
 * In-memory audit trail for Action Runtime.
 * Hosts may replace with platform audit adapters later.
 */
export class ActionAudit {
  private readonly records: ActionAuditRecord[] = [];
  private seq = 0;

  nextId(): string {
    return `audit_action_${++this.seq}_${Date.now().toString(36)}`;
  }

  record(
    request: ActionExecutionRequest,
    result: RuntimeActionResult,
    extras: { providerId?: string } = {}
  ): ActionAuditRecord {
    const entry: ActionAuditRecord = {
      auditEventId: result.auditEventId,
      actionId: request.actionId,
      principalId: request.identity.principalId,
      effectiveUserId: request.identity.effectiveUserId,
      organizationId: request.organizationalContext.organizationId,
      contextId: request.organizationalContext.contextId,
      intentId: request.intent?.intentId,
      cognitionBriefId: request.cognition.briefId,
      cognitionRecommendationId: request.cognitionRecommendationId,
      evidenceRefs: request.evidenceRefs.map((e) => ({
        source: e.source,
        id: e.id,
      })),
      providerId: extras.providerId ?? result.providerId,
      status: result.status,
      timestamp: result.completedAt,
      correlationId: request.correlationId,
      sessionId: request.sessionId,
      error: result.error,
      payloadSummary: summarizePayload(request.payload),
    };
    this.records.push(entry);
    return entry;
  }

  list(limit?: number): ActionAuditRecord[] {
    const all = [...this.records].reverse();
    return limit === undefined ? all : all.slice(0, limit);
  }

  clear(): void {
    this.records.length = 0;
  }
}

export function createActionAudit(): ActionAudit {
  return new ActionAudit();
}

function summarizePayload(
  payload: Readonly<Record<string, unknown>> | undefined
): Readonly<Record<string, unknown>> | undefined {
  if (!payload) return undefined;
  const keys = Object.keys(payload);
  return { keyCount: keys.length, keys: keys.slice(0, 20) };
}
