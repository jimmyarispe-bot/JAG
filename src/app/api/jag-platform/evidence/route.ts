import {
  canAccessEvidenceOrganization,
  searchEvidence,
} from "@/lib/evidence-center";
import {
  jsonOk,
  parsePagination,
  paginateItems,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const org = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!org.ok) return org.response;

  const documents = searchEvidence({
    organizationId: org.organizationId,
    query: searchParams.get("q") ?? undefined,
    domain: searchParams.get("domain") ?? undefined,
    evidenceType: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    source: searchParams.get("source") ?? undefined,
  });

  const page = paginateItems(documents, parsePagination(searchParams));

  return jsonOk(
    {
      documents: page.items,
      pagination: {
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        totalPages: page.totalPages,
      },
    },
    { correlationId: gate.correlationId }
  );
}
