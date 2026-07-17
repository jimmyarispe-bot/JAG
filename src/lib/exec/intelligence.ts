/**
 * Request-scoped access to the wired intelligence DI container.
 * ECC pages must consume stacks through this helper — never bypass abstractions.
 *
 * Phase 1 performance: process-level singleton (proven). React cache() still
 * dedupes within a request. Behavior unchanged — same service graph.
 *
 * Scope: use getExecRuntime() / DEMO_EXEC_SCOPE — never a silent demo default (C-A2).
 */

import { cache } from "react";
import { getOrCreateIntelligenceSingleton } from "@/lib/performance/singletons";
import { DEMO_EXEC_SCOPE } from "@/lib/exec/scope";

export const getExecIntelligence = cache(() => {
  return getOrCreateIntelligenceSingleton().service;
});

/** @deprecated Use getExecRuntime() or DEMO_EXEC_SCOPE — renamed for C-A2 clarity. */
export const DEFAULT_EXEC_SCOPE = DEMO_EXEC_SCOPE;

export { DEMO_EXEC_SCOPE, DEMO_EXEC_ORGANIZATION_ID, getExecRuntime } from "@/lib/exec/scope";
export type { ExecOperatingMode, ExecRuntime, ExecScope } from "@/lib/exec/scope";
