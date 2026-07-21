/**
 * Connector lifecycle management — auditable state transitions.
 *
 * States: Installing → Authenticating → Connected → Syncing →
 * Healthy | Warning | Error | Disabled | Disconnected
 */

import type {
  ConnectorLifecycleState,
  LifecycleTransition,
} from "@/lib/platform/integrations/types";

const ALLOWED: Record<ConnectorLifecycleState, readonly ConnectorLifecycleState[]> = {
  installing: ["authenticating", "error", "disabled", "disconnected"],
  authenticating: ["connected", "error", "disconnected"],
  connected: ["syncing", "healthy", "warning", "error", "disabled", "disconnected"],
  syncing: ["healthy", "warning", "error", "connected"],
  healthy: ["syncing", "warning", "error", "disabled", "disconnected"],
  warning: ["syncing", "healthy", "error", "disabled", "disconnected"],
  error: ["authenticating", "syncing", "connected", "disabled", "disconnected"],
  disabled: ["installing", "disconnected"],
  disconnected: ["installing", "authenticating"],
};

export class LifecycleManager {
  private readonly states = new Map<string, ConnectorLifecycleState>();
  private readonly audit: LifecycleTransition[] = [];
  private seq = 0;

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly createId: (prefix: string) => string = (prefix) =>
      `${prefix}-${++this.seq}`
  ) {}

  getState(instanceId: string): ConnectorLifecycleState {
    return this.states.get(instanceId) ?? "disconnected";
  }

  canTransition(from: ConnectorLifecycleState, to: ConnectorLifecycleState): boolean {
    return ALLOWED[from].includes(to);
  }

  transition(input: {
    connectorId: string;
    instanceId: string;
    to: ConnectorLifecycleState;
    reason: string;
    metadata?: Record<string, unknown>;
  }): LifecycleTransition {
    const from = this.getState(input.instanceId);
    if (from !== input.to && !this.canTransition(from, input.to)) {
      throw new Error(
        `Invalid lifecycle transition for ${input.instanceId}: ${from} → ${input.to}`
      );
    }

    this.states.set(input.instanceId, input.to);
    const entry: LifecycleTransition = {
      id: this.createId("lifecycle"),
      connectorId: input.connectorId,
      instanceId: input.instanceId,
      from,
      to: input.to,
      reason: input.reason,
      occurredAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.audit.unshift(entry);
    if (this.audit.length > 1_000) this.audit.length = 1_000;
    return entry;
  }

  listAudit(instanceId?: string, limit = 50): LifecycleTransition[] {
    const rows = instanceId
      ? this.audit.filter((row) => row.instanceId === instanceId)
      : this.audit;
    return rows.slice(0, limit);
  }

  /** Seed state without audit (tests / bootstrap). */
  seed(instanceId: string, state: ConnectorLifecycleState): void {
    this.states.set(instanceId, state);
  }
}

export { ALLOWED as LIFECYCLE_TRANSITIONS };
