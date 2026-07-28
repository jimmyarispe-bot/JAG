import { createTreasuryEngine } from "@finance";
import {
  jsonOk,
  requireFinanceOrg,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createTreasuryEngine();
  const { searchParams } = new URL(request.url);
  const concentrationAccountId = searchParams.get("concentrationAccountId");
  const position = engine.cashPosition(gate.organizationId);
  return jsonOk(
    {
      position,
      concentration: concentrationAccountId
        ? engine.planCashConcentration({
            organizationId: gate.organizationId,
            concentrationAccountId,
          })
        : null,
      notifications: engine.listNotifications(gate.organizationId),
      guards: engine.guards,
    },
    { correlationId: gate.correlationId }
  );
}
