import {
  createReleaseArtifactService,
  createReleaseManager,
  evaluateReleaseGates,
  type ReleaseStatus,
  type StudioProductId,
} from "@studio";
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
  const service = createReleaseManager();
  const productId = searchParams.get("productId") as StudioProductId | null;

  if (searchParams.get("artifacts") === "1" && productId) {
    const artifacts = createReleaseArtifactService().generate({
      productId,
      releaseId: searchParams.get("releaseId") ?? undefined,
    });
    if ("error" in artifacts) {
      return jsonError(JagErrors.validation(artifacts.error));
    }
    return jsonOk(
      { artifacts },
      { correlationId: gate.correlationId }
    );
  }

  if (searchParams.get("gates") === "1" && productId) {
    const targetStage =
      (searchParams.get("targetStage") as ReleaseStatus) || "RC-1";
    return jsonOk(
      {
        gates: evaluateReleaseGates({
          productId,
          targetStage,
        }),
      },
      { correlationId: gate.correlationId }
    );
  }

  const releaseId = searchParams.get("releaseId");
  if (releaseId) {
    return jsonOk(
      { release: service.get(releaseId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      releases: service.search({
        productId: productId || undefined,
        status: (searchParams.get("status") as ReleaseStatus) || undefined,
        q: searchParams.get("q") ?? undefined,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    productId?: StudioProductId;
    version?: string;
    status?: ReleaseStatus;
    releaseNotes?: string;
    migrationHistory?: string[];
    upgradePath?: string[];
    compatibilityMatrix?: Record<string, string>;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.productId || !body.version) {
    return jsonError(
      JagErrors.validation("productId and version are required.")
    );
  }
  const created = createReleaseManager().create({
    productId: body.productId,
    version: body.version,
    status: body.status,
    releaseNotes: body.releaseNotes,
    migrationHistory: body.migrationHistory,
    upgradePath: body.upgradePath,
    compatibilityMatrix: body.compatibilityMatrix,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { release: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    releaseId?: string;
    status?: ReleaseStatus;
    note?: string;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.releaseId || !body.status) {
    return jsonError(
      JagErrors.validation("releaseId and status are required.")
    );
  }
  const updated = createReleaseManager().advance({
    releaseId: body.releaseId,
    status: body.status,
    actor: gate.session.userId,
    note: body.note,
  });
  if (!updated) return jsonError(JagErrors.notFound("Release not found."));
  if ("error" in updated) return jsonError(JagErrors.validation(updated.error));
  return jsonOk({ release: updated }, { correlationId: gate.correlationId });
}
