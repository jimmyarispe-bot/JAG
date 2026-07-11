/**
 * JAG Intelligence — event catalog (foundation).
 *
 * Domain events emitted by the cognitive pipeline and case engine.
 */

import type { EventDefinition } from "@/lib/platform/events/types";
import type { IntelligenceContext } from "@/lib/platform/intelligence/context";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Canonical intelligence event type keys. */
export const INTELLIGENCE_EVENT_TYPES = [
  "intelligence.run.started",
  "intelligence.run.completed",
  "intelligence.hypothesis.generated",
  "intelligence.recommendation.created",
  "intelligence.action.executed",
  "intelligence.outcome.recorded",
  "intelligence.learning.recorded",
  "intelligence.case.opened",
  "intelligence.case.resolved",
] as const;
export type IntelligenceEventType = (typeof INTELLIGENCE_EVENT_TYPES)[number];

/** Envelope for an intelligence-domain event (foundation shape). */
export interface IntelligenceEvent {
  eventType: IntelligenceEventType;
  eventId: string;
  occurredAt: string;
  organizationId: string | null;
  schoolId: string | null;
  runId?: string;
  caseId?: string;
  payload: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/** Input to publish an intelligence event. */
export interface PublishIntelligenceEventInput {
  eventType: IntelligenceEventType;
  runId?: string;
  caseId?: string;
  payload?: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/**
 * Reference event definitions for the JAG Intelligence catalog.
 * Domain modules may register additional types at a later phase.
 */
export const INTELLIGENCE_EVENT_DEFINITIONS: EventDefinition[] = [
  {
    eventType: "intelligence.run.started",
    name: "Intelligence Run Started",
    description: "A JAG Intelligence pipeline run has started",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_run"],
    sortOrder: 200,
    tags: ["intelligence", "pipeline"],
  },
  {
    eventType: "intelligence.run.completed",
    name: "Intelligence Run Completed",
    description: "A JAG Intelligence pipeline run completed",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_run"],
    sortOrder: 210,
    tags: ["intelligence", "pipeline"],
  },
  {
    eventType: "intelligence.hypothesis.generated",
    name: "Hypothesis Generated",
    description: "Reasoning engine produced one or more hypotheses",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "async",
    scopes: ["internal"],
    entityTypes: ["intelligence_hypothesis"],
    sortOrder: 220,
    tags: ["intelligence", "reasoning"],
  },
  {
    eventType: "intelligence.recommendation.created",
    name: "Recommendation Created",
    description: "Planner produced a recommendation",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_recommendation"],
    sortOrder: 230,
    tags: ["intelligence", "planner"],
  },
  {
    eventType: "intelligence.action.executed",
    name: "Intelligence Action Executed",
    description: "An authorized intelligence action was executed",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_execution"],
    sortOrder: 240,
    tags: ["intelligence", "execution"],
  },
  {
    eventType: "intelligence.outcome.recorded",
    name: "Outcome Recorded",
    description: "Outcome of an intelligence action was measured",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_outcome"],
    sortOrder: 250,
    tags: ["intelligence", "learning"],
  },
  {
    eventType: "intelligence.learning.recorded",
    name: "Learning Recorded",
    description: "Learning loop recorded an institutional improvement signal",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "async",
    scopes: ["internal"],
    entityTypes: ["intelligence_learning"],
    sortOrder: 260,
    tags: ["intelligence", "learning"],
  },
  {
    eventType: "intelligence.case.opened",
    name: "Intelligence Case Opened",
    description: "Success Intelligence support case opened",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_case"],
    sortOrder: 270,
    tags: ["intelligence", "success", "case"],
  },
  {
    eventType: "intelligence.case.resolved",
    name: "Intelligence Case Resolved",
    description: "Success Intelligence support case resolved",
    domain: "intelligence",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["intelligence_case"],
    sortOrder: 280,
    tags: ["intelligence", "success", "case"],
  },
];

/**
 * Publishes and catalogs JAG Intelligence domain events.
 * Business logic deferred — foundation stub only.
 */
export class IntelligenceEventService {
  /**
   * Publish an intelligence-domain event.
   * @throws Always — not implemented in the foundation layer.
   */
  publish(
    _context: IntelligenceContext,
    _input: PublishIntelligenceEventInput
  ): IntelligenceEvent {
    throw new Error(
      "JAG Intelligence foundation: IntelligenceEventService.publish is not implemented"
    );
  }

  /**
   * Return the foundation event catalog.
   */
  listDefinitions(): EventDefinition[] {
    return INTELLIGENCE_EVENT_DEFINITIONS;
  }
}
