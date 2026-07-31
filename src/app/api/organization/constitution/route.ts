import { createUniversalOrganizationEngine } from "@organization";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireOrgModelOrg,
  requireOrgModelOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireOrgModelOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  return jsonOk(
    {
      constitution: engine.getConstitution(gate.organizationId),
      profile: engine.get(
        gate.organizationId
      )?.identity.governanceProfileId
        ? engine.getProfile(
            engine.get(gate.organizationId)!.identity.governanceProfileId
          )
        : null,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "update" | "advise";
    patch?: Record<string, unknown>;
    adviseAction?: string;
    domain?: string;
    amount?: number;
  };
  const gate = await requireOrgModelOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();

  if (body.action === "advise") {
    return jsonOk(
      {
        advice: engine.advise({
          organizationId: gate.organizationId,
          action: body.adviseAction ?? "general recommendation",
          domain: body.domain,
          amount: body.amount,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const updated = engine.updateConstitution(
    gate.organizationId,
    (body.patch ?? {}) as never
  );
  if ("error" in updated) {
    return jsonError(JagErrors.validation(updated.error));
  }
  return jsonOk(
    { constitution: updated },
    { correlationId: gate.correlationId, status: 201 }
  );
}
