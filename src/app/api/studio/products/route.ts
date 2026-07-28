import {
  createProductRegistryService,
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
  const products = createProductRegistryService();
  const productId = searchParams.get("productId") as StudioProductId | null;
  if (productId) {
    return jsonOk(
      { product: products.get(productId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { products: products.list() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    id?: StudioProductId;
    name?: string;
    version?: string;
    completionPercent?: number;
    releaseStatus?: ReleaseStatus;
    dependencies?: string[];
    certification?: "None" | "Pending" | "Certified";
    openPerIds?: string[];
    description?: string;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.id) return jsonError(JagErrors.validation("id is required."));
  const product = createProductRegistryService().upsert({
    id: body.id,
    name: body.name,
    version: body.version,
    completionPercent: body.completionPercent,
    releaseStatus: body.releaseStatus,
    dependencies: body.dependencies,
    certification: body.certification,
    openPerIds: body.openPerIds,
    description: body.description,
  });
  return jsonOk(
    { product },
    { correlationId: gate.correlationId, status: 201 }
  );
}
