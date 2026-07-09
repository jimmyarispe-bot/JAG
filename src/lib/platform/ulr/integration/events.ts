import { publishEvent } from "@/lib/platform/events/publisher/publish";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Publish ULR competency lifecycle event via Event Engine. */
export async function publishUlrCompetencyEvent(
  supabase: AuthClient,
  competency: UlrCompetencyDefinition,
  action: "published" | "deprecated"
): Promise<void> {
  await publishEvent(
    {
      eventType: "platform.entity.updated",
      entityType: "competency",
      entityId: competency.competencyKey,
      payload: {
        action: `ulr.competency.${action}`,
        competencyKey: competency.competencyKey,
        domainKey: competency.learningDomainKey,
        version: competency.version,
        status: competency.status,
      },
      correlationId: competency.competencyKey,
    },
    { persist: { supabase } }
  );
}
