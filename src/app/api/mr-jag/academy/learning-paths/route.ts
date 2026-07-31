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
  const pathId = searchParams.get("pathId");
  const persona = searchParams.get("persona");
  if (pathId) {
    return jsonOk(
      {
        progress: engine.pathProgress({
          pathId,
          organizationId: gate.organizationId,
          userId: gate.session.userId,
          persona,
        }),
      },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      paths: engine.learningPaths(persona),
      dashboard: engine.dashboard({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona,
        recentlyVisitedPageIds: searchParams.get("visited")?.split(",").filter(Boolean),
      }),
    },
    { correlationId: gate.correlationId }
  );
}
