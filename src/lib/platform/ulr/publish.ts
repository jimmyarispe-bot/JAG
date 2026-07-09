import { persistUlrCompetency, persistUlrRelationship } from "@/lib/platform/ulr/persistence/records";
import { publishUlrCompetencyEvent } from "@/lib/platform/ulr/integration/events";
import { syncUlrRelationshipToGraph } from "@/lib/platform/ulr/integration/graph";
import { getUlrRelationships } from "@/lib/platform/ulr/registry/registry";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Publish competency to ULR store and sync graph + event integrations. */
export async function publishUlrCompetency(
  supabase: AuthClient,
  competency: UlrCompetencyDefinition
): Promise<{ ok: boolean; error?: string }> {
  const published: UlrCompetencyDefinition = {
    ...competency,
    status: "published",
  };

  const { error } = await persistUlrCompetency(supabase, published);
  if (error) return { ok: false, error };

  for (const prerequisiteKey of published.prerequisiteCompetencyKeys) {
    const relationship = {
      relationshipType: "prerequisite" as const,
      sourceKey: published.competencyKey,
      sourceKind: "competency" as const,
      targetKey: prerequisiteKey,
      targetKind: "competency" as const,
      weight: 1,
    };
    await persistUlrRelationship(supabase, relationship);
    await syncUlrRelationshipToGraph(supabase, relationship);
  }

  for (const rel of getUlrRelationships({ sourceKey: published.competencyKey })) {
    await persistUlrRelationship(supabase, rel);
    await syncUlrRelationshipToGraph(supabase, rel);
  }

  await publishUlrCompetencyEvent(supabase, published, "published");
  return { ok: true };
}
