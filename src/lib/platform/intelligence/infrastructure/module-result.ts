/**
 * Intelligence Platform Infrastructure — module result helpers (Sprint 027).
 */

import type { IntelligenceExecutionContext } from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceModuleId,
  IntelligenceModuleResult,
  IntelligencePlatformMetadata,
} from "@/lib/platform/intelligence/infrastructure/types";

export function createModuleResult(options: {
  moduleId: IntelligenceModuleId;
  context: IntelligenceExecutionContext;
  startedAt: string;
  completedAt?: string;
  ok: boolean;
  data?: unknown;
  error?: string;
  metadata?: IntelligencePlatformMetadata;
}): IntelligenceModuleResult {
  const completedAt = options.completedAt ?? new Date().toISOString();
  const durationMs = Math.max(
    0,
    new Date(completedAt).getTime() - new Date(options.startedAt).getTime()
  );
  return {
    moduleId: options.moduleId,
    ok: options.ok,
    startedAt: options.startedAt,
    completedAt,
    durationMs,
    data: options.data,
    error: options.error,
    metadata: options.metadata,
  };
}
