import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { listGoalTimeline } from "@/lib/goals";
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

  const goalId = searchParams.get("goalId") ?? undefined;
  return jsonOk(
    { history: listGoalTimeline(orgGate.organizationId, goalId) },
    { correlationId: gate.correlationId }
  );
}
