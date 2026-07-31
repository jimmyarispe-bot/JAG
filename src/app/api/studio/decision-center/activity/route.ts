import { createDecisionCenterService } from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 50))
  );
  return jsonOk(
    { activity: createDecisionCenterService().activity({ limit }) },
    { correlationId: gate.correlationId }
  );
}
