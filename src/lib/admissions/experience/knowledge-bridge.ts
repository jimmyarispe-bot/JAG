/**
 * Admissions documents → KnowledgeEngine (canonical storage ownership).
 * Application registry rows remain for CRM status; bytes/content live in Knowledge.
 */

import { createKnowledgeEngine } from "@knowledge";
import { publishAdmissionsExperienceEvent } from "./events";

function mapAdmissionsTypeKey(documentType: string): string {
  const t = documentType.trim().toLowerCase();
  if (t.includes("iep")) return "iep";
  if (t.includes("504")) return "504";
  if (t.includes("transcript")) return "transcript";
  if (t.includes("assessment")) return "assessment";
  if (t.includes("contract") || t.includes("agreement")) return "contract_legal";
  return "general";
}

export async function linkAdmissionsDocumentToKnowledge(input: {
  organizationId: string;
  userId: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  mimeType?: string | null;
  /** Base64 or plain text content for KnowledgeEngine ingest. */
  content: string;
  tags?: readonly string[];
}): Promise<
  | { knowledgeDocumentId: string; versionId: string }
  | { error: string; skipped?: true }
> {
  if (!input.organizationId) {
    return { error: "organizationId required", skipped: true };
  }
  if (!input.content) {
    return { error: "content required", skipped: true };
  }

  try {
    const engine = createKnowledgeEngine();
    const { document, version } = engine.uploadDocument({
      organizationId: input.organizationId,
      userId: input.userId,
      title: `${input.documentType}: ${input.fileName}`,
      content: input.content,
      mimeType: input.mimeType ?? "application/octet-stream",
      typeKey: mapAdmissionsTypeKey(input.documentType),
      tags: [
        "admissions",
        input.documentType,
        `application:${input.applicationId}`,
        ...(input.tags ?? []),
      ],
      metadata: {
        applicationId: input.applicationId,
        documentType: input.documentType,
        fileName: input.fileName,
        domain: "education.admissions",
      },
      changeNote: "Admissions Experience document upload",
    });

    try {
      engine.recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.userId,
        documentId: document.id,
        versionId: version.id,
        location: `admissions/${input.documentType}`,
        statement: `Admissions document uploaded: ${input.fileName}`,
        confidence: 1,
        method: "manual",
      });
    } catch {
      /* evidence optional */
    }

    publishAdmissionsExperienceEvent({
      type: "admissions.document_uploaded",
      organizationId: input.organizationId,
      recordType: "application_document",
      recordId: document.id,
      actorUserId: input.userId,
      payload: {
        applicationId: input.applicationId,
        documentType: input.documentType,
        fileName: input.fileName,
        knowledgeDocumentId: document.id,
      },
      projectLive: true,
    });

    return { knowledgeDocumentId: document.id, versionId: version.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Knowledge upload failed",
    };
  }
}
