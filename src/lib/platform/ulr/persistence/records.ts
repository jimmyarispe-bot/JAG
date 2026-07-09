import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  UlrCompetencyDefinition,
  UlrRelationship,
} from "@/lib/platform/ulr/types";
import { registerUlrCompetency, registerUlrRelationship } from "@/lib/platform/ulr/registry/registry";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function persistUlrCompetency(
  supabase: AuthClient,
  competency: UlrCompetencyDefinition
): Promise<{ id: string | null; error?: string }> {
  const row = {
    competency_key: competency.competencyKey,
    domain_key: competency.learningDomainKey,
    strand_key: competency.strandKey,
    sub_strand_key: competency.subStrandKey,
    title: competency.title,
    version: competency.version,
    status: competency.status,
    definition: competency,
    ai_metadata: competency.aiMetadata,
    sort_order: 0,
    published_at: competency.status === "published" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("platform_ulr_competencies")
    .upsert(row, { onConflict: "competency_key" })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  registerUlrCompetency(competency);
  return { id: (data as { id: string }).id };
}

export async function persistUlrRelationship(
  supabase: AuthClient,
  relationship: UlrRelationship
): Promise<{ id: string | null; error?: string }> {
  const row = {
    relationship_type: relationship.relationshipType,
    source_key: relationship.sourceKey,
    source_kind: relationship.sourceKind,
    target_key: relationship.targetKey,
    target_kind: relationship.targetKind,
    weight: relationship.weight ?? 1,
    metadata: relationship.metadata ?? {},
    status: "active",
  };

  const { data, error } = await supabase
    .from("platform_ulr_relationships")
    .upsert(row, { onConflict: "relationship_type,source_key,target_key" })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  registerUlrRelationship(relationship);
  return { id: (data as { id: string }).id };
}

export async function loadUlrCompetenciesFromDb(
  supabase: AuthClient,
  filters: { domainKey?: string; status?: string } = {}
): Promise<UlrCompetencyDefinition[]> {
  let query = supabase.from("platform_ulr_competencies").select("*");
  if (filters.domainKey) query = query.eq("domain_key", filters.domainKey);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error || !data) return [];

  const competencies = (data as Array<{ definition: UlrCompetencyDefinition }>).map(
    (row) => row.definition
  );

  for (const competency of competencies) {
    registerUlrCompetency(competency);
  }

  return competencies;
}

export async function listUlrRelationshipsFromDb(
  supabase: AuthClient,
  filters: { sourceKey?: string; relationshipType?: string } = {}
): Promise<UlrRelationship[]> {
  let query = supabase
    .from("platform_ulr_relationships")
    .select("*")
    .eq("status", "active");

  if (filters.sourceKey) query = query.eq("source_key", filters.sourceKey);
  if (filters.relationshipType) query = query.eq("relationship_type", filters.relationshipType);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    relationshipType: row.relationship_type as UlrRelationship["relationshipType"],
    sourceKey: row.source_key as string,
    sourceKind: row.source_kind as UlrRelationship["sourceKind"],
    targetKey: row.target_key as string,
    targetKind: row.target_kind as UlrRelationship["targetKind"],
    weight: Number(row.weight ?? 1),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}
