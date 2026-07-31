import { createPerformanceService } from "@academyos";
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
  const items = createPerformanceService().list(
    gate.organizationId,
    searchParams.get("employeeId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    employeeId?: string;
    kind?:
      | "Annual Review"
      | "Goal"
      | "Professional Development"
      | "Coaching"
      | "Observation"
      | "Improvement Plan";
    title?: string;
    body?: string;
    goals?: string;
    reviewedOn?: string;
    reviewerId?: string | null;
    memoryLinkId?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.employeeId || !body.kind || !body.title || !body.reviewedOn) {
    return jsonError(
      JagErrors.validation(
        "employeeId, kind, title, and reviewedOn are required."
      )
    );
  }
  const created = createPerformanceService().create({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    kind: body.kind,
    title: body.title,
    body: body.body,
    goals: body.goals,
    reviewedOn: body.reviewedOn,
    reviewerId: body.reviewerId,
    memoryLinkId: body.memoryLinkId,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { review: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}
