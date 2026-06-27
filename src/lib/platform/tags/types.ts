export type TagCategory =
  | "priority"
  | "medical"
  | "learning"
  | "funding"
  | "program"
  | "demographic"
  | "compliance"
  | "custom";

export type TagSource = "manual" | "automation" | "import" | "integration";

export interface PlatformTag {
  id: string;
  organization_id: string;
  slug: string;
  label: string;
  category: TagCategory;
  color: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformEntityTag {
  id: string;
  organization_id: string;
  tag_id: string;
  entity_type: string;
  entity_id: string;
  applied_by: string | null;
  applied_at: string;
  source: TagSource;
  expires_at: string | null;
  platform_tags?: PlatformTag;
}

export interface CreateTagInput {
  organizationId: string;
  slug: string;
  label: string;
  category?: TagCategory;
  color?: string;
  description?: string | null;
}

export interface ApplyTagsInput {
  organizationId: string;
  entityType: string;
  entityId: string;
  tagIds: string[];
  appliedBy?: string | null;
  source?: TagSource;
  /** For activity context */
  schoolId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
}
