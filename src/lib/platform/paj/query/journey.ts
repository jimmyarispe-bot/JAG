import {
  getPajJourneyById,
  listPajCompetencyProgress,
  listPajDomainEnrollments,
  listPajSkillProgress,
} from "@/lib/platform/paj/persistence/records";
import type { PajJourneySnapshot } from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getJourneySnapshot(
  supabase: AuthClient,
  journeyId: string
): Promise<PajJourneySnapshot | null> {
  const journey = await getPajJourneyById(supabase, journeyId);
  if (!journey) return null;

  const enrollments = await listPajDomainEnrollments(supabase, journeyId);
  const competencyProgress = await listPajCompetencyProgress(supabase, journeyId);
  const skillProgress = await listPajSkillProgress(supabase, journeyId);

  const activeEnrollment = enrollments.find((e) => e.status === "active");
  const activeCompetencyKey = activeEnrollment?.active_competency_key ?? null;

  return {
    journey,
    enrollments,
    competencyProgress,
    skillProgress,
    activeCompetencyKey,
  };
}
