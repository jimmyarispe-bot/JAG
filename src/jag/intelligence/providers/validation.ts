/**
 * Validate provider outputs against Executive Intelligence contracts.
 * Rejects unsupported / forbidden evidence kinds if injected.
 */

import { isAssumption } from "@/jag/intelligence/contracts/assumption";
import { isConfidence } from "@/jag/intelligence/contracts/confidence";
import { isDecisionTraceStep } from "@/jag/intelligence/contracts/decision-trace";
import { isExplanation } from "@/jag/intelligence/contracts/explanation";
import { isFinding } from "@/jag/intelligence/contracts/finding";
import { isRecommendation } from "@/jag/intelligence/contracts/recommendation";
import {
  FORBIDDEN_EVIDENCE_KINDS,
  ORGANIZATIONAL_EVIDENCE_KINDS,
} from "@/jag/intelligence/evidence/reference-kinds";
import type { IntelligenceProvider } from "@/jag/intelligence/providers/intelligence-provider";
import { isProviderCapabilities } from "@/jag/intelligence/providers/capabilities";
import type {
  IntelligenceProviderArtifacts,
  IntelligenceProviderResponse,
} from "@/jag/intelligence/providers/response";
import type {
  IntelligenceValidationIssue,
  IntelligenceValidationResult,
} from "@/jag/intelligence/validation/validate-contracts";

function issue(
  path: string,
  code: string,
  message: string
): IntelligenceValidationIssue {
  return { path, code, message };
}

export function validateIntelligenceProvider(
  provider: IntelligenceProvider
): IntelligenceValidationResult {
  const issues: IntelligenceValidationIssue[] = [];
  if (!provider.id) {
    issues.push(issue("id", "invalid", "Provider id is required"));
  }
  if (!provider.displayName) {
    issues.push(
      issue("displayName", "invalid", "Provider displayName is required")
    );
  }
  if (!isProviderCapabilities(provider.capabilities)) {
    issues.push(
      issue("capabilities", "invalid", "Provider capabilities are invalid")
    );
  }
  if (typeof provider.reason !== "function") {
    issues.push(issue("reason", "invalid", "Provider.reason must be a function"));
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Scan a payload for evidence-like references with bad kinds.
 * Used to reject provider injection of forbidden/unknown kinds.
 * Skips `diagnostics` trees — raw completions live there as non-evidence.
 */
export function collectInjectedEvidenceKindIssues(
  value: unknown,
  path = "response"
): IntelligenceValidationIssue[] {
  const issues: IntelligenceValidationIssue[] = [];

  function walk(node: unknown, current: string): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${current}[${i}]`));
      return;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.kind === "string" && typeof obj.refId === "string") {
      const kind = obj.kind;
      if ((FORBIDDEN_EVIDENCE_KINDS as readonly string[]).includes(kind)) {
        issues.push(
          issue(
            current,
            "forbidden_kind",
            `Provider must not inject forbidden evidence kind "${kind}"`
          )
        );
      } else if (
        !(ORGANIZATIONAL_EVIDENCE_KINDS as readonly string[]).includes(kind)
      ) {
        issues.push(
          issue(
            current,
            "unknown_kind",
            `Provider must not inject unsupported evidence kind "${kind}"`
          )
        );
      }
    }
    for (const [key, child] of Object.entries(obj)) {
      if (key === "diagnostics") continue;
      walk(child, `${current}.${key}`);
    }
  }

  walk(value, path);
  return issues;
}

export function validateProviderArtifacts(
  artifacts: IntelligenceProviderArtifacts
): IntelligenceValidationResult {
  const issues: IntelligenceValidationIssue[] = [];

  if (!Array.isArray(artifacts.findings) || !artifacts.findings.every(isFinding)) {
    issues.push(
      issue("artifacts.findings", "invalid", "Findings must satisfy EI contracts")
    );
  }
  if (
    !Array.isArray(artifacts.recommendations) ||
    !artifacts.recommendations.every(isRecommendation)
  ) {
    issues.push(
      issue(
        "artifacts.recommendations",
        "invalid",
        "Recommendations must satisfy EI contracts"
      )
    );
  }
  if (!isExplanation(artifacts.explanation)) {
    issues.push(
      issue(
        "artifacts.explanation",
        "invalid",
        "Explanation must satisfy EI contracts"
      )
    );
  }
  if (!isConfidence(artifacts.confidence)) {
    issues.push(
      issue(
        "artifacts.confidence",
        "invalid",
        "Confidence must satisfy EI contracts"
      )
    );
  }
  if (
    artifacts.assumptions !== undefined &&
    (!Array.isArray(artifacts.assumptions) ||
      !artifacts.assumptions.every(isAssumption))
  ) {
    issues.push(
      issue(
        "artifacts.assumptions",
        "invalid",
        "Assumptions must satisfy EI contracts"
      )
    );
  }
  if (
    artifacts.decisionTraceSteps !== undefined &&
    (!Array.isArray(artifacts.decisionTraceSteps) ||
      !artifacts.decisionTraceSteps.every(isDecisionTraceStep))
  ) {
    issues.push(
      issue(
        "artifacts.decisionTraceSteps",
        "invalid",
        "Decision trace steps must satisfy EI contracts"
      )
    );
  }

  issues.push(...collectInjectedEvidenceKindIssues(artifacts, "artifacts"));

  return { ok: issues.length === 0, issues };
}

export function validateProviderResponse(
  response: IntelligenceProviderResponse
): IntelligenceValidationResult {
  if (!response?.artifacts) {
    return {
      ok: false,
      issues: [issue("response", "invalid", "Response artifacts are required")],
    };
  }
  return validateProviderArtifacts(response.artifacts);
}
