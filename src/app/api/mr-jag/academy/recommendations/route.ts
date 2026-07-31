import {
  createMrJagAcademyEngine,
  installMrJag,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createMrJagAcademyEngine();
  const visited =
    searchParams.get("visited")?.split(",").filter(Boolean) ?? [];
  const coach =
    searchParams.get("coachPages")?.split(",").filter(Boolean) ?? [];
  return jsonOk(
    {
      recommendations: engine.recommend({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: searchParams.get("persona"),
        recentlyVisitedPageIds: visited,
        coachPageIds: coach,
        limit: Number(searchParams.get("limit") ?? 8) || 8,
      }),
      analytics: engine.analytics(),
      dashboard: engine.dashboard({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: searchParams.get("persona"),
        recentlyVisitedPageIds: visited,
      }),
    },
    { correlationId: gate.correlationId }
  );
}
