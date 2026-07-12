/**
 * JAG Intelligence — domain contracts (infrastructure).
 *
 * Defines the interface every Intelligence domain module must satisfy
 * before registration and routing.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type { IntelligenceEvent } from "@/lib/platform/intelligence/events";
import type { IntelligenceKnowledgeResult } from "@/lib/platform/intelligence/knowledge/foundation";
import type { IntelligenceLearningRecord } from "@/lib/platform/intelligence/learning";
import type { IntelligenceMemoryEntry } from "@/lib/platform/intelligence/memory";
import type { IntelligenceResult } from "@/lib/platform/intelligence/orchestrator";
import type { IntelligencePlan } from "@/lib/platform/intelligence/planner";
import type { IntelligenceReasoningResult } from "@/lib/platform/intelligence/reasoning";
import {
  INTELLIGENCE_DOMAINS,
  INTELLIGENCE_ENGINE_VERSION,
  INTELLIGENCE_RUN_STATUSES,
  type IntelligenceConfidenceScore,
  type IntelligenceDomain,
  type IntelligenceExplanation,
  type IntelligenceRunRequest,
  type IntelligenceRunStatus,
} from "@/lib/platform/intelligence/types";

/** Validation issue codes for domain contract checks. */
export const INTELLIGENCE_DOMAIN_VALIDATION_CODES = [
  "missing_domain_key",
  "invalid_domain_key",
  "missing_name",
  "missing_version",
  "missing_handle",
  "invalid_handle",
] as const;

export type IntelligenceDomainValidationCode =
  (typeof INTELLIGENCE_DOMAIN_VALIDATION_CODES)[number];

export interface IntelligenceDomainValidationIssue {
  code: IntelligenceDomainValidationCode;
  message: string;
}

export interface IntelligenceDomainValidationResult {
  ok: boolean;
  issues: IntelligenceDomainValidationIssue[];
}

/**
 * Contract every Intelligence domain implementation must satisfy.
 * Domains plug into the registry/router — they do not own the pipeline.
 */
export interface IntelligenceDomainModule {
  /** Canonical domain key from {@link INTELLIGENCE_DOMAINS}. */
  readonly domainKey: IntelligenceDomain;
  /** Human-readable domain name. */
  readonly name: string;
  /** Domain pack semantic version. */
  readonly version: string;
  /**
   * Handle a run request for this domain.
   * Implementations may call the orchestrator or domain-specific engines.
   */
  handle(request: IntelligenceRunRequest): Promise<IntelligenceResult>;
}

/** Type guard: value is a known {@link IntelligenceDomain} key. */
export function isIntelligenceDomain(value: unknown): value is IntelligenceDomain {
  return (
    typeof value === "string" &&
    (INTELLIGENCE_DOMAINS as readonly string[]).includes(value)
  );
}

/**
 * Validate that a candidate satisfies {@link IntelligenceDomainModule}.
 * Invalid domains fail with structured issues (no throw).
 */
export function validateIntelligenceDomain(
  candidate: unknown
): IntelligenceDomainValidationResult {
  const issues: IntelligenceDomainValidationIssue[] = [];

  if (candidate === null || typeof candidate !== "object") {
    return {
      ok: false,
      issues: [
        {
          code: "missing_domain_key",
          message: "Domain candidate must be a non-null object",
        },
      ],
    };
  }

  const module = candidate as Partial<IntelligenceDomainModule>;
  const domainKey = (candidate as { domainKey?: unknown }).domainKey;

  if (domainKey === undefined || domainKey === null || domainKey === "") {
    issues.push({
      code: "missing_domain_key",
      message: "Domain module is missing domainKey",
    });
  } else if (!isIntelligenceDomain(domainKey)) {
    issues.push({
      code: "invalid_domain_key",
      message: `Domain key "${String(domainKey)}" is not a registered Intelligence domain`,
    });
  }

  if (typeof module.name !== "string" || module.name.trim().length === 0) {
    issues.push({
      code: "missing_name",
      message: "Domain module is missing name",
    });
  }

  if (typeof module.version !== "string" || module.version.trim().length === 0) {
    issues.push({
      code: "missing_version",
      message: "Domain module is missing version",
    });
  }

  if (module.handle === undefined || module.handle === null) {
    issues.push({
      code: "missing_handle",
      message: "Domain module is missing handle()",
    });
  } else if (typeof module.handle !== "function") {
    issues.push({
      code: "invalid_handle",
      message: "Domain module handle must be a function",
    });
  }

  return { ok: issues.length === 0, issues };
}

