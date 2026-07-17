/**
 * Integration platform + management for Executive Command Center.
 *
 * Phase 1 performance: process-level singleton (proven). Previously every request
 * recreated IntegrationPersistence and sequentially bootstrapped 10 connectors.
 * Behavior unchanged — same connectors, same bootstrap path on cold start.
 */

import { cache } from "react";
import type { IntegrationManagement } from "@/lib/platform/integrations";
import { getOrCreateIntegrationsSingleton } from "@/lib/performance/singletons";

export const getIntegrationManagement = cache(async (): Promise<IntegrationManagement> => {
  const { management } = await getOrCreateIntegrationsSingleton();
  return management;
});

/** @deprecated Prefer getIntegrationManagement().platform */
export const getIntegrationPlatform = cache(async () => {
  const management = await getIntegrationManagement();
  return management.platform;
});
