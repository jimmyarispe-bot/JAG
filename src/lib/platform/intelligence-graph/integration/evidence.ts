import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";
import { recordGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type { RecordGraphEdgeInput } from "@/lib/platform/intelligence-graph/persistence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist graph edges when evidence is recorded — KEE integration. */
export async function syncEvidenceGraphEdges(
  supabase: AuthClient,
  record: PlatformEvidenceRecord
): Promise<void> {
  const studentNodeId = buildGraphNodeId("entity", "student", record.student_id);
  const evidenceNodeId = buildGraphNodeId("evidence", "evidence_record", record.id);
  const edges: RecordGraphEdgeInput[] = [];

  for (const competencyKey of record.competency_keys) {
    const competencyNodeId = buildGraphNodeId("competency", "competency", competencyKey);
    edges.push(
      {
        edgeType: "student.demonstrates.competency",
        sourceNodeId: studentNodeId,
        targetNodeId: competencyNodeId,
        providerKey: "evidence",
        weight: record.evidence_confidence,
        organizationId: record.organization_id,
        schoolId: record.school_id,
        effectiveDate: record.captured_at,
        endDate: record.expires_at,
        metadata: { evidenceId: record.id, evidenceTypeKey: record.evidence_type_key },
      },
      {
        edgeType: "competency.supported_by.evidence",
        sourceNodeId: competencyNodeId,
        targetNodeId: evidenceNodeId,
        providerKey: "evidence",
        weight: record.evidence_quality,
        organizationId: record.organization_id,
        schoolId: record.school_id,
        effectiveDate: record.captured_at,
        endDate: record.expires_at,
        metadata: { evidenceId: record.id },
      }
    );
  }

  for (const skillKey of record.skill_keys) {
    const skillNodeId = buildGraphNodeId("atomic_skill", "atomic_skill", skillKey);
    edges.push({
      edgeType: "atomic_skill.part_of.competency",
      sourceNodeId: skillNodeId,
      targetNodeId: buildGraphNodeId("competency", "competency", record.competency_keys[0] ?? skillKey),
      providerKey: "evidence",
      organizationId: record.organization_id,
      schoolId: record.school_id,
      effectiveDate: record.captured_at,
      metadata: { evidenceId: record.id, skillKey },
    });
  }

  if (edges.length > 0) {
    await recordGraphEdges(supabase, edges);
  }
}
