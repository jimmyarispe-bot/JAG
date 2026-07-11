/**
 * JAG Intelligence — cognitive context builder (foundation).
 *
 * Assembles tenant, actor, session, and domain scope for a pipeline run.
 */

import type {
  IntelligenceActor,
  IntelligenceDomain,
  IntelligenceMetadata,
  IntelligenceTenantScope,
} from "@/lib/platform/intelligence/types";

/** Session / conversation context attached to short-term memory. */
export interface IntelligenceSessionContext {
  sessionId: string;
  conversationId?: string;
  workflowKey?: string;
  startedAt: string;
  metadata?: IntelligenceMetadata;
}

/** Fully resolved context for a cognitive operation. */
export interface IntelligenceContext {
  scope: IntelligenceTenantScope;
  actor: IntelligenceActor;
  domain: IntelligenceDomain;
  session: IntelligenceSessionContext | null;
  permissions: string[];
  locale?: string;
  metadata?: IntelligenceMetadata;
}

/** Input used to build an {@link IntelligenceContext}. */
export interface BuildIntelligenceContextInput {
  organizationId?: string | null;
  schoolId?: string | null;
  userId?: string | null;
  roleKeys?: string[];
  domain: IntelligenceDomain;
  sessionId?: string;
  conversationId?: string;
  workflowKey?: string;
  permissions?: string[];
  locale?: string;
  metadata?: IntelligenceMetadata;
}

/**
 * Builds and validates intelligence context for cognitive services.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceContextService {
  /**
   * Resolve a full {@link IntelligenceContext} from request inputs.
   * @throws Always — not implemented in the foundation layer.
   */
  build(_input: BuildIntelligenceContextInput): IntelligenceContext {
    throw new Error("JAG Intelligence foundation: IntelligenceContextService.build is not implemented");
  }

  /**
   * Validate that a context satisfies tenant isolation and required fields.
   * @throws Always — not implemented in the foundation layer.
   */
  validate(_context: IntelligenceContext): boolean {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceContextService.validate is not implemented"
    );
  }
}
