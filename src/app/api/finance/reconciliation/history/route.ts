import { createReconciliationEngine } from "@finance";
import {
  jsonOk,
  requireFinanceOrg,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId") ?? undefined;
  const engine = createReconciliationEngine();
  return jsonOk(
    {
      history: engine.listHistory(gate.organizationId, periodId),
      signals: engine.listSignals(gate.organizationId),
      analytics: engine.analytics(gate.organizationId),
      digitalTwin: engine.digitalTwin,
    },
    { correlationId: gate.correlationId }
  );
}
