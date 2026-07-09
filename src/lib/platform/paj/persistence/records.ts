import type {
  PajCompetencyProgressRecord,
  PajDomainEnrollmentRecord,
  PajJourneyRecord,
  PajPlacementRecord,
  PajSkillProgressRecord,
} from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function insertPajJourney(
  supabase: AuthClient,
  row: Omit<PajJourneyRecord, "id" | "created_at" | "updated_at">
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_paj_journeys")
    .insert(row)
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id };
}

export async function insertPajDomainEnrollment(
  supabase: AuthClient,
  row: Omit<PajDomainEnrollmentRecord, "id" | "created_at" | "updated_at">
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_paj_domain_enrollments")
    .insert(row)
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id };
}

export async function insertPajPlacement(
  supabase: AuthClient,
  row: Omit<PajPlacementRecord, "id" | "created_at">
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_paj_placements")
    .insert(row)
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id };
}

export async function upsertPajCompetencyProgress(
  supabase: AuthClient,
  row: Omit<PajCompetencyProgressRecord, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_paj_competency_progress")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "journey_id,competency_key" }
    )
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id };
}

export async function upsertPajSkillProgress(
  supabase: AuthClient,
  row: Omit<PajSkillProgressRecord, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_paj_skill_progress")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "journey_id,skill_key" }
    )
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id };
}

export async function updatePajDomainActiveCompetency(
  supabase: AuthClient,
  enrollmentId: string,
  activeCompetencyKey: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("platform_paj_domain_enrollments")
    .update({
      active_competency_key: activeCompetencyKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getPajJourneyById(
  supabase: AuthClient,
  journeyId: string
): Promise<PajJourneyRecord | null> {
  const { data, error } = await supabase
    .from("platform_paj_journeys")
    .select("*")
    .eq("id", journeyId)
    .maybeSingle();
  if (error || !data) return null;
  return data as PajJourneyRecord;
}

export async function getPajJourneyByStudent(
  supabase: AuthClient,
  studentId: string
): Promise<PajJourneyRecord | null> {
  const { data, error } = await supabase
    .from("platform_paj_journeys")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return data as PajJourneyRecord;
}

export async function listPajDomainEnrollments(
  supabase: AuthClient,
  journeyId: string
): Promise<PajDomainEnrollmentRecord[]> {
  const { data, error } = await supabase
    .from("platform_paj_domain_enrollments")
    .select("*")
    .eq("journey_id", journeyId);
  if (error) return [];
  return (data ?? []) as PajDomainEnrollmentRecord[];
}

export async function listPajCompetencyProgress(
  supabase: AuthClient,
  journeyId: string
): Promise<PajCompetencyProgressRecord[]> {
  const { data, error } = await supabase
    .from("platform_paj_competency_progress")
    .select("*")
    .eq("journey_id", journeyId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as PajCompetencyProgressRecord[];
}

export async function listPajSkillProgress(
  supabase: AuthClient,
  journeyId: string
): Promise<PajSkillProgressRecord[]> {
  const { data, error } = await supabase
    .from("platform_paj_skill_progress")
    .select("*")
    .eq("journey_id", journeyId);
  if (error) return [];
  return (data ?? []) as PajSkillProgressRecord[];
}

export async function getPajCompetencyProgress(
  supabase: AuthClient,
  journeyId: string,
  competencyKey: string
): Promise<PajCompetencyProgressRecord | null> {
  const { data, error } = await supabase
    .from("platform_paj_competency_progress")
    .select("*")
    .eq("journey_id", journeyId)
    .eq("competency_key", competencyKey)
    .maybeSingle();
  if (error || !data) return null;
  return data as PajCompetencyProgressRecord;
}
