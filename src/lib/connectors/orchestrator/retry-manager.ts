/**
 * ConnectorRetryManager — configurable retry policy (connector-agnostic).
 */

import {
  getConsecutiveFailures,
  getRetryPolicy,
  setConsecutiveFailures,
  setRetryPolicy,
  DEFAULT_RETRY,
} from "@/lib/connectors/orchestrator/store";
import type { RetryPolicy } from "@/lib/connectors/orchestrator/types";

export type ConnectorRetryManager = {
  getPolicy(organizationId: string, connectorId: string): RetryPolicy;
  setPolicy(
    organizationId: string,
    connectorId: string,
    policy: Partial<RetryPolicy>
  ): RetryPolicy;
  shouldRetry(input: {
    organizationId: string;
    connectorId: string;
    attempt: number;
  }): boolean;
  nextDelayMs(input: {
    organizationId: string;
    connectorId: string;
    attempt: number;
  }): number;
  recordFailure(organizationId: string, connectorId: string): number;
  recordSuccess(organizationId: string, connectorId: string): void;
  isFailureThresholdExceeded(
    organizationId: string,
    connectorId: string
  ): boolean;
};

export function createConnectorRetryManager(): ConnectorRetryManager {
  return {
    getPolicy: getRetryPolicy,
    setPolicy(organizationId, connectorId, policy) {
      const current = getRetryPolicy(organizationId, connectorId);
      const next: RetryPolicy = {
        maxRetries: policy.maxRetries ?? current.maxRetries,
        backoffMs: policy.backoffMs ?? current.backoffMs,
        retryWindowMs: policy.retryWindowMs ?? current.retryWindowMs,
        failureThreshold:
          policy.failureThreshold ?? current.failureThreshold,
      };
      setRetryPolicy(organizationId, connectorId, next);
      return next;
    },
    shouldRetry({ organizationId, connectorId, attempt }) {
      const policy = getRetryPolicy(organizationId, connectorId);
      return attempt < policy.maxRetries;
    },
    nextDelayMs({ organizationId, connectorId, attempt }) {
      const policy = getRetryPolicy(organizationId, connectorId);
      return policy.backoffMs * Math.max(1, 2 ** Math.max(0, attempt - 1));
    },
    recordFailure(organizationId, connectorId) {
      const next = getConsecutiveFailures(organizationId, connectorId) + 1;
      setConsecutiveFailures(organizationId, connectorId, next);
      return next;
    },
    recordSuccess(organizationId, connectorId) {
      setConsecutiveFailures(organizationId, connectorId, 0);
    },
    isFailureThresholdExceeded(organizationId, connectorId) {
      const policy = getRetryPolicy(organizationId, connectorId);
      return (
        getConsecutiveFailures(organizationId, connectorId) >=
        policy.failureThreshold
      );
    },
  };
}

export { DEFAULT_RETRY };
