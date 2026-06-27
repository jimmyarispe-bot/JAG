export type RelationshipStatus = "active" | "inactive" | "ended" | "pending";
export type RelationshipSource = "manual" | "automation" | "import" | "integration" | "migration";

export interface PlatformRelationship {
  id: string;
  organization_id: string;
  school_id: string | null;
  relationship_type: string;
  from_entity_type: string;
  from_entity_id: string;
  to_entity_type: string;
  to_entity_id: string;
  is_primary: boolean;
  effective_date: string | null;
  end_date: string | null;
  status: RelationshipStatus;
  source: RelationshipSource;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipTypeDefinition {
  type_key: string;
  label: string;
  from_entity_type: string;
  to_entity_type: string;
  description: string | null;
  is_system: boolean;
  sort_order: number;
}

export interface CreateRelationshipInput {
  organizationId: string;
  schoolId?: string | null;
  relationshipType: string;
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  isPrimary?: boolean;
  effectiveDate?: string | null;
  endDate?: string | null;
  status?: RelationshipStatus;
  source?: RelationshipSource;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  /** Emit activity event (default true) */
  recordActivity?: boolean;
  /** Context for activity event */
  studentId?: string | null;
  familyId?: string | null;
}

export interface RelationshipQueryFilters {
  relationshipType?: string | string[];
  status?: RelationshipStatus | RelationshipStatus[];
  isPrimary?: boolean;
}
