import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { buildExecutiveTimeline } from "@/lib/executive-intelligence";
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
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const items = buildExecutiveTimeline(orgGate.organizationId, 200);
  const page = paginateItems(items, parsePagination(searchParams, { pageSize: 50 }));

  return jsonOk(
    {
      timeline: page.items,
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
