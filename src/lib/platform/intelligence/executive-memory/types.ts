/**
 * Executive Memory Intelligence — shared types / DTOs (Sprint 063).
 *
 * Leaf module: soft-reads briefing/synthesis via light contracts only.
 * Package path is `executive-memory` (not `memory/`) to avoid regenerating
 * Sprint 009 persistent intelligence memory.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const EXECUTIVE_MEMORY_VERSION = "0.1.0";
export const EXECUTIVE_MEMORY_MODULE_ID = "executive-memory" as const;

export const MEMORY_ENTITY_KINDS = [
  "decision",
  "briefing",
  "risk",
  "opportunity",
  "initiative",
  "meeting",
  "outcome",
  "lesson",
  "kpi_change",
  "milestone",
  "compliance_event",
] as const;

export const MEMORY_RELATIONSHIP_KINDS = [
  "derived_from",
  "led_to",
  "mitigates",
  "realizes",
  "supports",
  "contradicts",
  "recurs",
  "archived_as",
  "owned_by",
  "evidenced_by",
] as const;

export const MEMORY_RETENTION_POLICIES = [
  "permanent",
  "archive",
  "expire",
  "legal_hold",
] as const;

export const MEMORY_DECISION_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "deferred",
  "in_progress",
  "completed",
  "reversed",
] as const;

export type MemoryEntityKind = (typeof MEMORY_ENTITY_KINDS)[number];
export type MemoryRelationshipKind = (typeof MEMORY_RELATIONSHIP_KINDS)[number];
export type MemoryRetentionPolicy = (typeof MEMORY_RETENTION_POLICIES)[number];
export type MemoryDecisionStatus = (typeof MEMORY_DECISION_STATUSES)[number];
export type MemoryMetadata = Record<string, unknown>;

export interface MemoryScope {
  organizationId: string | null;
  schoolId: string | null;
}

export interface MemoryEvidence {
  id: string;
  domain?: string;
  statement: string;
  weight?: number;
  supporting?: boolean;
  sourceEntityId?: string;
}

/** Soft-read of BriefingResult for DI / pipeline adapters. */
export interface BriefingResultLight extends ResultLightBase {
  requestId?: string;
  version?: string;
  generatedAt?: string;
  healthScore?: { value?: number; label?: string };
  briefing?: {
    id?: string;
    greeting?: string;
    sections?: {
      executiveSummary?: string;
      topRisks?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        severity?: number;
        urgency?: number;
        confidence?: number;
        domains?: string[];
        status?: string;
      }>;
      topOpportunities?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        category?: string;
        estimatedImpact?: number;
        confidence?: number;
        domains?: string[];
      }>;
      decisionsWaiting?: Array<{
        id?: string;
        title?: string;
        decisionNeeded?: string;
        why?: string;
        recommendedDecision?: string;
        impactIfDelayed?: string;
        confidence?: number;
        domains?: string[];
      }>;
      criticalAlerts?: Array<{ id?: string; title?: string; summary?: string }>;
      recommendedActions?: Array<{ id?: string; title?: string; summary?: string }>;
    };
    explainability?: {
      why?: string;
      contributingDomains?: string[];
      confidence?: number;
    };
  };
  overnight?: {
    summary?: string;
    newRisks?: string[];
    resolvedRisks?: string[];
    newOpportunities?: string[];
    financialMovement?: string[];
    staffingChanges?: string[];
    fundingUpdates?: string[];
    strategicChanges?: string[];
  };
  decisionQueue?: Array<{
    id?: string;
    title?: string;
    decisionNeeded?: string;
    why?: string;
    recommendedDecision?: string;
    impactIfDelayed?: string;
    confidence?: number;
    domains?: string[];
  }>;
  opportunityQueue?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    category?: string;
    estimatedImpact?: number;
    confidence?: number;
    domains?: string[];
  }>;
  contributingDomains?: string[];
}

export interface MemoryEntityBase {
  id: string;
  kind: MemoryEntityKind;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  scope: MemoryScope;
  domains: string[];
  tags: string[];
  confidence: number;
  evidence: MemoryEvidence[];
  retention: MemoryRetentionPolicy;
  expiresAt?: string | null;
  sourceIds: string[];
  metadata: MemoryMetadata;
}

