import {
  createAssessmentService,
  createGradebookService,
  createLearningReportingService,
  type AssessmentKind,
  type LearningReportKind,
  type MasteryLevel,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const report = searchParams.get("report") as LearningReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createLearningReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  const items = createAssessmentService().search({
    organizationId: gate.organizationId,
    studentId: searchParams.get("studentId") ?? undefined,
    kind: (searchParams.get("kind") as AssessmentKind) || undefined,
    curriculumId: searchParams.get("curriculumId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "record" | "observation";
    studentId?: string;
    teacherId?: string | null;
    kind?: AssessmentKind;
    assessedOn?: string;
    objectiveId?: string | null;
    curriculumId?: string | null;
    result?: MasteryLevel | string;
    notes?: string;
    evidenceUrls?: string[];
    updateMastery?: boolean;
    domain?: "Reading" | "Writing" | "Math" | "Structured Literacy";
    progressionLevel?: number | null;
    progressionStep?: number | null;
    body?: string;
    artifactUrls?: string[];
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "observation") {
    if (!body.studentId || !body.body) {
      return jsonError(
        JagErrors.validation("studentId and body are required.")
      );
    }
    const obs = createGradebookService().addObservation({
      organizationId: gate.organizationId,
      studentId: body.studentId,
      teacherId: body.teacherId,
      body: body.body,
      assessedOn: body.assessedOn,
      artifactUrls: body.artifactUrls,
      createdBy: gate.session.userId,
    });
    if ("error" in obs) return jsonError(JagErrors.validation(obs.error));
    return jsonOk(
      { observation: obs },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.studentId || !body.kind || body.result == null) {
    return jsonError(
      JagErrors.validation("studentId, kind, and result are required.")
    );
  }
  const recorded = createAssessmentService().record({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    teacherId: body.teacherId,
    kind: body.kind,
    assessedOn: body.assessedOn ?? new Date().toISOString(),
    objectiveId: body.objectiveId,
    curriculumId: body.curriculumId,
    result: body.result,
    notes: body.notes,
    evidenceUrls: body.evidenceUrls,
    updateMastery: body.updateMastery,
    domain: body.domain,
    progressionLevel: body.progressionLevel,
    progressionStep: body.progressionStep,
    createdBy: gate.session.userId,
  });
  if ("error" in recorded) {
    return jsonError(JagErrors.validation(recorded.error));
  }
  return jsonOk(
    { assessment: recorded },
    { correlationId: gate.correlationId, status: 201 }
  );
}
