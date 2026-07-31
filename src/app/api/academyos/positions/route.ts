import { createPositionService } from "@academyos";
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
  const service = createPositionService();
  const positionId = searchParams.get("positionId");
  if (positionId) {
    return jsonOk(
      { position: service.get(gate.organizationId, positionId) },
      { correlationId: gate.correlationId }
    );
  }
  const openParam = searchParams.get("open");
  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    open: openParam == null ? undefined : openParam === "true",
    department: searchParams.get("department") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    title?: string;
    department?: string | null;
    description?: string;
    open?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.title) {
    return jsonError(JagErrors.validation("title is required."));
  }
  const created = createPositionService().create({
    organizationId: gate.organizationId,
    title: body.title,
    department: body.department,
    description: body.description,
    open: body.open,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { position: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    positionId?: string;
    title?: string;
    department?: string | null;
    description?: string;
    open?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.positionId) {
    return jsonError(JagErrors.validation("positionId is required."));
  }
  const patched = createPositionService().patch({
    organizationId: gate.organizationId,
    positionId: body.positionId,
    title: body.title,
    department: body.department,
    description: body.description,
    open: body.open,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Position not found."));
  return jsonOk({ position: patched }, { correlationId: gate.correlationId });
}
