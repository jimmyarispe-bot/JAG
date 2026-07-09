import { validateRecordEvidenceInput } from "@/lib/platform/evidence/validate";
import { validateEvidenceAgainstUlr } from "@/lib/platform/ulr/integration/evidence";
import { syncEvidenceGraphEdges } from "@/lib/platform/intelligence-graph/integration/evidence";
import { getEvidenceRecordById } from "@/lib/platform/evidence/query";
import type { RecordEvidenceInput } from "@/lib/platform/evidence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Knowledge & Evidence Engine — single write path for canonical evidence records.
 * Implements Doc 27 universal evidence schema (Wave 1 persistence).
 */
export async function recordEvidence(
  supabase: AuthClient,
  input: RecordEvidenceInput
): Promise<{ id: string | null; error?: string }> {
  const validation = validateRecordEvidenceInput(input);
  if (!validation.ok) {
    return { id: null, error: validation.error };
  }

  const ulrValidation = validateEvidenceAgainstUlr({
    competencyKeys: input.competencyKeys,
    skillKeys: input.skillKeys,
  });
  if (!ulrValidation.ok) {
    const unknown = [
      ...ulrValidation.unknownCompetencyKeys,
      ...ulrValidation.unknownSkillKeys,
    ].join(", ");
    return { id: null, error: `Unknown ULR registry keys: ${unknown}` };
  }

  const row = {
    evidence_type_key: input.evidenceTypeKey,
    skill_keys: input.skillKeys ?? [],
    competency_keys: input.competencyKeys ?? [],
    student_id: input.studentId,
    organization_id: input.organizationId ?? null,
    school_id: input.schoolId ?? null,
    captured_at: input.capturedAt ?? new Date().toISOString(),
    captured_by_role: input.capturedByRole,
    captured_by_user_id: input.capturedByUserId ?? null,
    source_context: input.sourceContext ?? {},
    locale: input.locale ?? "en",
    jurisdiction_keys: input.jurisdictionKeys ?? [],
    artifact_refs: input.artifactRefs ?? [],
    scores: input.scores ?? [],
    narrative: input.narrative ?? null,
    accommodations_applied: input.accommodationsApplied ?? [],
    evidence_confidence: input.evidenceConfidence,
    evidence_quality: input.evidenceQuality,
    expires_at: input.expiresAt ?? null,
    relationships: input.relationships ?? [],
    supersedes_evidence_id: input.supersedesEvidenceId ?? null,
    ai_assisted: input.aiAssisted ?? false,
    ai_validation_status: input.aiValidationStatus ?? null,
    metadata: input.metadata ?? {},
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("platform_evidence_records")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  const evidenceId = (data as { id: string }).id;
  const record = await getEvidenceRecordById(supabase, evidenceId);
  if (record) {
    await syncEvidenceGraphEdges(supabase, record);
  }

  return { id: evidenceId };
}
