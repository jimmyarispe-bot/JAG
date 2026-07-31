import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createInsightHistoryService } from "@/lib/executive-intelligence";
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

  const history = createInsightHistoryService();
  const insightId = searchParams.get("insightId");
  const timeline = insightId
    ? history.listTimelineForInsight(orgGate.organizationId, insightId)
    : history.listTimeline(orgGate.organizationId);
  const events = history.listPlatformEvents(orgGate.organizationId);

  return jsonOk(
    { timeline, events },
    { correlationId: gate.correlationId }
  );
}
