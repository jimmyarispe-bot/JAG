import { createPerEngine, type PerStatus } from "@studio";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireStudioOrg,
  requireStudioOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const engine = createPerEngine();
  if (searchParams.get("sync") === "1") {
    return jsonOk(
      { pers: engine.sync() },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("promote") === "1") {
    return jsonOk(
      { pers: engine.promotionCandidates() },
      { correlationId: gate.correlationId }
    );
  }
  const perId = searchParams.get("perId");
  if (perId) {
    return jsonOk(
      { per: engine.get(perId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      pers: engine.search({
        q: searchParams.get("q") ?? undefined,
        status: (searchParams.get("status") as PerStatus) || undefined,
        pack: searchParams.get("pack") ?? undefined,
        promoteOnly: searchParams.get("promoteOnly") === "1",
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    id?: string;
    description?: string;
    originatingPack?: string;
    affectedServices?: string[];
    status?: PerStatus;
    recommendation?: string;
    workaround?: string;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.id || !body.description || !body.originatingPack) {
    return jsonError(
      JagErrors.validation(
        "id, description, and originatingPack are required."
      )
    );
  }
  const per = createPerEngine().upsert({
    id: body.id,
    description: body.description,
    originatingPack: body.originatingPack,
    affectedServices: body.affectedServices,
    status: body.status,
    recommendation: body.recommendation,
    workaround: body.workaround,
    actor: gate.session.userId,
  });
  if ("error" in per) return jsonError(JagErrors.validation(per.error));
  return jsonOk({ per }, { correlationId: gate.correlationId, status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    id?: string;
    description?: string;
    originatingPack?: string;
    status?: PerStatus;
    recommendation?: string;
    workaround?: string;
    affectedServices?: string[];
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.id) return jsonError(JagErrors.validation("id is required."));
  const existing = createPerEngine().get(body.id);
  if (!existing) return jsonError(JagErrors.notFound("PER not found."));
  const per = createPerEngine().upsert({
    id: body.id,
    description: body.description ?? existing.description,
    originatingPack: body.originatingPack ?? existing.originatingPack,
    affectedServices: body.affectedServices,
    status: body.status,
    recommendation: body.recommendation,
    workaround: body.workaround,
    actor: gate.session.userId,
  });
  if ("error" in per) return jsonError(JagErrors.validation(per.error));
  return jsonOk({ per }, { correlationId: gate.correlationId });
}
