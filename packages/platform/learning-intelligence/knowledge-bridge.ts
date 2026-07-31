/**
 * Optional bridge: assessment evidence URLs → KnowledgeEngine facts.
 * Knowledge holds documents/evidence; LI does not reinterpret pedagogy in Knowledge.
 */

import { createKnowledgeEngine } from "@knowledge";

export function linkAssessmentEvidenceToKnowledge(input: {
  organizationId: string;
  userId: string;
  studentId: string;
  assessmentId: string;
  evidenceUrls: readonly string[];
  result: string;
}): readonly string[] {
  if (input.evidenceUrls.length === 0) return Object.freeze([]);

  const knowledge = createKnowledgeEngine();
  const { document, version } = knowledge.uploadDocument({
    organizationId: input.organizationId,
    userId: input.userId,
    title: `Assessment evidence ${input.assessmentId}`,
    content: [
      `Assessment: ${input.assessmentId}`,
      `Student: ${input.studentId}`,
      `Result: ${input.result}`,
      ...input.evidenceUrls.map((u) => `Evidence: ${u}`),
    ].join("\n"),
    typeKey: "assessment",
    tags: ["learning-intelligence", "assessment-evidence"],
    metadata: {
      assessmentId: input.assessmentId,
      studentId: input.studentId,
      linkedBy: "learning-intelligence",
    },
  });

  const factIds: string[] = [];
  for (const url of input.evidenceUrls) {
    const fact = knowledge.recordEvidenceFact({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: document.id,
      versionId: version.id,
      location: url,
      statement: `Assessment ${input.assessmentId} evidence: ${url} (result ${input.result})`,
      confidence: 0.85,
      method: "manual",
    });
    factIds.push(fact.id);
  }
  return Object.freeze(factIds);
}
