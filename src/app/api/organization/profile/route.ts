import {
  createUniversalOrganizationEngine,
  type GovernanceProfileId,
  type StrategyMode,
} from "@organization";
import { jsonOk, requireOrgModelOrg, requireOrgModelOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireOrgModelOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("profiles") === "1") {
    return jsonOk(
      { profiles: engine.listProfiles() },
      { correlationId: gate.correlationId }
    );
  }
  const org = engine.get(gate.organizationId);
  return jsonOk(
    {
      organization: org,
      dashboard: org ? engine.dashboard(gate.organizationId) : null,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    legalName?: string;
    displayName?: string;
    governanceProfileId?: GovernanceProfileId;
    tenantOrgType?: string;
    industry?: string;
    mission?: string;
    vision?: string;
    values?: string[];
    strategyMode?: StrategyMode;
  };
  const gate = await requireOrgModelOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const existing = engine.get(gate.organizationId);
  if (existing && !body.legalName) {
    return jsonOk(
      { organization: existing },
      { correlationId: gate.correlationId }
    );
  }
  const organization = engine.bootstrap({
    organizationId: gate.organizationId,
    legalName: body.legalName ?? existing?.identity.legalName ?? "Organization",
    displayName: body.displayName,
    governanceProfileId: body.governanceProfileId,
    tenantOrgType: body.tenantOrgType,
    industry: body.industry,
    mission: body.mission,
    vision: body.vision,
    values: body.values,
    strategyMode: body.strategyMode,
  });
  return jsonOk(
    { organization },
    { correlationId: gate.correlationId, status: existing ? 200 : 201 }
  );
}
