/**
 * Request-scoped access to the wired intelligence DI container.
 * ECC pages must consume stacks through this helper — never bypass abstractions.
 *
 * Phase 1 performance: process-level singleton (proven). React cache() still
 * dedupes within a request. Behavior unchanged — same service graph.
 */

import { cache } from "react";
import { getOrCreateIntelligenceSingleton } from "@/lib/performance/singletons";

export const getExecIntelligence = cache(() => {
  return getOrCreateIntelligenceSingleton().service;
});

export const DEFAULT_EXEC_SCOPE = {
  organizationId: "exec-demo-org",
  schoolId: null as string | null,
} as const;
