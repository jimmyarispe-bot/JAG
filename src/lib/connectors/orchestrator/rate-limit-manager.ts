/**
 * ConnectorRateLimitManager — track provider quotas; prevent overload.
 */

import {
  getRateLimitState,
  upsertRateLimitState,
} from "@/lib/connectors/orchestrator/store";
import type { RateLimitState } from "@/lib/connectors/orchestrator/types";

const DEFAULT_QUOTA = 100;

export type ConnectorRateLimitManager = {
  get(
    organizationId: string,
    connectorId: string
  ): RateLimitState;
  canProceed(organizationId: string, connectorId: string): boolean;
  consume(organizationId: string, connectorId: string): RateLimitState;
  reset(
    organizationId: string,
    connectorId: string,
    providerQuota?: number
  ): RateLimitState;
};

function ensure(
  organizationId: string,
  connectorId: string
): RateLimitState {
  const existing = getRateLimitState(organizationId, connectorId);
  if (existing && Date.parse(existing.resetAt) > Date.now()) {
    return existing;
  }
  return upsertRateLimitState({
    organizationId,
    connectorId,
    requests: 0,
    remaining: DEFAULT_QUOTA,
    resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    providerQuota: DEFAULT_QUOTA,
  });
}

export function createConnectorRateLimitManager(): ConnectorRateLimitManager {
  return {
    get: ensure,
    canProceed(organizationId, connectorId) {
      return ensure(organizationId, connectorId).remaining > 0;
    },
    consume(organizationId, connectorId) {
      const current = ensure(organizationId, connectorId);
      if (current.remaining <= 0) return current;
      return upsertRateLimitState({
        ...current,
        requests: current.requests + 1,
        remaining: current.remaining - 1,
      });
    },
    reset(organizationId, connectorId, providerQuota = DEFAULT_QUOTA) {
      return upsertRateLimitState({
        organizationId,
        connectorId,
        requests: 0,
        remaining: providerQuota,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        providerQuota,
      });
    },
  };
}
