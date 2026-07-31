import {
  createMrJagAcademyEngine,
  installMrJag,
  type CertificationKind,
} from "@mr-jag";
import { jsonError, jsonOk, JagErrors, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagAcademyEngine();
  return jsonOk(
    {
      certifications: engine.listCertifications(
        gate.organizationId,
        gate.session.userId
      ),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: CertificationKind;
    title?: string;
    persona?: string;
    lessonIds?: string[];
    pathId?: string;
    version?: string;
    expiresAt?: string | null;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagAcademyEngine();

  if (body.pathId) {
    const progress = engine.learnerProgress({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: body.persona,
    });
    const award = engine.awardPathCertification({
      pathId: body.pathId,
      userId: gate.session.userId,
      organizationId: gate.organizationId,
      completedLessonIds: progress.completedLessonIds,
    });
    if ("error" in award) {
      return jsonError(JagErrors.validation(award.error));
    }
    return jsonOk(
      { certification: award },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const certification = engine.awardCertification({
    kind: body.kind ?? "course",
    title: body.title ?? "Academy Certificate",
    persona: (body.persona as never) ?? null,
    userId: gate.session.userId,
    organizationId: gate.organizationId,
    lessonIds: body.lessonIds,
    version: body.version,
    expiresAt: body.expiresAt,
  });
  return jsonOk(
    { certification },
    { correlationId: gate.correlationId, status: 201 }
  );
}
