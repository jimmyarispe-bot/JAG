import {
  evaluateReleaseReadiness,
  type ReleaseStatus,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? "academyos";
  const targetStage =
    (searchParams.get("targetStage") as ReleaseStatus | null) ?? "RC-3";
  return jsonOk(
    {
      readiness: evaluateReleaseReadiness({
        productId,
        targetStage,
      }),
    },
    { correlationId: gate.correlationId }
  );
}
