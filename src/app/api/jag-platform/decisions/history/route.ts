import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createDecisionHistoryService } from "@/lib/executive-intelligence";
import {
  jsonOk,
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

  const decisionId = searchParams.get("decisionId") ?? undefined;
  const history = createDecisionHistoryService();

  return jsonOk(
    {
      timeline: history.listDecisionEvents(
        orgGate.organizationId,
        decisionId
      ),
      merged: history.listMergedTimeline(orgGate.organizationId),
      audit: history.listAuditEvents(orgGate.organizationId, decisionId),
    },
    { correlationId: gate.correlationId }
  );
}
