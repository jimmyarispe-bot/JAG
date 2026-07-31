/** Organizational Digital Twin™ — canonical org model (no AI / no simulation). */

export const TWIN_ENTITY_TYPES = [
  "Organization",
  "Person",
  "Team",
  "Business Unit",
  "Department",
  "Role",
  "Asset",
  "Location",
  "Product / Service",
  "Project",
  "Task",
  "Event",
  "Document",
  "Decision",
  "Goal",
  "Metric (KPI)",
  "Risk",
  "Opportunity",
] as const;

export type TwinEntityType = (typeof TWIN_ENTITY_TYPES)[number];

export const TWIN_RELATIONSHIP_TYPES = [
  "reports_to",
  "belongs_to",
  "owns",
  "manages",
  "assigned_to",
  "participates_in",
  "located_at",
  "depends_on",
  "supports",
  "measures",
  "created_from",
  "references",
  /** Goals & Strategy™ */
  "measured_by",
  "blocked_by",
  "owned_by",
  /** Risk & Compliance™ */
  "threatens",
  "mitigated_by",
  "controlled_by",
  "impacts",
  "monitored_by",
  /** Work & Execution™ */
  "blocks",
  "produces",
  /** Organizational Memory™ */
  "documents",
  "explains",
  "resulted_from",
] as const;

export type TwinRelationshipType = (typeof TWIN_RELATIONSHIP_TYPES)[number];

export const TWIN_LIFECYCLE_STATUSES = ["Active", "Archived"] as const;
export type TwinLifecycleStatus = (typeof TWIN_LIFECYCLE_STATUSES)[number];

export const TWIN_TIMELINE_KINDS = [
  "created",
  "updated",
  "connected",
  "assigned",
  "archived",
] as const;
export type TwinTimelineKind = (typeof TWIN_TIMELINE_KINDS)[number];

export type TwinEntity = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityType: TwinEntityType;
  readonly label: string;
  readonly description: string;
  readonly status: TwinLifecycleStatus;
  readonly externalKey: string;
  /** Linked Evidence Knowledge Graph™ node id. */
  readonly graphNodeId: string;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
  readonly createdBy: string;
};

export type TwinRelationship = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromTwinId: string;
  readonly toTwinId: string;
  readonly relationshipType: TwinRelationshipType;
  /** Linked Knowledge Graph™ edge id when mirrored. */
  readonly graphEdgeId: string | null;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type TwinTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly twinId: string;
  readonly kind: TwinTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type TwinSearchQuery = {
  readonly organizationId: string;
  readonly q?: string;
  readonly entityType?: TwinEntityType | "";
  readonly status?: TwinLifecycleStatus | "";
  readonly limit?: number;
};

export type TwinMetricsSnapshot = {
  readonly entityCount: number;
  readonly relationshipCount: number;
  readonly activeCount: number;
  readonly archivedCount: number;
  readonly byEntityType: Readonly<Record<string, number>>;
  readonly byRelationshipType: Readonly<Record<string, number>>;
  readonly graphNodeCount: number;
  readonly graphEdgeCount: number;
};

export type TwinExplorerView = {
  readonly organizations: readonly TwinEntity[];
  readonly people: readonly TwinEntity[];
  readonly teams: readonly TwinEntity[];
  readonly assets: readonly TwinEntity[];
  readonly decisions: readonly TwinEntity[];
  readonly documents: readonly TwinEntity[];
  readonly products: readonly TwinEntity[];
  readonly relationships: readonly TwinRelationship[];
  readonly metrics: TwinMetricsSnapshot;
};