/** Assert a candidate is a valid domain module; throws on failure. */
export function assertIntelligenceDomain(
  candidate: unknown
): asserts candidate is IntelligenceDomainModule {
  const result = validateIntelligenceDomain(candidate);
  if (!result.ok) {
    const detail = result.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid Intelligence domain module: ${detail}`);
  }
}

const RESULT_REQUIRED_KEYS = [
  "runId",
  "status",
  "engineVersion",
  "context",
  "knowledge",
  "memory",
  "reasoning",
  "confidence",
  "plan",
  "explanation",
  "learning",
  "events",
  "completedAt",
] as const;

/**
 * Runtime shape check for {@link IntelligenceResult}.
 * Structural only — does not deep-validate nested service payloads.
 */
export function isIntelligenceResult(value: unknown): value is IntelligenceResult {
  if (value === null || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;

  for (const key of RESULT_REQUIRED_KEYS) {
    if (!(key in result)) return false;
  }

  if (typeof result.runId !== "string" || result.runId.length === 0) return false;
  if (typeof result.engineVersion !== "string") return false;
  if (typeof result.completedAt !== "string") return false;
  if (!Array.isArray(result.memory)) return false;
  if (!Array.isArray(result.events)) return false;
  if (
    typeof result.status !== "string" ||
    !(INTELLIGENCE_RUN_STATUSES as readonly string[]).includes(result.status)
  ) {
    return false;
  }

  return true;
}

/**
 * Build a minimal valid {@link IntelligenceResult} for infrastructure tests / stubs.
 * Not a production cognitive outcome — structural fixture only.
 */
export function createEmptyIntelligenceResult(
  overrides: Partial<IntelligenceResult> &
    Pick<IntelligenceResult, "runId" | "context">
): IntelligenceResult {
  const status: IntelligenceRunStatus = overrides.status ?? "completed";
  const confidence: IntelligenceConfidenceScore = overrides.confidence ?? {
    value: 0,
    level: "unknown",
    factors: [],
  };
  const knowledge: IntelligenceKnowledgeResult = overrides.knowledge ?? {
    nodes: [],
    query: {},
    retrievedAt: new Date().toISOString(),
  };
  const memory: IntelligenceMemoryEntry[] = overrides.memory ?? [];
  const reasoning: IntelligenceReasoningResult = overrides.reasoning ?? {
    hypotheses: [],
    primaryHypothesis: null,
    reasoningNotes: [],
  };
  const plan: IntelligencePlan = overrides.plan ?? {
    planId: `${overrides.runId}:plan`,
    steps: [],
    primaryRecommendation: null,
    summary: "",
  };
  const explanation: IntelligenceExplanation = overrides.explanation ?? {
    summary: "",
  };
  const learning: IntelligenceLearningRecord = overrides.learning ?? {
    learningId: `${overrides.runId}:learning`,
    domain: overrides.context.domain,
    outcomeId: `${overrides.runId}:outcome`,
    summary: "",
    success: false,
    organizationId: overrides.context.scope.organizationId,
    schoolId: overrides.context.scope.schoolId,
    createdAt: new Date().toISOString(),
  };
  const events: IntelligenceEvent[] = overrides.events ?? [];
  const context: IntelligenceContext = overrides.context;

  return {
    runId: overrides.runId,
    status,
    engineVersion: overrides.engineVersion ?? INTELLIGENCE_ENGINE_VERSION,
    context,
    knowledge,
    memory,
    reasoning,
    confidence,
    plan,
    explanation,
    learning,
    events,
    completedAt: overrides.completedAt ?? new Date().toISOString(),
    metadata: overrides.metadata,
  };
}
