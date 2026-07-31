import {
  createCurriculumService,
  type CurriculumStatus,
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
  const service = createCurriculumService();
  const curriculumId = searchParams.get("curriculumId");
  if (curriculumId) {
    return jsonOk(
      { curriculum: service.get(gate.organizationId, curriculumId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as CurriculumStatus) || undefined,
    program: searchParams.get("program") ?? undefined,
    campusId: searchParams.get("campusId") ?? undefined,
    gradeLevel: searchParams.get("gradeLevel") ?? undefined,
    subject: searchParams.get("subject") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    subject?: string;
    version?: string;
    program?: string | null;
    campusId?: string | null;
    gradeLevels?: string[];
    objectives?: {
      id: string;
      code: string;
      title: string;
      description: string;
      competencyId: string | null;
    }[];
    competencies?: {
      id: string;
      code: string;
      title: string;
      description: string;
    }[];
    publish?: boolean;
    effectiveFrom?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.name || !body.subject) {
    return jsonError(JagErrors.validation("name and subject are required."));
  }
  const created = createCurriculumService().create({
    organizationId: gate.organizationId,
    name: body.name,
    subject: body.subject,
    version: body.version,
    program: body.program,
    campusId: body.campusId,
    gradeLevels: body.gradeLevels,
    objectives: body.objectives,
    competencies: body.competencies,
    publish: body.publish,
    effectiveFrom: body.effectiveFrom,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { curriculum: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    curriculumId?: string;
    action?: "publish" | "archive";
    name?: string;
    status?: CurriculumStatus;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.curriculumId) {
    return jsonError(JagErrors.validation("curriculumId is required."));
  }
  const service = createCurriculumService();
  const result =
    body.action === "publish"
      ? service.publish({
          organizationId: gate.organizationId,
          curriculumId: body.curriculumId,
          actor: gate.session.userId,
        })
      : body.action === "archive"
        ? service.archive({
            organizationId: gate.organizationId,
            curriculumId: body.curriculumId,
            actor: gate.session.userId,
          })
        : service.patch({
            organizationId: gate.organizationId,
            curriculumId: body.curriculumId,
            name: body.name,
            status: body.status,
            actor: gate.session.userId,
          });
  if (!result) return jsonError(JagErrors.notFound("Curriculum not found."));
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk({ curriculum: result }, { correlationId: gate.correlationId });
}
