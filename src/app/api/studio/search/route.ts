import { createSearchService, type CatalogEntryKind } from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return jsonError(JagErrors.validation("q is required."));
  }
  const kindsParam = searchParams.get("kinds");
  const kinds = kindsParam
    ? (kindsParam.split(",").map((k) => k.trim()) as CatalogEntryKind[])
    : undefined;
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 40))
  );
  const result = createSearchService().search({
    query,
    kinds,
    limit,
    forceIndex: searchParams.get("force") === "1",
  });
  return jsonOk({ search: result }, { correlationId: gate.correlationId });
}
