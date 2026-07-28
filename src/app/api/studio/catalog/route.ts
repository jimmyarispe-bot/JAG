import { createCatalogService, type CatalogEntryKind } from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createCatalogService();
  const force = searchParams.get("force") === "1";
  const snap = service.index({ force });

  if (searchParams.get("meta") === "1") {
    return jsonOk(
      {
        catalog: {
          root: snap.root,
          indexedAt: snap.indexedAt,
          version: snap.version,
          counts: snap.counts,
          entryCount: snap.entries.length,
        },
      },
      { correlationId: gate.correlationId }
    );
  }

  const kind = (searchParams.get("kind") as CatalogEntryKind) || undefined;
  const q = searchParams.get("q") ?? undefined;
  const ownerPackage = searchParams.get("ownerPackage") ?? undefined;
  const entries = service.search({ kind, q, ownerPackage, force: false });
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? 50))
  );
  const total = entries.length;
  const start = (page - 1) * pageSize;

  return jsonOk(
    {
      version: snap.version,
      indexedAt: snap.indexedAt,
      counts: snap.counts,
      entries: entries.slice(start, start + pageSize),
      pagination: { page, pageSize, total },
    },
    { correlationId: gate.correlationId }
  );
}
