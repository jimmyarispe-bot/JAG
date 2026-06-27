import type {
  PlatformRelationship,
  RelationshipQueryFilters,
  RelationshipTypeDefinition,
} from "@/lib/platform/relationships/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getRelationshipTypeDefinitions(
  supabase: AuthClient
): Promise<RelationshipTypeDefinition[]> {
  const { data } = await supabase
    .from("platform_relationship_type_definitions")
    .select("*")
    .order("sort_order");
  return (data ?? []) as RelationshipTypeDefinition[];
}

export async function getRelationshipsFrom(
  supabase: AuthClient,
  fromEntityType: string,
  fromEntityId: string,
  filters?: RelationshipQueryFilters
): Promise<PlatformRelationship[]> {
  let q = supabase
    .from("platform_relationships")
    .select("*")
    .eq("from_entity_type", fromEntityType)
    .eq("from_entity_id", fromEntityId)
    .order("is_primary", { ascending: false })
    .order("effective_date", { ascending: false });

  if (filters?.relationshipType) {
    const types = Array.isArray(filters.relationshipType)
      ? filters.relationshipType
      : [filters.relationshipType];
    q = q.in("relationship_type", types);
  }

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    q = q.in("status", statuses);
  } else {
    q = q.eq("status", "active");
  }

  if (filters?.isPrimary !== undefined) q = q.eq("is_primary", filters.isPrimary);

  const { data } = await q;
  return (data ?? []) as PlatformRelationship[];
}

export async function getRelationshipsTo(
  supabase: AuthClient,
  toEntityType: string,
  toEntityId: string,
  filters?: RelationshipQueryFilters
): Promise<PlatformRelationship[]> {
  let q = supabase
    .from("platform_relationships")
    .select("*")
    .eq("to_entity_type", toEntityType)
    .eq("to_entity_id", toEntityId)
    .order("effective_date", { ascending: false });

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    q = q.in("status", statuses);
  } else {
    q = q.eq("status", "active");
  }

  const { data } = await q;
  return (data ?? []) as PlatformRelationship[];
}

export async function getStudentSupportTeam(
  supabase: AuthClient,
  studentId: string
): Promise<PlatformRelationship[]> {
  return getRelationshipsFrom(supabase, "student", studentId, {
    relationshipType: [
      "student.teacher",
      "student.advisor",
      "student.therapist",
      "student.case_manager",
    ],
  });
}

export async function getStudentRelationships(
  supabase: AuthClient,
  studentId: string,
  filters?: RelationshipQueryFilters
): Promise<PlatformRelationship[]> {
  return getRelationshipsFrom(supabase, "student", studentId, filters);
}
