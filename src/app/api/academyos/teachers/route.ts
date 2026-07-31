import { createTeachersService } from "@academyos";
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
  const service = createTeachersService();
  const teacherId = searchParams.get("teacherId");
  if (teacherId) {
    return jsonOk(
      { teacher: service.get(gate.organizationId, teacherId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    campusId: searchParams.get("campusId") ?? undefined,
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
    displayName?: string;
    email?: string | null;
    campusIds?: string[];
    subjects?: string[];
    availability?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    timezone?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.displayName) {
    return jsonError(JagErrors.validation("displayName is required."));
  }
  const teacher = createTeachersService().create({
    organizationId: gate.organizationId,
    displayName: body.displayName,
    email: body.email,
    campusIds: body.campusIds,
    subjects: body.subjects,
    availability: body.availability,
    timezone: body.timezone,
    createdBy: gate.session.userId,
  });
  if ("error" in teacher) return jsonError(JagErrors.validation(teacher.error));
  return jsonOk(
    { teacher },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    teacherId?: string;
    displayName?: string;
    email?: string | null;
    campusIds?: string[];
    subjects?: string[];
    availability?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.teacherId) {
    return jsonError(JagErrors.validation("teacherId is required."));
  }
  const patched = createTeachersService().patch({
    organizationId: gate.organizationId,
    teacherId: body.teacherId,
    displayName: body.displayName,
    email: body.email,
    campusIds: body.campusIds,
    subjects: body.subjects,
    availability: body.availability,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Teacher not found."));
  return jsonOk({ teacher: patched }, { correlationId: gate.correlationId });
}
