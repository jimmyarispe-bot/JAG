/**
 * Structural validation for Executive Intelligence contracts.
 */

import { isExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
import { isExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import { isIntelligenceContext } from "@/jag/intelligence/contracts/context";
import { isEvidence } from "@/jag/intelligence/contracts/evidence";
import {
  FORBIDDEN_EVIDENCE_KINDS,
  ORGANIZATIONAL_EVIDENCE_KINDS,
} from "@/jag/intelligence/evidence/reference-kinds";
import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import type { ExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
import type { ExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import type { IntelligenceContext } from "@/jag/intelligence/contracts/context";

export type IntelligenceValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type IntelligenceValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly IntelligenceValidationIssue[];
};

function issue(
  path: string,
  code: string,
  message: string
): IntelligenceValidationIssue {
  return { path, code, message };
}

export function validateExecutiveQuestion(
  question: ExecutiveQuestion
): IntelligenceValidationResult {
  if (!isExecutiveQuestion(question)) {
    return {
      ok: false,
      issues: [issue("question", "invalid", "Question contract is invalid")],
    };
  }
  return { ok: true, issues: [] };
}

export function validateIntelligenceContext(
  context: IntelligenceContext
): IntelligenceValidationResult {
  if (!isIntelligenceContext(context)) {
    return {
      ok: false,
      issues: [issue("context", "invalid", "Context contract is invalid")],
    };
  }
  return { ok: true, issues: [] };
}

export function validateEvidenceSet(
  evidence: readonly Evidence[]
): IntelligenceValidationResult {
  const issues: IntelligenceValidationIssue[] = [];
  evidence.forEach((item, index) => {
    if (!isEvidence(item)) {
      issues.push(
        issue(`evidence[${index}]`, "invalid", "Evidence contract is invalid")
      );
      return;
    }
    for (const [refIndex, ref] of item.references.entries()) {
      const path = `evidence[${index}].references[${refIndex}]`;
      if (
        (FORBIDDEN_EVIDENCE_KINDS as readonly string[]).includes(ref.kind)
      ) {
        issues.push(
          issue(path, "forbidden_kind", `Evidence kind "${ref.kind}" is forbidden`)
        );
        continue;
      }
      if (
        !(ORGANIZATIONAL_EVIDENCE_KINDS as readonly string[]).includes(ref.kind)
      ) {
        issues.push(
          issue(
            path,
            "unknown_kind",
            `Evidence kind "${ref.kind}" is not an organizational concept`
          )
        );
      }
    }
  });
  return { ok: issues.length === 0, issues };
}

export function validateExecutiveAnswer(
  answer: ExecutiveAnswer
): IntelligenceValidationResult {
  const issues: IntelligenceValidationIssue[] = [];
  if (!isExecutiveAnswer(answer)) {
    issues.push(issue("answer", "invalid", "Answer contract is invalid"));
    return { ok: false, issues };
  }

  const evidenceIds = new Set(answer.evidence.map((e) => e.id));
  for (const finding of answer.findings) {
    for (const eid of finding.evidenceIds) {
      if (!evidenceIds.has(eid)) {
        issues.push(
          issue(
            `findings.${finding.id}`,
            "dangling_evidence",
            `Finding references missing evidence "${eid}"`
          )
        );
      }
    }
  }

  const evidenceCheck = validateEvidenceSet(answer.evidence);
  issues.push(...evidenceCheck.issues);

  return { ok: issues.length === 0, issues };
}
