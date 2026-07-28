import {
  createRepositoryIntelligenceService,
  createRepositoryService,
  type RepositoryIndexKind,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("intelligence") === "1") {
    return jsonOk(
      { intelligence: createRepositoryIntelligenceService().analyze() },
      { correlationId: gate.correlationId }
    );
  }
  const service = createRepositoryService();
  if (searchParams.get("scan") === "1" || !searchParams.get("q")) {
    if (!searchParams.get("q") && !searchParams.get("kind")) {
      return jsonOk(
        { repository: service.scan() },
        { correlationId: gate.correlationId }
      );
    }
  }
  return jsonOk(
    {
      entries: service.search({
        kind: (searchParams.get("kind") as RepositoryIndexKind) || undefined,
        q: searchParams.get("q") ?? undefined,
        packageId: searchParams.get("packageId") ?? undefined,
      }),
    },
    { correlationId: gate.correlationId }
  );
}
