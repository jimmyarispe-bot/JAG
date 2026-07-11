/**
 * JAG Intelligence — success / support case engine (foundation).
 *
 * Case intake, classification, and lifecycle for Success Intelligence.
 * See `docs/architecture/JAG_SUCCESS_INTELLIGENCE.md`.
 */

import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type {
  IntelligenceCasePriority,
  IntelligenceCaseStatus,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Categories used during automatic case classification. */
export const INTELLIGENCE_CASE_CATEGORIES = [
  "authentication",
  "payments",
  "billing",
  "student_information",
  "scheduling",
  "attendance",
  "reporting",
  "communications",
  "notifications",
  "email",
  "printing",
  "mobile",
  "performance",
  "permissions",
  "integrations",
  "general",
] as const;
export type IntelligenceCaseCategory = (typeof INTELLIGENCE_CASE_CATEGORIES)[number];

/** Support case record (foundation shape). */
export interface IntelligenceCase {
  caseId: string;
  organizationId: string | null;
  schoolId: string | null;
  reporterUserId: string | null;
  workspace?: string;
  category: IntelligenceCaseCategory;
  status: IntelligenceCaseStatus;
  priority: IntelligenceCasePriority;
  subject: string;
  description?: string;
  affectedModule?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  metadata?: IntelligenceMetadata;
}

/** Intake payload for opening a new case. */
export interface IntelligenceCaseIntakeInput {
  subject: string;
  description?: string;
  category?: IntelligenceCaseCategory;
  priority?: IntelligenceCasePriority;
  workspace?: string;
  affectedModule?: string;
  sessionId?: string;
  metadata?: IntelligenceMetadata;
}

/** Transition a case to a new status. */
export interface IntelligenceCaseTransitionInput {
  caseId: string;
  status: IntelligenceCaseStatus;
  note?: string;
  metadata?: IntelligenceMetadata;
}

/**
 * Success Intelligence case lifecycle engine.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceCaseEngine {
  /**
   * Open a new support case from user or system intake.
   * @throws Always — not implemented in the foundation layer.
   */
  intake(_context: IntelligenceContext, _input: IntelligenceCaseIntakeInput): IntelligenceCase {
    throw new Error("JAG Intelligence foundation: IntelligenceCaseEngine.intake is not implemented");
  }

  /**
   * Classify or reclassify an open case.
   * @throws Always — not implemented in the foundation layer.
   */
  classify(
    _context: IntelligenceContext,
    _caseId: string,
    _category: IntelligenceCaseCategory
  ): IntelligenceCase {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceCaseEngine.classify is not implemented"
    );
  }

  /**
   * Transition a case through its lifecycle.
   * @throws Always — not implemented in the foundation layer.
   */
  transition(
    _context: IntelligenceContext,
    _input: IntelligenceCaseTransitionInput
  ): IntelligenceCase {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceCaseEngine.transition is not implemented"
    );
  }

  /**
   * Load a case by id within tenant scope.
   * @throws Always — not implemented in the foundation layer.
   */
  getById(_context: IntelligenceContext, _caseId: string): IntelligenceCase | null {
    throw new Error("JAG Intelligence foundation: IntelligenceCaseEngine.getById is not implemented");
  }
}