export interface DecisionMemory extends MemoryEntityBase {
  kind: "decision";
  decision: string;
  owner?: string;
  alternatives: string[];
  expectedOutcome?: string;
  actualOutcome?: string;
  status: MemoryDecisionStatus;
  decidedAt?: string;
}

export interface BriefingMemory extends MemoryEntityBase {
  kind: "briefing";
  period: "daily" | "weekly" | "monthly" | "quarterly";
  greeting?: string;
  executiveSummary: string;
  briefingId?: string;
}

export interface RiskMemory extends MemoryEntityBase {
  kind: "risk";
  severity: number;
  urgency: number;
  status: "open" | "elevated" | "resolved" | "watch";
  firstSeenAt: string;
  lastSeenAt: string;
  recurrenceCount: number;
}

export interface OpportunityMemory extends MemoryEntityBase {
  kind: "opportunity";
  category: string;
  estimatedImpact: number;
  status: "open" | "pursued" | "realized" | "dismissed";
}

export interface InitiativeMemory extends MemoryEntityBase {
  kind: "initiative";
  owner?: string;
  status: "proposed" | "active" | "completed" | "cancelled";
  relatedDecisionIds: string[];
}

export interface MeetingMemory extends MemoryEntityBase {
  kind: "meeting";
  attendees: string[];
  topics: string[];
  heldAt: string;
}

export interface OutcomeMemory extends MemoryEntityBase {
  kind: "outcome";
  relatedDecisionId?: string;
  relatedInitiativeId?: string;
  expected?: string;
  actual: string;
  delta?: string;
}

export interface LessonMemory extends MemoryEntityBase {
  kind: "lesson";
  whatHappened: string;
  decisionMade?: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  repeat: string[];
  change: string[];
}

export type MemoryEntity =
  | DecisionMemory
  | BriefingMemory
  | RiskMemory
  | OpportunityMemory
  | InitiativeMemory
  | MeetingMemory
  | OutcomeMemory
  | LessonMemory
  | (MemoryEntityBase & {
      kind: "kpi_change" | "milestone" | "compliance_event";
    });

export interface MemoryRelationship {
  id: string;
  fromId: string;
  toId: string;
  kind: MemoryRelationshipKind;
  createdAt: string;
  weight?: number;
  metadata?: MemoryMetadata;
}

export interface MemoryTimelineEntry {
  id: string;
  at: string;
  kind: MemoryEntityKind;
  entityId: string;
  title: string;
  summary: string;
  domains: string[];
}

export interface MemoryRecallQuery {
  text?: string;
  dateFrom?: string;
  dateTo?: string;
  domains?: string[];
  kinds?: MemoryEntityKind[];
  initiativeId?: string;
  decisionId?: string;
  person?: string;
  topic?: string;
  minConfidence?: number;
  organizationId?: string | null;
  schoolId?: string | null;
  tags?: string[];
  limit?: number;
}

export interface MemoryRecallResult {
  query: MemoryRecallQuery;
  entities: MemoryEntity[];
  relationships: MemoryRelationship[];
  timeline: MemoryTimelineEntry[];
  lessons: LessonMemory[];
  answers: string[];
}

export interface RetentionRule {
  id: string;
  policy: MemoryRetentionPolicy;
  kinds?: MemoryEntityKind[];
  /** Days until expire/archive; ignored for permanent/legal_hold. */
  afterDays?: number;
  description?: string;
}

export interface ExecutiveMemoryRequest {
  requestId: string;
  scope: MemoryScope;
  briefingResult?: BriefingResultLight;
  /** Optional explicit entities to upsert (tests / imports). */
  entities?: MemoryEntity[];
  relationships?: MemoryRelationship[];
  retentionRules?: RetentionRule[];
  periodLabel?: string;
  metadata?: MemoryMetadata;
}

export interface ExecutiveMemoryResult {
  requestId: string;
  version: string;
  scope: MemoryScope;
  generatedAt: string;
  healthScore: { value: number; label: string };
  stored: MemoryEntity[];
  relationships: MemoryRelationship[];
  timeline: MemoryTimelineEntry[];
  lessons: LessonMemory[];
  archive: BriefingMemory[];
  decisions: DecisionMemory[];
  retentionApplied: RetentionRule[];
  contributingDomains: string[];
  metadata: MemoryMetadata;
}

export interface ExecutiveMemoryStoreSnapshot {
  entities: MemoryEntity[];
  relationships: MemoryRelationship[];
}
