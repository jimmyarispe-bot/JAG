import {
  createCertificationEngine,
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
  const engine = createCertificationEngine();
  const productId = searchParams.get("productId") as StudioProductId | null;
  if (productId) {
    return jsonOk(
      {
        certification: engine.refresh(productId),
        workflow: engine.workflow(productId),
      },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { certifications: engine.list() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    productId?: StudioProductId;
    action?: "refresh" | "sign";
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.productId) {
    return jsonError(JagErrors.validation("productId is required."));
  }
  const engine = createCertificationEngine();
  if (body.action === "sign") {
    const signed = engine.sign({
      productId: body.productId,
      signedBy: gate.session.userId,
    });
    if ("error" in signed) {
      return jsonError(JagErrors.validation(signed.error));
    }
    return jsonOk(
      { certification: signed },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  return jsonOk(
    {
      certification: engine.refresh(body.productId, {
        actor: gate.session.userId,
        note: "Manual refresh",
      }),
    },
    { correlationId: gate.correlationId }
  );
}
