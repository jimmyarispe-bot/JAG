import { createDocumentationService } from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createDocumentationService();
  if (searchParams.get("analyze") === "1" || !searchParams.get("q")) {
    if (!searchParams.get("q") && !searchParams.get("category")) {
      return jsonOk(
        { documentation: service.analyze() },
        { correlationId: gate.correlationId }
      );
    }
  }
  return jsonOk(
    {
      docs: service.search({
        q: searchParams.get("q") ?? undefined,
        category:
          (searchParams.get("category") as
            | "Architecture"
            | "SDK"
            | "Pack"
            | "API"
            | "PER"
            | "Release"
            | "Studio"
            | "Other") || undefined,
      }),
    },
    { correlationId: gate.correlationId }
  );
}
