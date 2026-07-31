import { createDecisionCenterService } from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  return jsonOk(
    { products: createDecisionCenterService().products() },
    { correlationId: gate.correlationId }
  );
}
